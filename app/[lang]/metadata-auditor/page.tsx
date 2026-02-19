'use client';

import React, { useState } from 'react';
import { ShieldAlert, Trash2, ShieldCheck, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { getMetadata, stripMetadata } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
// import { AdSense } from '@/components/shared/AdSense';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function MetadataAuditorPage() {
    const { limits, isPro } = useSubscription();
    const { t } = useTranslation('common');
    const [file, setFile] = useState<File | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [metadata, setMetadata] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            try {
                const data = await getMetadata(files[0]);
                setMetadata(data);
                toast.success('Metadata extracted successfully');
            } catch (_e) {
                toast.error('Failed to read metadata');
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleStripMetadata = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 150);

            const cleanPdfBytes = await stripMetadata(file);
            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([cleanPdfBytes as any], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(blob, `${baseName}_clean.pdf`);

            toast.success('Metadata wiped clean!');
            setFile(null);
            setMetadata(null);
            setProgress(0);
        } catch (error) {
            console.error('Error stripping metadata:', error);
            toast.error('Failed to clean metadata');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="metadataAuditor"
                title={t('tools.metadataAuditor')}
                description={t('tools.metadataAuditorDesc')}
                icon={ShieldAlert}
                color="from-rose-500 to-orange-600"
            />

            <div className="mb-8 max-w-2xl mx-auto">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={() => { setFile(null); setMetadata(null); }}
                    multiple={false}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                />
            </div>

            {metadata && !processing && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <GlassCard className="p-6">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-500" /> Hidden Properties
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Author</span>
                                    <span className="text-white font-mono">{metadata.author || 'None'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Creator App</span>
                                    <span className="text-white font-mono">{metadata.creator || 'None'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">PDF Producer</span>
                                    <span className="text-white font-mono">{metadata.producer || 'None'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Creation Date</span>
                                    <span className="text-white font-mono">{metadata.creationDate?.toLocaleString() || 'None'}</span>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-500" /> Document Info
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Title</span>
                                    <span className="text-white font-mono">{metadata.title || 'None'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Subject</span>
                                    <span className="text-white font-mono">{metadata.subject || 'None'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Keywords</span>
                                    <span className="text-white font-mono">{metadata.keywords || 'None'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-400">Page Count</span>
                                    <span className="text-white font-mono">{metadata.pageCount}</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    <div className="flex flex-col items-center gap-4 bg-slate-900/50 p-8 rounded-2xl border border-white/5">
                        <div className="text-center max-w-md mb-4">
                            <h4 className="text-xl font-bold text-white mb-2">Sanitize this PDF?</h4>
                            <p className="text-slate-400 text-sm">
                                This will permanently remove all the fields above and reset timestamps to 1970 (Unix Epoch) to ensure zero tracking.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            variant="primary"
                            onClick={handleStripMetadata}
                            className="bg-rose-600 hover:bg-rose-700 w-full md:w-auto px-12"
                            icon={<Trash2 className="w-5 h-5" />}
                        >
                            Wipe & Download Clean PDF
                        </Button>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Still 100% Client-Side Processing
                        </p>
                    </div>
                </div>
            )}

            {processing && (
                <div className="max-w-md mx-auto">
                    <ProgressBar progress={progress} label="Anonymizing PDF..." />
                </div>
            )}

            {/* <div className="my-12">
                <AdSense slot="metadata-auditor-bottom" />
            </div> */}

            <ToolContent toolName="/metadata-auditor" />
            <RelatedTools currentToolHref="/metadata-auditor" />
        </div>
    );
}
