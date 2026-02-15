import { MetadataRoute } from 'next';
import { tools } from '@/data/tools';
import { blogPosts } from '@/data/blog-posts';
import { pseoPages } from '@/data/pseo';
import { i18n } from '@/i18n-config';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://pdftoolkit.com';

    // Helper to generate localized URLs
    const generateLocalizedUrls = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly') => {
        return i18n.locales.map(locale => ({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: new Date(),
            changeFrequency,
            priority,
        }));
    };

    const toolUrls = tools.flatMap((tool) =>
        generateLocalizedUrls(tool.href, 0.8, 'monthly')
    );

    const blogUrls = blogPosts.flatMap((post) =>
        generateLocalizedUrls(`/blog/${post.slug}`, 0.6, 'monthly')
    );

    const pseoUrls = pseoPages.flatMap((page) =>
        generateLocalizedUrls(`/tools/${page.slug}`, 0.7, 'monthly')
    );

    const staticPages = [
        { path: '', priority: 1, freq: 'daily' }, // Home
        { path: '/chat-pdf', priority: 0.9, freq: 'weekly' },
        { path: '/metadata-auditor', priority: 0.8, freq: 'weekly' },
        { path: '/master-organizer', priority: 0.8, freq: 'weekly' },
        { path: '/blog', priority: 0.5, freq: 'daily' },
        { path: '/pricing', priority: 0.8, freq: 'monthly' },
    ] as const;

    const staticUrls = staticPages.flatMap(page =>
        generateLocalizedUrls(page.path, page.priority, page.freq as any)
    );

    return [
        ...staticUrls,
        ...toolUrls,
        ...blogUrls,
        ...pseoUrls,
    ];
}
