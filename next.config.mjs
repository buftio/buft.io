/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  devIndicators: false,
  agentRules: false,
  // we're never run in production, so lets experience the full power of react
  reactStrictMode: false,
}

export default nextConfig
