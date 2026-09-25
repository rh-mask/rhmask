/**
 * JSON-RPC client for the CLI.
 *
 * Two things it does that a one-line fetch does not. It retries rate limits and
 * upstream errors with a backoff, and when a network hijacks the RPC domain it
 * re-resolves over DNS-over-HTTPS and pins the answer by IP while still
 * verifying TLS against the real hostname. That second part is not paranoia:
 * the chain's own RPC domain is hijacked by at least one large ISP, which makes
 * a healthy endpoint look dead.
 */
import dns from "node:dns/promises";
import https from "node:https";

export type Network = {
  key: "mainnet" | "testnet";
  chainId: number;
  name: string;
  rpc: string;
  explorer: string;
  /** Deployed contracts, where we have them. */
  announcer?: `0x${string}`;
  registry?: `0x${string}`;
};

export const NETWORKS: Record<string, Network> = {
  mainnet: {
    key: "mainnet",
    chainId: 4663,
    name: "Robinhood Chain",
    rpc: "https://rpc.mainnet.chain.robinhood.com",
    explorer: "https://robinhoodchain.blockscout.com",
    announcer: "0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d",
    registry: "0xa30e5702561bf230ad37ceecd1801c61067996a9",
  },
  testnet: {
    key: "testnet",
    chainId: 46630,
    name: "Robinhood Chain Testnet",
    // The chain's own testnet host is unreachable from some networks; this
    // public mirror answers for the same chain id and is checked on connect.
    rpc: "https://robinhood-sepolia-rpc.publicnode.com",
    explorer: "https://explorer.testnet.chain.robinhood.com",
    // Careful: the registry here shares an address with the ANNOUNCER on
    // mainnet. A CREATE address is just (deployer, nonce), the same throwaway
    // deployer was used on both chains, and the nonces lined up. An address
    // alone does not identify a contract; always carry the chain id with it.
    announcer: "0x5107a69e9d2543a46e2d360060e9dd979b38cb58",
    registry: "0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d",
  },
};

export function pickNetwork(argv: string[]): Network {
  const i = argv.findIndex((a) => a === "--network" || a === "-n");
  const name = i >= 0 ? argv[i + 1] : process.env.RHMASK_NETWORK || "mainnet";
  const net = NETWORKS[name ?? "mainnet"];
  if (!net) throw new Error(`Unknown network "${name}". Use mainnet or testnet.`);
  const override = process.env.RHMASK_RPC_URL;
  return override ? { ...net, rpc: override } : net;
}

const TIMEOUT_MS = 12_000;
const RETRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function resolveOverDoH(hostname: string): Promise<string> {
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, {
    headers: { accept: "application/dns-json" },
  });
  const json = (await res.json()) as { Answer?: Array<{ type: number; data: string }> };
  const a = (json.Answer ?? []).find((x) => x.type === 1);
  if (!a) throw new Error(`DNS-over-HTTPS could not resolve ${hostname}`);
  return a.data;
}

export class Rpc {
  private url: URL;
  private ip = "";
  private id = 0;
  /** True once a DoH answer had to be pinned, so the CLI can say it happened. */
  pinned = false;

  constructor(readonly network: Network) {
    this.url = new URL(network.rpc);
  }

  private once(method: string, params: unknown[]): Promise<unknown> {
    const body = JSON.stringify({ jsonrpc: "2.0", id: ++this.id, method, params });
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          host: this.ip || this.url.hostname,
          servername: this.url.hostname,
          port: 443,
          path: this.url.pathname === "/" ? "/" : this.url.pathname,
          method: "POST",
          timeout: TIMEOUT_MS,
          headers: {
            host: this.url.hostname,
            "content-type": "application/json",
            "content-length": Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              if (json.error) reject(Object.assign(new Error(json.error.message), { data: json.error.data }));
              else resolve(json.result);
            } catch {
              reject(new Error(`bad response (${res.statusCode}) ${data.slice(0, 120)}`));
            }
          });
        },
      );
      req.on("timeout", () => req.destroy(new Error(`timed out after ${TIMEOUT_MS}ms`)));
      req.on("error", reject);
      req.end(body);
    });
  }

  /** Pin the DoH answer when the system resolver disagrees or the host will not answer. */
  private async ensureReachable() {
    if (this.ip || this.url.hostname === "localhost") return;
    const [system, doh] = await Promise.all([
      dns.resolve4(this.url.hostname).catch(() => [] as string[]),
      resolveOverDoH(this.url.hostname).catch(() => ""),
    ]);
    if (doh && system.length && !system.includes(doh)) {
      this.ip = doh;
      this.pinned = true;
      return;
    }
    try {
      await this.once("eth_chainId", []);
    } catch {
      if (doh) {
        this.ip = doh;
        this.pinned = true;
      }
    }
  }

  async call(method: string, params: unknown[] = []): Promise<unknown> {
    await this.ensureReachable();
    let last: unknown;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      try {
        return await this.once(method, params);
      } catch (e) {
        last = e;
        const msg = String(e instanceof Error ? e.message : e);
        const transient = /\b(429|502|503|504)\b|timed out|ECONNRESET|rate limit/i.test(msg);
        if (!transient || attempt === RETRIES) throw e;
        await sleep(400 * 2 ** attempt);
      }
    }
    throw last;
  }

  async chainId(): Promise<number> {
    return Number(BigInt((await this.call("eth_chainId")) as string));
  }

  async blockNumber(): Promise<number> {
    return Number(BigInt((await this.call("eth_blockNumber")) as string));
  }

  async balance(address: string): Promise<bigint> {
    return BigInt((await this.call("eth_getBalance", [address, "latest"])) as string);
  }

  async ethCall(to: string, data: string): Promise<string> {
    return (await this.call("eth_call", [{ to, data }, "latest"])) as string;
  }

  async logs(params: Record<string, unknown>): Promise<Array<Record<string, string | string[]>>> {
    return (await this.call("eth_getLogs", [params])) as Array<Record<string, string | string[]>>;
  }

  /** Fails loudly when the endpoint is serving a different chain than we asked for. */
  async assertChain() {
    const id = await this.chainId();
    if (id !== this.network.chainId) {
      throw new Error(
        `${this.url.hostname} reports chain ${id}, but ${this.network.key} is chain ${this.network.chainId}.`,
      );
    }
    return id;
  }
}
