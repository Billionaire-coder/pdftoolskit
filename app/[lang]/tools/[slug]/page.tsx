import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pseoPages } from '@/data/pseo';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, FileText, RotateCw, Camera, FileType, MessageSquare } from 'lucide-react';
import { CompressTool } from '@/components/tools/CompressTool';
import { MergeTool } from '@/components/tools/MergeTool';
import { RotateTool } from '@/components/tools/RotateTool';
import { ScanTool } from '@/components/tools/ScanTool';
import { PDFToWordTool } from '@/components/tools/PDFToWordTool';
import { ChatTool } from '@/components/tools/ChatTool';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { Lucide } from '@/lib/lucide-registry';

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
                <ToolHeader
                    title={page.heading}
                    description={page.description}
                    toolId={page.slug}
                    iconName="Sparkles"
                    color="from-emerald-500 to-teal-600"
                />

                <div className="text-center mb-10">
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href={page.toolHref}>
                            <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                                Open Full Tool
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Inline Tool Preview */}
                {page.toolHref === '/compress-pdf' && (
                    <div className="max-w-2xl mx-auto mb-16 text-left">
                        <GlassCard className="p-6 border-emerald-500/30">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Quick Start: {page.heading}
                            </h2>
                            <CompressTool initialParams={page.toolParams as any} />
                        </GlassCard>
                    </div>
                )}

                {page.toolHref === '/merge-pdf' && (
                    <div className="max-w-2xl mx-auto mb-16 text-left">
                        <GlassCard className="p-6 border-purple-500/30">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-400" />
                                Quick Start: {page.heading}
                            </h2>
                            <MergeTool />
                        </GlassCard>
                    </div>
                )}

                {page.toolHref === '/rotate-pdf' && (
                    <div className="max-w-2xl mx-auto mb-16 text-left">
                        <GlassCard className="p-6 border-pink-500/30">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <RotateCw className="w-5 h-5 text-pink-400" />
                                Quick Start: {page.heading}
                            </h2>
                            <RotateTool />
                        </GlassCard>
                    </div>
                )}

                {page.toolHref === '/scan-pdf' && (
                    <div className="max-w-2xl mx-auto mb-16 text-left">
                        <GlassCard className="p-6 border-indigo-500/30">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Camera className="w-5 h-5 text-indigo-400" />
                                Quick Start: {page.heading}
                            </h2>
                            <ScanTool />
                        </GlassCard>
                    </div>
                )}

                {page.toolHref === '/pdf-to-word' && (
                    <div className="max-w-2xl mx-auto mb-16 text-left">
                        <GlassCard className="p-6 border-blue-500/30">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FileType className="w-5 h-5 text-blue-400" />
                                Quick Start: {page.heading}
                            </h2>
                            <PDFToWordTool />
                        </GlassCard>
                    </div>
                )}

                {page.toolHref === '/chat-pdf' && (
                    <div className="max-w-4xl mx-auto mb-16 text-left">
                        <GlassCard className="p-6 border-emerald-500/30">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-emerald-400" />
                                Quick Start: {page.heading}
                            </h2>
                            <ChatTool />
                        </GlassCard>
                    </div>
                )}
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
