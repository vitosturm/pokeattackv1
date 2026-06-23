import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Served behind nginx at jaywee92.de/pokeattack — basePath prefixes all
  // next/link navigation and /_next/ assets so the subpath works.
  basePath: '/pokeattack',
};

export default nextConfig;
