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
    return [
      // Communities is Product 02 (/people). Keep one canonical URL.
      { source: '/communities', destination: '/people', permanent: true },
      { source: '/community', destination: '/people', permanent: true },
    ];
  },
};

module.exports = nextConfig;
