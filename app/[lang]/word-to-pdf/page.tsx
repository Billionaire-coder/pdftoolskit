'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { wordToPdf } from '@/lib/word-to-pdf';
import { downloadFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function WordToPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            const f = files[0];
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'application/msword', // .doc (Best effort)
            ];

            if (validTypes.includes(f.type) || f.name.endsWith('.docx') || f.name.endsWith('.doc')) {
                setFile(f);
                toast.success('Word document uploaded');
            } else {
                toast.error('Invalid file type. Please upload a Word document (.docx or .doc)');
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        toast.success('File removed');
    };

    const handleConvertToPDF = async () => {
        if (!file) {
            toast.error('Please upload a Word document');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 90));
            }, 300);

            const pdfBytes = await wordToPdf(file);
            clearInterval(progressInterval);
            setProgress(100);

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const filename = file.name.replace(/\.[^/.]+$/, "") + '.pdf';

            setResult({ blob, fileName: filename });

            toast.success('Word converted to PDF successfully!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error converting Word to PDF:', error);
            toast.error('Failed to convert Word document. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="wordToPdf"
                title="Word to PDF Converter"
                description="Convert Microsoft Word documents (DOCX, DOC) to high-quality PDF files."
                icon={FileText}
                color="from-blue-600 to-indigo-500"
            />

            {/* File Upload */}
            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={handleRemoveFile}
                    multiple={false}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                    accept={{
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                        'application/msword': ['.doc']
                    }}
                />
            </div>

            {/* Processing Progress */}
            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Converting Word to PDF..." />
                </div>
            )}

            {/* Result Card */}
            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Conversion Complete!</h3>
                    <p className="text-slate-400 mb-6">Your Word document has been converted to PDF.</p>

                    <div className="flex justify-center">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-md">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 w-full sm:w-auto flex-grow text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full sm:w-auto"
                            >
                                Download PDF
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResult(null)} className="mt-4 text-sm">
                        Convert Another
                    </Button>
                </GlassCard>
            )}

            {/* Actions */}
            {file && !processing && !result && (
                <GlassCard className="p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-semibold mb-1">
                                Ready to convert to PDF
                            </p>
                            <p className="text-sm text-slate-400">
                                Your text and layout will be preserved in a readable PDF
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setFile(null)}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConvertToPDF}
                                loading={processing}
                                icon={<Download className="w-5 h-5" />}
                            >
                                Convert to PDF
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}
            <QuickGuide steps={toolGuides['/word-to-pdf']} />
            <ToolContent toolName="/word-to-pdf" />
            <RelatedTools currentToolHref="/word-to-pdf" />
        </div >
    );
}
