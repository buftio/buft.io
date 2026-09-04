/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  output: 'standalone',
  devIndicators: false,
  agentRules: false,
  // we're never run in production, so lets experience the full power of react
  reactStrictMode: false,
}

export default nextConfig
