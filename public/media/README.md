# Hero video — drop your files here

The home page hero expects these three files. **No code changes are
needed** — add the files and the hero picks them up. Until then the hero
falls back to a purple/navy gradient, so the page still looks finished.

| File | Required | What it is |
|---|---|---|
| `hero.mp4` | **Yes** | H.264 / AAC, 16:9. The main source. |
| `hero.webm` | Recommended | VP9, 16:9. Smaller; served to browsers that support it. |
| `hero-poster.jpg` | Recommended | 16:9 still frame. Shown while the video loads, and instead of it when the visitor has "reduce motion" enabled. |

Filenames are case-sensitive on the server. Put them directly in this
folder: `public/media/hero.mp4`.

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
