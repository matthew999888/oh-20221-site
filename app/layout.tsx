import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

// Canonical origin, used for metadataBase and Open Graph URLs. Must match
// the domain Vercel serves as primary — if these disagree, share cards and
// canonical tags point at the non-canonical host and get deduplicated away
// by search engines. Override with NEXT_PUBLIC_SITE_URL (no trailing slash).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loganjrotc.org";

export const metadata: Metadata = {
  // Required for social/share cards: Next resolves relative image and
  // canonical URLs against this. Without it, Open Graph tags come out
  // relative and most platforms ignore them.
  metadataBase: new URL(SITE_URL),
  title: {
    // Pages set a short `title` (e.g. "Calendar"); this appends the unit
    // so tabs and search results read "Calendar | OH-20221 AFJROTC".
    template: "%s | OH-20221 AFJROTC",
    default: "OH-20221 AFJROTC | Logan High School"
  },
  description: "OH-20221 Air Force Junior ROTC at Logan High School, Logan, Ohio.",
  icons: {
    icon: "/favicon.ico"
  },
  openGraph: {
    type: "website",
    siteName: "OH-20221 AFJROTC",
    locale: "en_US",
    url: SITE_URL
  },
  // A public school unit site should be indexable.
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Space Grotesk carries the display voice: a geometric grotesk
            with squared terminals and a single-storey 'a' — technical and
            forward-looking without tipping into sci-fi novelty, which
            would undercut an institutional site. Inter stays for body
            copy, where Space Grotesk's quirks would tire the eye. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
