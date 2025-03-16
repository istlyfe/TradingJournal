/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: true,
  },
  transpilePackages: [
    "papaparse",
    "axios"
  ],
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, './components'),
      '@/Components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@': path.resolve(__dirname),
    };
    
    // Ensure external packages are properly resolved
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
  trailingSlash: false,
  basePath: '',
};

module.exports = nextConfig; 