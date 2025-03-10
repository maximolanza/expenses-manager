/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar importación de JSON
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    })
    return config
  },
}

module.exports = nextConfig 