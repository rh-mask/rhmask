/** Single source of truth for links and handles used across the site. */
export const SITE = {
  name: "RhMask",
  domain: "rhmask.org",
  url: "https://rhmask.org",
  tagline: "Wall Street sees everything. RhMask sees nothing.",
  description:
    "The privacy layer for tokenized stocks on Robinhood Chain. Receive unseen, pay unseen, and get paid in real stock tokens.",
  x: {
    handle: "@RHmask_",
    url: "https://x.com/RHmask_",
  },
  github: {
    handle: "rh-mask/rhmask",
    url: "https://github.com/rh-mask/rhmask",
  },
  telegram: {
    handle: "t.me/rhmaskorg",
    url: "https://t.me/rhmaskorg",
  },
  explorer: "https://robinhoodchain.blockscout.com",
} as const;

export const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/docs", label: "Docs" },
  { href: "/whitepaper", label: "Whitepaper" },
] as const;
