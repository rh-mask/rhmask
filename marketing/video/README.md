# Trailer: why privacy matters

`rhmask-why-privacy-matters.mp4` · 1920×1080 · 30 fps · 32 s · H.264 + AAC · 15 MB

A short product trailer. Simple moving grounds (drifting grid, scanlines, a hex rain during the
"exposed" beat) with the typography landing in the middle of frame, one idea per beat.

## Beats

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

## The soundtrack

The audio is a **synthesised ambient pad**, generated on the spot from four sine tones (A2, E3, A3, E4)
with slow tremolo, a low-pass and a short echo, fading in and out. It carries no licence and no
attribution, so it is safe to post anywhere.

It is a pad, not a produced track. If you want something with more character, drop a licensed piece in
and re-mux without re-rendering the frames:

```bash
ffmpeg -i rhmask-why-privacy-matters.mp4 -i your-track.mp3 \
  -c:v copy -map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k -shortest out.mp4
```

## Regenerating

Frames are rendered from a single HTML file where every element is a pure function of time, so a frame
at `t` is identical no matter how long the capture takes. Nothing is a CSS animation. Re-render if the
palette, the logo or a claim changes.

## Where it fits

Post it as the opener of a launch run, before the poster sequence in
[`../posters/CAPTIONS.md`](../posters/CAPTIONS.md). Suggested caption:

> Tokenized stocks put your entries, your exits and your whole bag on a public ledger.
>
> We built the layer that takes it back, and we say out loud where the privacy stops.
>
> 32 seconds. rhmask.org
