import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
const MarkdownRenderer = dynamic(() => import('@/components/shared/MarkdownRenderer').then(mod => mod.MarkdownRenderer), { ssr: false });

// ... (existing imports)
import { Calendar, Clock, ArrowLeft, Tag, User } from 'lucide-react';
import { blogPosts } from '@/data/blog-posts';
import { GlassCard } from '@/components/ui/GlassCard';
import { RelatedTools } from '@/components/shared/RelatedTools';

interface BlogPostPageProps {
    params: {
        slug: string;
    };
}

// Generate Metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const post = blogPosts.find((p) => p.slug === params.slug);

    if (!post) {
        return {
            title: 'Post Not Found | PDFToolkit',
        };
    }

    return {
        title: `${post.title} | PDFToolkit Blog`,
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
    const post = blogPosts.find((p) => p.slug === params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            {/* Back Button */}
            <div className="mb-8">
                <Link href="/blog" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Blog
                </Link>
            </div>

            <article>
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mb-6">
                        <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${post.image.includes('gradient') ? post.image : 'bg-blue-500'}`}>
                            {post.category}
                        </span>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{post.readTime}</span>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-center gap-2 text-slate-300">
                        <User className="w-4 h-4" />
                        <span>By {post.author}</span>
                    </div>
                </div>

                {/* Content Card */}
                <GlassCard className="p-8 md:p-12 mb-12">
                    <div className="prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 prose-img:rounded-xl">
                        <MarkdownRenderer>{post.content}</MarkdownRenderer>
                    </div>

                    {/* Tags */}
                    <div className="mt-12 pt-8 border-t border-slate-700">
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm">
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
                <h3 className="text-2xl font-bold text-white mb-8 text-center">Try Our Tools</h3>
                <RelatedTools currentToolHref="/blog" />
            </div>
        </div>
    );
}

// Generate Static Params for SSG
export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}
