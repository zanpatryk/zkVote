/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding', '@gemini-wallet/core', 'porto')
    return config
  },
};

export default nextConfig;
