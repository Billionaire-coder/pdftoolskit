import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pseoPages } from '@/data/pseo';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface Props {
    params: { slug: string };
}

export async function generateStaticParams() {
    return pseoPages.map((page) => ({
        slug: page.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const page = pseoPages.find((p) => p.slug === params.slug);
    if (!page) return {};

    return {
        title: page.title,
        description: page.description,
        openGraph: {
            title: page.title,
            description: page.description,
        },
    };
}

export default function PSEOPage({ params }: Props) {
    const page = pseoPages.find((p) => p.slug === params.slug);

    if (!page) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <div className="text-center mb-12">
                <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                    Specialized PDF Tool
                </div>
                <h1 className="text-3xl md:text-6xl font-heading font-bold gradient-text mb-6">
                    {page.heading}
                </h1>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
                    {page.description}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                    <Link href={page.toolHref}>
                        <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                            Open Tool Now
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
                <GlassCard className="p-6 text-center">
                    <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-white font-bold mb-2">100% Private</h3>
                    <p className="text-slate-400 text-sm">Processed locally in your browser. Files never leave your device.</p>
                </GlassCard>
                <GlassCard className="p-6 text-center">
                    <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-white font-bold mb-2">Instant Speed</h3>
                    <p className="text-slate-400 text-sm">No upload or download wait times. Optimized by WebAssembly.</p>
                </GlassCard>
                <GlassCard className="p-6 text-center">
                    <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h3 className="text-white font-bold mb-2">No Limits</h3>
                    <p className="text-slate-400 text-sm">Completely free with no file size or daily task restrictions.</p>
                </GlassCard>
            </div>

            <GlassCard className="p-8 md:p-12 mb-16">
                <div
                    className="prose prose-invert max-w-none prose-headings:gradient-text prose-a:text-primary hover:prose-a:underline"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </GlassCard>

            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-6">Need more tools?</h2>
                <Link href="/tools" className="text-primary hover:text-primary/80 transition-colors font-medium">
                    View All 20+ PDF Tools &rarr;
                </Link>
            </div>
        </div>
    );
}
