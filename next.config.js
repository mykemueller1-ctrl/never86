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
    // House-code /portal is the CTAP community seat. Strangers use /onboard.
    return [{ source: '/communities', destination: '/portal', permanent: false }];
  },
  async rewrites() {
    // Sample-shop suck-in stays at /play. Homepage is email-first claim, not open play.
    return [{ source: '/play', destination: '/demo/action-shift.html' }];
  },
};

module.exports = nextConfig;
