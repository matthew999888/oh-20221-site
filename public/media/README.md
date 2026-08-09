# Homepage media

Current contents, all committed:

| File | Size | What it is |
|---|---|---|
| `hero.mp4` | 5.1 MB | Looping hero background. 1440px wide, 30.5s, no audio. |
| `hero-poster.jpg` | 0.12 MB | First-frame still. Shown while the video loads, and *instead* of it when the visitor has "reduce motion" enabled. |
| `all-cadets.jpg` | 0.37 MB | Corps group photo, full-bleed band on the homepage. |

## Replacing the hero video

Overwrite `hero.mp4` and `hero-poster.jpg` — no code change needed. The
paths live in `SOURCES`/`POSTER` at the top of
`app/(site)/HeroVideo.tsx`.

The current file was transcoded from a 442 MB APV master
(`Downloads/website.mp4`) with:

```bash
ffmpeg -i website.mp4 -an -c:v libx264 -crf 34 -preset slow \
  -pix_fmt yuv420p -vf "scale=1440:-2" -movflags +faststart hero.mp4

ffmpeg -ss 3 -i website.mp4 -frames:v 1 -q:v 4 \
  -vf "scale=1600:-2" hero-poster.jpg
```

**There is deliberately no WebM.** A VP9 encode of this footage came out
at 12.9 MB against the H.264's 5.1 MB. Because `<source>` elements are
tried in order, offering it first would make VP9-capable browsers
download the *heavier* file. Only add one back if it actually beats the
MP4 on size.

Filenames are case-sensitive on the server.

## Making a good background loop

- **Aspect ratio: 16:9.** The video is `object-fit: cover`, so on phones
  the left and right edges get cropped away. Keep the subject centred —
  do not put anything important near the edges.
- **Length: 6–10 seconds.** Cut on a frame that matches the first frame
  so the loop is seamless.
- **No audio track.** It autoplays muted anyway; stripping audio makes
  the file smaller and means it can never accidentally make noise.
- **Size: under ~4 MB.** Every first-time visitor downloads this,
  including cadets on phone data.
- **Avoid rapid flashing.** Content that flashes more than three times a
  second is a seizure risk and fails WCAG 2.3.1.

## Encoding commands

From a source file `raw.mov`:

```bash
# MP4 (required) — 1080p, no audio, streams before fully downloaded
ffmpeg -i raw.mov -an -c:v libx264 -crf 26 -preset slow \
  -vf "scale=1920:-2" -movflags +faststart hero.mp4

# WebM (recommended) — usually 30-40% smaller than the MP4
ffmpeg -i raw.mov -an -c:v libvpx-vp9 -crf 34 -b:v 0 \
  -vf "scale=1920:-2" hero.webm

# Poster — grab a representative frame (here, 2 seconds in)
ffmpeg -i raw.mov -ss 00:00:02 -vframes 1 -q:v 3 hero-poster.jpg
```

Check the result: `ls -lh hero.*` — if `hero.mp4` is over about 5 MB,
raise `-crf` (28, then 30) and re-encode.

## Changing the filenames

The paths live in one place: `SOURCES` and `POSTER` at the top of
`app/(site)/HeroVideo.tsx`.
