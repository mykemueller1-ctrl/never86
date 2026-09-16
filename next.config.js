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
  async headers() {
    return [{source:'/:path*',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    ]}];
  },
  async redirects() {
    return [
      // Preserve the local Community house-code path.
      { source: '/communities', destination: '/portal', permanent: false },
      // Public core win stays on never86.ai. ChatGPT Sites redirects retired.
    ];
  },
  async rewrites() {
    // Sample-shop suck-in stays at /play. Homepage is One Seat, not open play.
    return [{ source: '/play', destination: '/demo/action-shift.html' }];
  },
};

module.exports = nextConfig;
