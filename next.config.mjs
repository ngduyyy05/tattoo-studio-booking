const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Frame-Options', value: 'DENY' }
];

/** @type {import('next').NextConfig} */
export default {
  output: 'standalone',
  // mssql/tedious use Node APIs and must not be bundled.
  serverExternalPackages: ['mssql'],
  // Bundled into the standalone build so the app can create tables on start.
  outputFileTracingIncludes: { '/**': ['./db/schema.sql'] },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  }
};
