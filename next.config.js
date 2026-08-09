const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the file-tracing root to this project. Without it Next walks up
  // and finds a stray package-lock.json in the user's home directory,
  // picks that as the root, and traces files from the wrong tree — which
  // both emits a build warning and can pull unrelated files into the
  // Cloudflare Worker bundle.
  outputFileTracingRoot: path.join(__dirname),

  experimental: {
    serverActions: { bodySizeLimit: '5mb' }
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.neon.tech' }
    ]
  }
};

module.exports = nextConfig;
