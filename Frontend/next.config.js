/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable strict mode for better development experience
    reactStrictMode: true,

    // Configure allowed image domains if needed
    images: {
        remotePatterns: [
            {
                hostname: 'localhost',
            },
        ],
    },

    // Environment variables exposed to the browser
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    },
}

module.exports = nextConfig
