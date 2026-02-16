import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
const MarkdownRenderer = dynamic(() => import('@/components/shared/MarkdownRenderer').then(mod => mod.MarkdownRenderer), { ssr: false });

// ... (existing imports)
import { Calendar, Clock, ArrowLeft, Tag, User } from 'lucide-react';
import { getBlogPosts } from '@/data/blog-posts';
import { GlassCard } from '@/components/ui/GlassCard';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { BookOpen } from 'lucide-react';

interface BlogPostPageProps {
    params: {
        lang: string;
        slug: string;
    };
}

// Generate Metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const posts = getBlogPosts(params.lang);
    const post = posts.find((p) => p.slug === params.slug);

    if (!post) {
        return {
            title: 'Post Not Found | PDFToolskit',
        };
    }

    return {
        title: `${post.title} | PDFToolskit Blog`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: new Date(post.date).toISOString(),
            authors: [post.author],
            tags: post.tags,
        },
    };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
    const posts = getBlogPosts(params.lang);
    const post = posts.find((p) => p.slug === params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            {/* Back Button */}
            <div className="mb-8">
                <Link href="/blog" className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Blog
                </Link>
            </div>

            <article>
                <ToolHeader
                    title={post.title}
                    description={`${post.date} • ${post.readTime} • By ${post.author}`}
                    iconName="BookOpen"
                    color={`${post.image.includes('gradient') ? post.image : 'from-blue-500 to-indigo-600'}`}
                />

                {/* Content Card */}
                <GlassCard className="p-8 md:p-12 mb-12">
                    <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-300 prose-img:rounded-xl">
                        <MarkdownRenderer>{post.content}</MarkdownRenderer>
                    </div>

                    {/* Tags */}
                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                                    <Tag className="w-3 h-3 mr-2" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </article>

            {/* Related Tools Suggestion */}
            <div className="mt-16">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">Try Our Tools</h3>
                <RelatedTools currentToolHref="/blog" />
            </div>
        </div>
    );
}

// Generate Static Params for SSG
export async function generateStaticParams() {
    const posts = getBlogPosts('en'); // Slugs are currently the same for all languages
    return posts.map((post) => ({
        slug: post.slug,
    }));
}
