nano next.config.jsconst path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

// Solo aplicar configuración especial en Abacus.AI (no en Vercel)
if (process.env.NEXT_DIST_DIR) {
  nextConfig.distDir = process.env.NEXT_DIST_DIR;
}
if (process.env.NEXT_OUTPUT_MODE) {
  nextConfig.output = process.env.NEXT_OUTPUT_MODE;
  nextConfig.experimental = {
    outputFileTracingRoot: path.join(__dirname, '../'),
  };
}

module.exports = nextConfig;
