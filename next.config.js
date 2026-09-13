/** @type {import('next').NextConfig} */

const SELECTED_SITES_BASE_URL = 'https://action-shift-one-seat-v2.never86-d-9722.chatgpt.site';

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
      // Preserve the local Community house-code path.
      { source: '/communities', destination: '/portal', permanent: false },

      // Public owner entry belongs to selected Sites V28. Never86.ai should not
      // create a second lead store or bypass the validated contact path.
      { source: '/contact', destination: `${SELECTED_SITES_BASE_URL}/contact`, permanent: false },
      { source: '/onboard', destination: `${SELECTED_SITES_BASE_URL}/contact`, permanent: false },
      { source: '/login', destination: SELECTED_SITES_BASE_URL, permanent: false },

      // Canonical public handoff checks in selected Sites V28.
      { source: '/check/invoices', destination: `${SELECTED_SITES_BASE_URL}/check/invoices`, permanent: false },
      { source: '/check/labor', destination: `${SELECTED_SITES_BASE_URL}/check/labor`, permanent: false },
      { source: '/check/menu', destination: `${SELECTED_SITES_BASE_URL}/check/menu`, permanent: false },
    ];
  },
  async rewrites() {
    // Sample-shop suck-in stays at /play. Homepage is email-first claim, not open play.
    return [{ source: '/play', destination: '/demo/action-shift.html' }];
  },
};

module.exports = nextConfig;
