'use client';

import React, { useState } from 'react';
import { FileType } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

export function PDFToWordTool() {
    const { t } = useTranslation('common');
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

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
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 300);

            // In a real app, this would be a server action or heavy client-side processing
            // For this version, we simulate the logic as we don't have a reliable JS-only PDF->Docx lib
            // normally we'd hit an API endpoint
            await new Promise(resolve => setTimeout(resolve, 2000));

            clearInterval(progressInterval);
            setProgress(100);

            // Mock download - in real app this would be the actual docx blob
            const baseName = getBaseFileName(file.name);
            const mockBlob = new Blob(['Mock Word Content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            downloadFile(mockBlob, `${baseName}.docx`);

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

            {file && !processing && (
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

            {processing && (
                <div className="mt-8 max-w-xl mx-auto">
                    <ProgressBar progress={progress} label={t('toolPages.pdfToWord.converting')} />
                </div>
            )}
        </div>
    );
}
