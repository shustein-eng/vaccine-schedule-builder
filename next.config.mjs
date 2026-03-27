/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output is used only for the desktop (Electron) build.
  // Set NEXT_BUILD_STANDALONE=1 to enable (done automatically by electron/build.js).
  // Vercel and normal `next build` skip this.
  ...(process.env.NEXT_BUILD_STANDALONE === '1' ? { output: 'standalone' } : {}),
};

export default nextConfig;
