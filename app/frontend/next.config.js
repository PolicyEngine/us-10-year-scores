/** @type {import('next').NextConfig} */
const nextConfig = {reactStrictMode: true,
  output: 'export',  // Generate static HTML files
  distDir: 'out',
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Add trailing slashes for cleaner URLs
}

module.exports = nextConfig