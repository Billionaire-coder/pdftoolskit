'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2 } from 'lucide-react';

// Configure worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // eslint-disable-next-line security/detect-object-injection
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFPageViewerProps {
    file: File | null;
    pageNumber: number; // 1-based
    scale?: number;
    onPageLoad?: (width: number, height: number) => void;
    onTextLayerLoaded?: (items: Array<{ str: string, x: number, y: number, width: number, height: number, fontName: string, fontSize: number }>) => void;
    className?: string;
    highlights?: Array<{ x: number, y: number, width: number, height: number, color?: string }>;
}

export function PDFPageViewer({
    file,
    pageNumber,
    scale = 1.0,
    onPageLoad,
    onTextLayerLoaded,
    className,
    highlights
}: PDFPageViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

    // Load Document
    useEffect(() => {
        if (!file) {
            setPdfDoc(null);
            return;
        }

        const loadDoc = async () => {
            setLoading(true);
            setError(null);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const doc = await loadingTask.promise;
                setPdfDoc(doc);
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError('Failed to load PDF document');
            } finally {
                setLoading(false);
            }
        };

        loadDoc();
    }, [file]);

    // Render Page
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let renderTask: any = null;
        let isCancelled = false;

        const renderPage = async () => {
            try {
                if (pageNumber < 1 || pageNumber > pdfDoc.numPages) return;

                const page = await pdfDoc.getPage(pageNumber);
                if (isCancelled) return;

                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;

                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Create new render task
                renderTask = page.render({
                    canvasContext: context,
                    viewport: viewport
                });

                await renderTask.promise;

                if (!isCancelled) {
                    if (onPageLoad) {
                        onPageLoad(viewport.width, viewport.height);
                    }

                    // Extract Text Content
                    if (onTextLayerLoaded) {
                        try {
                            const textContent = await page.getTextContent();
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const items = textContent.items.map((item: any) => {
                                // PDF coordinates from content item
                                const pdfX = item.transform[4];
                                const pdfY = item.transform[5];

                                // Convert to Viewport (Canvas) coordinates
                                // [x, y] is the origin of the text baseline in canvas coords
                                const [x, baselineY] = viewport.convertToViewportPoint(pdfX, pdfY);

                                // Calculate scale roughly
                                const pdfFontSize = Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]);
                                const canvasFontSize = pdfFontSize * scale;
                                // Width is also provided in PDF units, scale it
                                const canvasWidth = item.width * scale;

                                return {
                                    str: item.str,
                                    x: x,
                                    y: baselineY - canvasFontSize, // Top of line
                                    width: canvasWidth,
                                    height: canvasFontSize, // Approximate line height
                                    fontName: item.fontName,
                                    fontSize: canvasFontSize
                                };
                            });
                            onTextLayerLoaded(items);
                        } catch (e) {
                            console.error("Text extraction failed", e);
                        }
                    }

                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (err.name !== 'RenderingCancelledException' && !isCancelled) {
                    console.error('Error rendering page:', err);
                    setError('Failed to render page');
                }
            }
        };

        renderPage();

        return () => {
            isCancelled = true;
            if (renderTask) {
                renderTask.cancel();
            }
        };
    }, [pdfDoc, pageNumber, scale, onPageLoad, onTextLayerLoaded]);

    if (!file) {
        return (
            <div className={`flex items-center justify-center p-8 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed text-slate-500 ${className}`}>
                No file selected
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 rounded-xl">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            <canvas
                ref={canvasRef}
                className="max-w-full h-auto rounded-xl shadow-lg mx-auto block"
            />

            {/* Highlights Overlay */}
            {highlights && highlights.length > 0 && pdfDoc && (
                <div className="absolute inset-0 pointer-events-none mx-auto" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
                    {highlights.map((h, i) => (
                        <div
                            key={i}
                            className="absolute bg-yellow-400/40 mix-blend-multiply transition-all duration-300"
                            style={{
                                left: h.x * scale,
                                top: h.y * scale,
                                width: h.width * scale,
                                height: h.height * scale,
                                backgroundColor: h.color
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
