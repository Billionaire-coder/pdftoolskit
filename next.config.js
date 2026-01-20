/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Enable static optimization for faster loading
    output: 'standalone',
    experimental: {
        serverComponentsExternalPackages: ['muhammara'],
    },
    webpack: (config, { webpack }) => {
        // PDF.js worker configuration
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;

        // Fix for "node:fs" import in client-side bundles (pptxgenjs)
        // We use NormalModuleReplacementPlugin to strip "node:" prefix
        // so that "node:fs" becomes "fs", which is then handled by fallback
        config.plugins.push(
            new webpack.NormalModuleReplacementPlugin(
                /^node:/,
                (resource) => {
                    resource.request = resource.request.replace(/^node:/, "");
                }
            )
        );

        config.resolve.alias['node:fs'] = false;
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            child_process: false,
        };

        return config;
    },
    // Optimize production builds
    swcMinify: true,
    // Image optimization
    images: {
        formats: ['image/webp', 'image/avif'],
    },
    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
}

module.exports = nextConfig
