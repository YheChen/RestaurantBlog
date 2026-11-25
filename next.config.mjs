/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Kept as an allowlist for any future Commons photo, but venue photos
        // should be vendored into public/photos/venue/ via `npm run photos:venue`
        // instead: Commons rate-limits, and a 429 drops the card to its gradient
        // with no stock photo to fall back on.
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
};

export default nextConfig;
