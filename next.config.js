/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    output: 'standalone',
    experimental: {
        serverComponentsExternalPackages: ['muhammara'],
    },
    webpack: (config, { webpack }) => {
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;

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
            'aws-sdk': false,
            'nock': false,
            'mock-aws-s3': false,
        };

        return config;
    },
    swcMinify: true,
    images: {
        formats: ['image/webp', 'image/avif'],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=self, microphone=(), geolocation=(), browsing-topics=()',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Content-Security-Policy',
                        // Merged CSP: Includes Google Ads/Analytics AND HuggingFace/Workers AND Dropbox
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://www.dropbox.com https://apis.google.com https://accounts.google.com https://unpkg.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://pagead2.googlesyndication.com https://www.dropbox.com https://*.googleapis.com https://lh3.googleusercontent.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' blob: data: https://huggingface.co https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://www.google-analytics.com https://www.googletagmanager.com https://www.dropbox.com https://*.dropbox.com https://*.dropboxusercontent.com https://dl.dropboxusercontent.com https://apis.google.com https://accounts.google.com https://*.googleapis.com https://unpkg.com; worker-src 'self' blob: https://unpkg.com; frame-src 'self' https://googleads.g.doubleclick.net https://www.dropbox.com https://accounts.google.com https://content.googleapis.com https://docs.google.com; object-src 'none'; upgrade-insecure-requests;",
                    },
                ],
            },
        ];
    },
}

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
    withBundleAnalyzer(nextConfig),
    {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options

        // Suppresses source map uploading logs during build
        silent: true,
        org: "antigravity",
        project: "pdftoolkit",
    },
    {
        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Transpiles SDK to be compatible with IE11 (increases bundle size)
        transpileClientSDK: true,

        // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
        tunnelRoute: "/monitoring",

        // Hides source maps from generated client bundles
        hideSourceMaps: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors.
        automaticVercelMonitors: true,

        // Disable automatic Pages Router instrumentation as we only use App Router
        disableDefaultPagesInstrumentation: true,
    }
);
