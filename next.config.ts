import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import { version } from './package.json';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  allowedDevOrigins: ['konterapp-wsl.linkinvite.id'],
  // Khusus development: paksa asset /_next/* tidak boleh di-cache. Dev server
  // diakses dari HP lewat Cloudflare Tunnel, dan chunk JS di dev pakai path
  // yang TIDAK content-hashed -- kalau Cloudflare/browser menyimpannya, HP
  // bisa dapat HTML baru + JS lama sekaligus, yang muncul sebagai hydration
  // mismatch & tampilan yang tidak ikut berubah walau kode sudah diedit.
  async headers() {
    if (process.env.NODE_ENV === 'production') return [];
    return [
      {
        source: '/_next/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  silent: !process.env.SENTRY_AUTH_TOKEN,
});
