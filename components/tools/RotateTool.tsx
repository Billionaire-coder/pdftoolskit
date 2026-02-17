'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { PDFGrid } from '@/components/pdf/PDFGrid';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

export function RotateTool() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [rotations, setRotations] = useState<Record<number, number>>({});

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            setRotations({});
            toast.success('PDF uploaded successfully');

            try {
                const arrayBuffer = await files[0].arrayBuffer();
                const { PDFDocument } = await import('pdf-lib');
                const doc = await PDFDocument.load(arrayBuffer);
                setPageCount(doc.getPageCount());
            } catch (e) {
                console.error("Failed to load PDF", e);
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const rotatePage = (pageIndex: number) => {
        setRotations(prev => ({
            ...prev,
            [pageIndex]: ((prev[pageIndex] || 0) + 90) % 360
        }));
    };

    const rotateAll = () => {
        setRotations(prev => {
            const next = { ...prev };
            for (let i = 0; i < pageCount; i++) {
                next[i] = ((next[i] || 0) + 90) % 360;
            }
            return next;
        });
    };

    const resetRotation = () => {
        setRotations({});
    };

    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleRotatePDF = async () => {
        if (!file) return;

        const hasChanges = Object.values(rotations).some(r => r !== 0);
        if (!hasChanges) {
            toast('No rotation changes to apply', { icon: 'ℹ️' });
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const arrayBuffer = await file.arrayBuffer();
            const { PDFDocument, degrees } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            pages.forEach((page, index) => {
                const rot = rotations[index] || 0;
                if (rot > 0) {
                    const current = page.getRotation().angle;
                    page.setRotation(degrees((current + rot) % 360));
                }
            });

            const rotatedPdfBytes = await pdfDoc.save();
            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([rotatedPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            const outputName = `${baseName}_rotated.pdf`;

            setResult({ blob, fileName: outputName });

            toast.success(`PDF saved successfully!`);
            setFile(null);
            setRotations({});
            setProgress(0);
        } catch (error) {
            console.error('Error rotating PDF:', error);
            toast.error('Failed to rotate PDF');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={() => setFile(null)}
                    multiple={false}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                />
            </div>

            {file && !processing && !result && (
                <div className="space-y-6">
                    <GlassCard className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={rotateAll} icon={<RefreshCw className="w-4 h-4" />} className="text-xs h-9">
                                Rotate All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={resetRotation} className="text-slate-400 text-xs h-9">
                                Reset
                            </Button>
                        </div>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleRotatePDF}
                            loading={processing}
                            icon={<Download className="w-4 h-4" />}
                            className="text-xs h-9"
                        >
                            Save PDF
                        </Button>
                    </GlassCard>

                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <PDFGrid
                            file={file}
                            pageCount={pageCount}
                            rotations={rotations}
                            onPageClick={(idx) => rotatePage(idx)}
                            onPageRotate={(idx) => rotatePage(idx)}
                            customOverlay={(idx) => rotations[idx] ? <div className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">{rotations[idx]}°</div> : null}
                            customOverlayColor={(idx) => rotations[idx] ? "items-start justify-end p-2" : ""}
                        />
                    </div>
                </div>
            )}

            {result && (
                <GlassCard className="p-6 text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <Download className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">PDF Rotated Successfully!</h3>
                    <div className="flex justify-center mt-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-64 text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                            >
                                Download Rotated PDF
                            </Button>
                            <Button variant="ghost" onClick={() => setResult(null)}>
                                Rotate Another
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {processing && (
                <div className="py-6">
                    <ProgressBar progress={progress} label="Rotating PDF..." />
                </div>
            )}
        </div>
    );
}
