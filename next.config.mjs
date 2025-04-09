let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    webpackBuildWorker: true,
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    nextConfig[key] = typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key]) ? {
        ...nextConfig[key],
        ...config[key],
      } : config[key];
  }
}

export default nextConfig
