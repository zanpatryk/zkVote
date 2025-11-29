/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding', '@gemini-wallet/core', 'porto', 'porto/internal')
    return config
  },
};

export default nextConfig;
