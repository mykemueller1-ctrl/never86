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
  async redirects() {
    // House-code /portal is the only communities seat door.
    return [{ source: '/communities', destination: '/portal', permanent: false }];
  },
  async rewrites() {
    // never86.ai front door = open Action Shift suck-in (no iframe).
    // Marketing story stays at /product.
    return [
      { source: '/', destination: '/demo/action-shift.html' },
      { source: '/play', destination: '/demo/action-shift.html' },
    ];
  },
};

module.exports = nextConfig;
