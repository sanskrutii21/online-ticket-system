/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
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
  // Keeping only the most stable experimental features
  experimental: {
    webpackBuildWorker: true,
  }
}

// Attempt to import user config if it exists
try {
  const userConfig = require('./v0-user-next.config')
  
  // Merge configurations
  for (const key in userConfig) {
    if (typeof nextConfig[key] === 'object' && !Array.isArray(nextConfig[key])) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
} catch (e) {
  // If user config doesn't exist, use default config
  console.log('No user config found, using default configuration')
}

module.exports = nextConfig