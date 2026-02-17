'use client';

import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Loader2, Check, Trash2, RotateCw } from 'lucide-react';

interface PDFThumbnailProps {
    file: File;
    pageNumber: number;
    width?: number;
    rotation?: number;
    selected?: boolean;
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
    onRotate?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    overlayIcon?: React.ReactNode;
    overlayColor?: string; // Tailwind class, e.g. "bg-red-500/50"
}

export const PDFThumbnail = React.memo(function PDFThumbnail({
    file,
    pageNumber,
    width = 200,
    rotation = 0,
    selected = false,
    disabled = false,
    className,
    onClick,
    onRotate,
    onDelete,
    overlayIcon,
    overlayColor
}: PDFThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let worker: Worker | null = null;
        let isCancelled = false;

        const renderPage = async () => {
            setLoading(true);
            setError(false);

            if (typeof window !== 'undefined') {
                try {
                    // Pass file directly to worker

                    // Try SharedWorker first (Phase 7 requirement)
                    if (window.SharedWorker) {
                        const sharedWorker = new SharedWorker(new URL('@/worker/pdf.shared.worker.ts', import.meta.url));
                        worker = sharedWorker as unknown as Worker; // Handle as generic worker for cleanup

                        sharedWorker.port.onmessage = (e) => {
                            if (isCancelled) return;
                            handleMessage(e.data);
                        };

                        sharedWorker.port.postMessage({
                            type: 'RENDER_THUMBNAIL',
                            file, // Send file directly
                            pageNumber,
                            scale: width / 200,
                        });
                        sharedWorker.port.start();
                    } else if (window.Worker) {
                        // Fallback to dedicated worker
                        worker = new Worker(new URL('@/worker/pdf.worker.ts', import.meta.url));
                        worker.onmessage = (e) => {
                            if (isCancelled) return;
                            handleMessage(e.data);
                        };
                        worker.postMessage({
                            type: 'RENDER_THUMBNAIL',
                            file, // Send file directly
                            pageNumber,
                            scale: width / 200,
                        });
                    } else {
                        throw new Error('Worker not supported');
                    }
                } catch (err) {
                    console.error('Worker failed:', err);
                    setError(true);
                    setLoading(false);
                }
            }
        };

        const handleMessage = (data: any) => {
            const { type, bitmap, message } = data;
            if (type === 'THUMBNAIL_SUCCESS') {
                const canvas = canvasRef.current;
                if (canvas && bitmap) {
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(bitmap, 0, 0);
                    }
                    bitmap.close();
                    setLoading(false);
                }
            } else if (type === 'ERROR') {
                console.error('Worker Error:', message);
                setError(true);
                setLoading(false);
            }
        };

        renderPage();

        return () => {
            isCancelled = true;
            if (worker) {
                if (worker instanceof Worker) {
                    worker.terminate();
                }
            }
        };
    }, [file, pageNumber, width]);

    return (
        <div
            className={cn(
                "relative group transition-all duration-200",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105",
                className
            )}
            onClick={!disabled ? onClick : undefined}
        >
            {/* Main Container */}
            <div className={cn(
                "rounded-lg overflow-hidden shadow-md bg-white transition-all",
                selected ? "ring-4 ring-blue-500 shadow-blue-500/50" : "ring-1 ring-slate-700 hover:ring-blue-400"
            )}>
                {/* Canvas */}
                <div className="relative bg-slate-100 min-h-[150px] flex items-center justify-center">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-red-400 text-xs">
                            <span className="text-2xl mb-1">⚠️</span>
                            Failed
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className="max-w-full h-auto"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: 'transform 0.3s ease'
                        }}
                    />

                    {/* Overlay (Deletion / Selection / Custom) */}
                    {(selected || overlayIcon) && (
                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center transition-opacity",
                            overlayColor || (selected ? "bg-blue-500/20" : "")
                        )}>
                            {overlayIcon ? overlayIcon : (selected && <Check className="w-12 h-12 text-blue-500 drop-shadow-md" />)}
                        </div>
                    )}
                </div>
            </div>

            {/* Page Number Badge */}
            <div className="absolute bottom-2 left-2 bg-slate-800/80 text-white text-xs px-2 py-1 rounded shadow-sm">
                Page {pageNumber}
            </div>

            {/* Hover Actions */}
            {!disabled && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onRotate && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRotate(e); }}
                            className="p-1.5 bg-slate-800/80 text-white rounded hover:bg-blue-600 transition-colors"
                            title="Rotate"
                            aria-label={`Rotate Page ${pageNumber}`}
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                            className="p-1.5 bg-slate-800/80 text-white rounded hover:bg-red-600 transition-colors"
                            title="Remove"
                            aria-label={`Delete Page ${pageNumber}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

export default PDFThumbnail;
