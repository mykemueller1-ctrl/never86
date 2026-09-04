/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    // Canonical open-play door — first-class URL, no iframe.
    return [{ source: '/play', destination: '/demo/action-shift.html' }];
  },
};

module.exports = nextConfig;
