import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: 'https://pdftoolskit.vercel.app/sitemap.xml',
        host: 'https://pdftoolskit.vercel.app',
    };
}
