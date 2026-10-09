let backendUrl = (process.env.BACKEND_API_URL || 'http://localhost:4000').trim().replace(/\/+$/, '');
if (backendUrl.endsWith('/api')) {
  backendUrl = backendUrl.slice(0, -4);
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com", "plus.unsplash.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

