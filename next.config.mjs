/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export for the desktop (Electron) build — no server needed.
  // Set NEXT_BUILD_DESKTOP=1 to enable (done automatically by electron/build.js).
  // Vercel and normal `next build` skip this.
  ...(process.env.NEXT_BUILD_DESKTOP === '1' ? { output: 'export' } : {}),
};

export default nextConfig;
