'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lucide } from '@/lib/lucide-registry';
import { GlassCard } from '@/components/ui/GlassCard';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button } from '@/components/ui/Button';
import { convertToPdfA } from '@/lib/services/pdf/standards/pdfA';
import { downloadFile, formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ProcessingOverlay } from '@/components/shared/ProcessingOverlay';
import { saveToHistory } from '@/lib/history-store';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { ToolContent } from '@/components/shared/ToolContent';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { toolGuides } from '@/data/guides';

export default function PdfAPage() {
    const { t } = useTranslation('common');
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            if (files[0].type !== 'application/pdf') {
                toast.error('Please upload a PDF file');
                return;
            }
            setFile(files[0]);
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const buffer = await file.arrayBuffer();
            const pdfABuffer = await convertToPdfA(new Uint8Array(buffer)); // This runs client-side

            const blob = new Blob([pdfABuffer as unknown as BlobPart], { type: 'application/pdf' });

            // Save to history
            await saveToHistory({
                id: crypto.randomUUID(),
                fileName: `PDFA_${file.name}`,
                size: blob.size,
                tool: 'PDF/A Converter',
                blob: blob
            });

            downloadFile(blob, `PDFA_${file.name}`);
            toast.success('Converted to PDF/A-1b (Metadata)');
        } catch (error) {
            console.error(error);
            toast.error('Failed to convert PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <ToolHeader
                toolId="pdfToPdfa"
                title="PDF/A Converter"
                description="Convert your PDFs to PDF/A-1b standard for long-term archiving."
                icon={Lucide.Archive}
                color="from-blue-600 to-indigo-600"
            />

            <GlassCard className="p-8">
                {!file ? (
                    <FileUpload
                        onFilesSelected={handleFileSelect}
                        accept={{ 'application/pdf': ['.pdf'] }}
                        maxSize={50 * 1024 * 1024} // 50MB
                        multiple={false}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 w-full max-w-md">
                            <div className="p-3 rounded-lg bg-red-500/10">
                                <Lucide.FileText className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{file.name}</p>
                                <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <Lucide.X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <Button
                            size="lg"
                            onClick={handleConvert}
                            disabled={isProcessing}
                            className="w-full max-w-xs"
                            icon={<Lucide.Archive className="w-5 h-5" />}
                        >
                            Convert to PDF/A
                        </Button>
                    </div>
                )}
            </GlassCard>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
                <GlassCard className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                        <Lucide.Database className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">XMP Metadata</h3>
                    <p className="text-sm text-slate-400">
                        Injects standard XMP metadata claiming PDF/A-1b conformance.
                    </p>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                        <Lucide.Palette className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">Color Profile</h3>
                    <p className="text-sm text-slate-400">
                        Embeds sRGB OutputIntent to ensure consistent color reproduction.
                    </p>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                        <Lucide.ShieldCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">Archival Ready</h3>
                    <p className="text-sm text-slate-400">
                        Ensures your documents meet basic archival standards.
                    </p>
                </GlassCard>
            </div>

            {isProcessing && <ProcessingOverlay status="Converting to PDF/A..." progress={50} />}

            <QuickGuide steps={toolGuides['/standards/pdf-a']} />
            <ToolContent toolName="/standards/pdf-a" />
            <RelatedTools currentToolHref="/standards/pdf-a" />
        </div>
    );
}
