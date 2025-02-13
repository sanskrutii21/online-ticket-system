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
  experimental: {
    webpackBuildWorker: true,
  }
}

// Merge function using ES module syntax
const mergeConfigs = (baseConfig, userConfig) => {
  if (!userConfig) return baseConfig;

  const mergedConfig = { ...baseConfig };
  
  for (const key in userConfig) {
    if (typeof baseConfig[key] === 'object' && !Array.isArray(baseConfig[key])) {
      mergedConfig[key] = {
        ...baseConfig[key],
        ...userConfig[key],
      }
    } else {
      mergedConfig[key] = userConfig[key]
    }
  }
  
  return mergedConfig;
}

// Handle user config import
let finalConfig = nextConfig;
try {
  const { default: userConfig } = await import('./v0-user-next.config.js');
  finalConfig = mergeConfigs(nextConfig, userConfig);
} catch (e) {
  console.log('No user config found, using default configuration');
}

export default finalConfig;