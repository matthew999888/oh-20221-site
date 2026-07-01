const DRIVE_FILE_ID_PATTERNS = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/, // https://drive.google.com/file/d/FILE_ID/view
  /[?&]id=([a-zA-Z0-9_-]+)/, // https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  /\/d\/([a-zA-Z0-9_-]+)/ // https://drive.google.com/d/FILE_ID
];

/**
 * Accepts a Google Drive share/view link (or any image URL) and, if it's
 * a Drive link, rewrites it to Drive's thumbnail endpoint, which serves a
 * directly embeddable image at the given pixel width. Non-Drive URLs are
 * returned unchanged.
 */
export function toDriveThumbnail(url: string, width = 1000): string {
  if (!url.includes("drive.google.com")) return url;

  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${width}`;
    }
  }

  return url;
}
