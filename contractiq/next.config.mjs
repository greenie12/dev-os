/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // Don't advertise the framework in responses (adds an X-Powered-By: Next.js header
  // otherwise) — trivial reconnaissance info for an attacker, no benefit to us.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Blocks the app from being framed by another origin — mitigates clickjacking.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stops the browser from guessing content types away from what the server
          // declared — mitigates MIME-sniffing-based XSS.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Legacy header, ignored by modern browsers (superseded by CSP) but still
          // checked by some scanners/labs, so kept for defense-in-depth.
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Don't leak the full referring URL (which can contain contract IDs) to
          // third-party origins when a user follows an external link out of the app.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Deny browser features this app never uses.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
