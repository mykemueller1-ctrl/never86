/** @type {import('next').NextConfig} */

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
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
      // /seat is the public One Seat page. The old bookmark stays on never86.ai.
    ];
  },
  async rewrites() {
    // Sample-shop suck-in stays at /play. Homepage is One Seat, not open play.
    return [{ source: '/play', destination: '/demo/action-shift.html' }];
  },
};

module.exports = nextConfig;
