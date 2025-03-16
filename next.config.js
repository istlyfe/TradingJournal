/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: true,
    // Skip static generation for API routes
    outputFileTracingExcludes: {
      '*': ['node_modules/**/*'],
    },
  },
  // Add option to disable static generation for API routes
  output: 'standalone',
  // Disable edge runtime which is causing issues
  serverComponents: {
    // Skip pre-rendering API routes that use request.url
    allowDynamicValues: true,
  },
  transpilePackages: [
    "papaparse",
    "axios"
  ],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
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