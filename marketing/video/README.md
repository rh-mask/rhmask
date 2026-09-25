# Video and motion assets

Four rendered files. All of them are build output and none is tracked; the sources they come from are in
[`src/`](src/), which is.

| File | Size | What it is |
|:--|:--|:--|
| `rhmask-buybot.mp4` | 640×640 · 30 fps · 6 s · 295 KB | The buybot notification loop for Telegram |
| `rhmask-token-sticker.webm` | 512×512 · 30 fps · 2 s · 237 KB | The spinning token as a Telegram video sticker |
| `rhmask-token-emoji.webm` | 100×100 · 30 fps · 2 s · 26 KB | The same token as a Telegram custom emoji |
| `rhmask-why-privacy-matters.mp4` | 1920×1080 · 30 fps · 32 s · 15 MB | The product trailer |

---

## The buybot loop

`rhmask-buybot.mp4` — a terminal that types `rhmask watch --buys`, reports that it is listening on chain
4663, then raises `BUY DETECTED` while the token turns in the middle of frame. Everything fades out over
the last half second so the loop point is invisible, and the token's spin period divides the clip exactly,
so it never jumps.

**It carries no numbers, deliberately.** A buybot plays the same clip for every buy; the amount, the buyer
and the transaction belong in the message text beside it, where they are actually true. A clip with a
figure burned into it is wrong for all but one buy.

H.264, `yuv420p`, no audio, `+faststart`. That combination plays inline on every Telegram client.

## The token

A real cylinder rather than a picture that flips: two faces plus a rim built from 64 tangent plates, each
shaded by how far it faces the camera, so the coin keeps its body as it turns edge-on. A fixed −20°
tilt keeps the face readable at every angle, and the rim is 13% of the diameter for the same reason — a
thinner coin disappears for a beat twice per turn.

### Telegram limits it was built against

| | Sticker | Custom emoji |
|:--|:--|:--|
| Format | WebM, VP9, alpha | WebM, VP9, alpha |
| Size | 512×512 | 100×100 |
| Duration | ≤ 3 s | ≤ 3 s |
| File | ≤ 256 KB — ours is 237 KB | ≤ 64 KB — ours is 26 KB |

**About the alpha.** `ffprobe` reports the stream as `yuv420p`, not `yuva420p`, which looks wrong and is
not. VP9 in WebM carries alpha as a separate layer and signals it with the container flag `alpha_mode: 1`,
which both files have. It was verified the only way that settles it: decode a frame back to RGBA and read
the pixels. Corner `0,0,0,0`, centre opaque.

Upload both through **@Stickers** on Telegram. A custom emoji set needs Premium on the account that
creates it; anyone can then use it.

## Regenerating

Every scene is a single HTML file in [`src/`](src/) where each element is a pure function of time: the page
exposes `setT(seconds)` and animates nothing by itself, so a frame at `t` is identical whether the capture
took a second or an hour. Re-render whenever the palette, the mark or a claim changes.

Chrome must already be listening on `127.0.0.1:9333` with remote debugging.

```bash
# 1. frames
node src/render-frames.mjs "file:///abs/path/src/buybot.html" ./frames-buybot 640 640 30
node src/render-frames.mjs "file:///abs/path/src/coin.html?d=430&spin=2&n=80" ./frames-coin 512 512 30 transparent

# 2. the buybot loop
ffmpeg -framerate 30 -i frames-buybot/f%05d.png \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -an rhmask-buybot.mp4

# 3. the sticker and the emoji
ffmpeg -framerate 30 -i frames-coin/f%05d.png \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 34 -an -auto-alt-ref 0 rhmask-token-sticker.webm
ffmpeg -framerate 30 -i frames-coin/f%05d.png -vf "scale=100:100:flags=lanczos" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 40 -an -auto-alt-ref 0 rhmask-token-emoji.webm
```

`-auto-alt-ref 0` is not optional: with alt-ref frames on, libvpx drops the alpha layer.

If a file creeps over a Telegram limit, raise `-crf` rather than cutting the duration. The loop only works
because the spin completes.

---

## Trailer: why privacy matters

`rhmask-why-privacy-matters.mp4` · 1920×1080 · 30 fps · 32 s · H.264 + AAC · 15 MB

A short product trailer. Simple moving grounds (drifting grid, scanlines, a hex rain during the
"exposed" beat) with the typography landing in the middle of frame, one idea per beat.

### Beats

| Time | Beat |
|:--|:--|
| 0:00 | `guest@rhmask:~$ whoami` types in on a blinking cursor |
| 0:04 | "Wall Street sees everything." |
| 0:08 | "RhMask sees nothing." |
| 0:12 | "Your portfolio is a public document." over the hex rain |
| 0:16 | Ghost Receive: one meta-address fans out into one-time addresses |
| 0:20 | Private Pay: three scans, zero servers |
| 0:24 | Keys never leave this device, over a turning isometric slab |
| 0:27 | Where the privacy stops, in plus and minus lines |
| 0:30 | Logo, rhmask.org, @RHmask_ |

### The soundtrack

The audio is a **synthesised ambient pad**, generated on the spot from four sine tones (A2, E3, A3, E4)
with slow tremolo, a low-pass and a short echo, fading in and out. It carries no licence and no
attribution, so it is safe to post anywhere.

It is a pad, not a produced track. If you want something with more character, drop a licensed piece in
and re-mux without re-rendering the frames:

```bash
ffmpeg -i rhmask-why-privacy-matters.mp4 -i your-track.mp3 \
  -c:v copy -map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k -shortest out.mp4
```

### Where it fits

Post it as the opener of a launch run, before the poster sequence in
[`../posters/CAPTIONS.md`](../posters/CAPTIONS.md). Suggested caption:

> Tokenized stocks put your entries, your exits and your whole bag on a public ledger.
>
> We built the layer that takes it back, and we say out loud where the privacy stops.
>
> 32 seconds. rhmask.org
