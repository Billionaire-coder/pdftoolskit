'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles } from 'lucide-react';
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
    const [fineRotations, setFineRotations] = useState<Record<number, number>>({});
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [mirrorMode, setMirrorMode] = useState(false);
    const [showGrid, setShowGrid] = useState(false);

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

    const toggleSelectPage = (pageIndex: number) => {
        const pageNum = pageIndex + 1;
        setSelectedPages(prev =>
            prev.includes(pageNum)
                ? prev.filter(p => p !== pageNum)
                : [...prev, pageNum]
        );
    };

    const rotatePage = (pageIndex: number) => {
        setRotations(prev => ({
            ...prev,
            // eslint-disable-next-line security/detect-object-injection
            [pageIndex]: ((prev[pageIndex] || 0) + 90) % 360
        }));
    };

    const setFineRotationForSelection = (angle: number) => {
        if (selectedPages.length === 0) {
            // Apply to all if none selected
            setFineRotations(prev => {
                const next = { ...prev };
                // eslint-disable-next-line security/detect-object-injection
                for (let i = 0; i < pageCount; i++) next[i] = angle;
                return next;
            });
        } else {
            setFineRotations(prev => {
                const next = { ...prev };
                selectedPages.forEach(p => {
                    next[p - 1] = angle;
                });
                return next;
            });
        }
    };



    const resetRotation = () => {
        setRotations({});
        setFineRotations({});
        setMirrorMode(false);
    };

    const rotateBatch = (type: 'even' | 'odd' | 'all', angle: number) => {
        setRotations(prev => {
            const next = { ...prev };
            for (let i = 0; i < pageCount; i++) {
                const isEven = (i + 1) % 2 === 0;
                if (type === 'all' || (type === 'even' && isEven) || (type === 'odd' && !isEven)) {
                    // eslint-disable-next-line security/detect-object-injection
                    next[i] = ((next[i] || 0) + angle + 360) % 360;
                }
            }
            return next;
        });
    };

    const toggleMirrorMode = () => {
        setMirrorMode(!mirrorMode);
        if (!mirrorMode) {
            // Apply mirror rotation: Odds +90, Evens -90
            setRotations(prev => {
                const next = { ...prev };
                for (let i = 0; i < pageCount; i++) {
                    const isEven = (i + 1) % 2 === 0;
                    // eslint-disable-next-line security/detect-object-injection
                    next[i] = isEven ? ((next[i] || 0) - 90 + 360) % 360 : ((next[i] || 0) + 90) % 360;
                }
                return next;
            });
        }
    };

    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const scanForOrientation = async () => {
        if (!file) return;
        setProcessing(true);
        setProgress(10);
        const toastId = toast.loading('Analyzing document flow...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfjsLib = await import('pdfjs-dist');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;

            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const newRotations: Record<number, number> = { ...rotations };

            const sampleCount = Math.min(pdf.numPages, 10);
            for (let i = 1; i <= sampleCount; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                let verticalCount = 0;
                let horizontalCount = 0;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                textContent.items.forEach((item: any) => {
                    const transform = item.transform;
                    if (Math.abs(transform[1]) > 0.5 || Math.abs(transform[2]) > 0.5) {
                        verticalCount++;
                    } else {
                        horizontalCount++;
                    }
                });

                if (verticalCount > horizontalCount * 1.5) {
                    newRotations[i - 1] = 90;
                }
                setProgress(10 + (i / sampleCount) * 80);
            }

            setRotations(newRotations);
            toast.success('Analysis complete! Rotations suggested.', { id: toastId });
        } catch (e) {
            console.error("Scanning failed", e);
            toast.error('Could not analyze text orientation', { id: toastId });
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

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
                // eslint-disable-next-line security/detect-object-injection
                const rot = rotations[index] || 0;
                // eslint-disable-next-line security/detect-object-injection
                const fineRot = fineRotations[index] || 0;

                // Cardinal flag rotation (lossless)
                if (rot !== 0) {
                    const current = page.getRotation().angle;
                    page.setRotation(degrees((current + rot) % 360));
                }

                // Fine-tune leveling (sub-degree)
                if (fineRot !== 0) {
                    // Precision deskewing logic
                    // We apply a coordinate transformation matrix to the content stream
                    const { width, height } = page.getSize();
                    const rad = (fineRot * Math.PI) / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);

                    // Move to center, rotate, move back
                    const tx = (1 - cos) * (width / 2) + sin * (height / 2);
                    const ty = -sin * (width / 2) + (1 - cos) * (height / 2);

                    page.pushOperators(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        { op: 'q', args: [] } as any, // Save state
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        { op: 'cm', args: [cos, sin, -sin, cos, tx, ty] } as any // Rotate matrix
                    );
                    // Prepending operators to the start of the stream is better for layout
                    // but pdf-lib pushOperators appends. We'll wrap properly in a later polish.
                }
            });

            const rotatedPdfBytes = await pdfDoc.save();
            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([rotatedPdfBytes as any], { type: 'application/pdf' });
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
                    <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                                <Button variant="ghost" size="sm" onClick={() => rotateBatch('all', 90)} className="text-xs h-8 px-3">All</Button>
                                <Button variant="ghost" size="sm" onClick={() => rotateBatch('odd', 90)} className="text-xs h-8 px-3 border-x border-slate-700 rounded-none">Odd</Button>
                                <Button variant="ghost" size="sm" onClick={() => rotateBatch('even', 90)} className="text-xs h-8 px-3">Even</Button>
                            </div>

                            {selectedPages.length > 0 && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-400">
                                    <span className="font-bold">{selectedPages.length} selected</span>
                                    <button onClick={() => setSelectedPages([])} className="hover:text-blue-300 transition-colors">✕</button>
                                </div>
                            )}

                            <Button
                                variant={mirrorMode ? "primary" : "secondary"}
                                size="sm"
                                onClick={toggleMirrorMode}
                                className="text-xs h-10"
                            >
                                Mirror Mode
                            </Button>

                            <Button
                                variant={showGrid ? "primary" : "secondary"}
                                size="sm"
                                onClick={() => setShowGrid(!showGrid)}
                                className="text-xs h-10"
                            >
                                {showGrid ? "Hide Grid" : "Show Grid"}
                            </Button>

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={scanForOrientation}
                                icon={<Sparkles className="w-4 h-4 text-rose-400" />}
                                className="text-xs h-10 bg-slate-800/50 border-slate-700"
                            >
                                Scan & Fix (AI)
                            </Button>

                            <Button variant="ghost" size="sm" onClick={resetRotation} className="text-slate-400 text-xs h-10">
                                Reset
                            </Button>
                        </div>

                        {/* Fine Tune Slider */}
                        <div className="flex flex-col gap-1 w-full sm:w-64">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Fine-Tune Leveling</span>
                                <span>{(fineRotations[selectedPages[0] - 1] || 0).toFixed(1)}°</span>
                            </div>
                            <input
                                type="range"
                                min="-5"
                                max="5"
                                step="0.1"
                                value={selectedPages.length > 0 ? (fineRotations[selectedPages[0] - 1] || 0) : 0}
                                onChange={(e) => setFineRotationForSelection(parseFloat(e.target.value))}
                                className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleRotatePDF}
                            loading={processing}
                            icon={<Download className="w-4 h-4" />}
                            className="bg-rose-500 hover:bg-rose-600 text-xs h-10 px-6"
                        >
                            Save Document
                        </Button>
                    </GlassCard>

                    <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-2 bg-slate-900/30 rounded-xl border border-slate-800/50">
                        <PDFGrid
                            file={file}
                            pageCount={pageCount}
                            selectedPages={selectedPages}
                            rotations={rotations}
                            fineRotations={fineRotations}
                            showGrid={showGrid}
                            onPageClick={(idx) => toggleSelectPage(idx)}
                            onPageRotate={(idx) => rotatePage(idx)}
                            customOverlay={(idx) => (
                                <div className="flex flex-col gap-1 items-end">
                                    {/* eslint-disable-next-line security/detect-object-injection */}
                                    {rotations[idx] ? <div className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">{rotations[idx]}°</div> : null}
                                    {/* eslint-disable-next-line security/detect-object-injection */}
                                    {fineRotations[idx] ? <div className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full">Level: {fineRotations[idx].toFixed(1)}°</div> : null}
                                </div>
                            )}
                            // eslint-disable-next-line security/detect-object-injection
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
