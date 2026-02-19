'use client';

import React, { useState, useEffect } from 'react';
import { FileType, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { pdfToWord } from '@/lib/services/pdf/converters/pdfToWord';

export function PDFToWordTool() {
    const { t } = useTranslation('common');
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
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success(t('toasts.fileSelected'));
        } else {
            toast.error(validation.error || t('toasts.invalidFile'));
        }
    };

    const handleConvertToWord = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 95));
            }, 500);

            const { data, isScanned } = await pdfToWord(file);

            clearInterval(progressInterval);
            setProgress(100);

            if (isScanned) {
                toast.success("Detected scanned PDF. Used OCR for better results.");
            }

            const baseName = getBaseFileName(file.name);
            const outputName = `${baseName}.docx`;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([data.buffer as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

            setResult({ blob, fileName: outputName });

            toast.success(t('toasts.convertSuccess'));
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error converting PDF to Word:', error);
            toast.error(t('toasts.convertError'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="w-full">
            <FileUpload
                onFilesSelected={handleFileSelected}
                files={file ? [file] : []}
                onRemoveFile={() => setFile(null)}
                multiple={false}
                maxSize={limits.maxFileSize}
                isPro={isPro}
            />

            {file && !processing && !result && (
                <div className="mt-8 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleConvertToWord}
                        icon={<FileType className="w-6 h-6" />}
                        className="px-10 py-7 text-xl shadow-blue-500/25 shadow-2xl"
                    >
                        {t('toolPages.pdfToWord.button')}
                    </Button>
                </div>
            )}

            {result && (
                <div className="mt-8 flex justify-center animate-in zoom-in-95 duration-500">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 shadow-xl text-center backdrop-blur-sm max-w-md w-full">
                        <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileType className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Conversion Complete!</h3>
                        <div className="flex flex-col gap-4 mt-6">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 w-full text-center"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full"
                            >
                                Download Word Doc
                            </Button>
                            <Button variant="ghost" onClick={() => setResult(null)} className="text-sm text-slate-400">
                                Convert Another
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {processing && (
                <div className="mt-8 max-w-xl mx-auto">
                    <ProgressBar progress={progress} label={t('toolPages.pdfToWord.converting')} />
                </div>
            )}
        </div>
    );
}
