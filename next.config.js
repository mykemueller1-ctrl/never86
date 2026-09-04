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
    // never86.ai front door = open Action Shift suck-in (no iframe).
    // Marketing homepage kept at /product.
    return [
      { source: '/', destination: '/demo/action-shift.html' },
      { source: '/play', destination: '/demo/action-shift.html' },
    ];
  },
};

module.exports = nextConfig;
