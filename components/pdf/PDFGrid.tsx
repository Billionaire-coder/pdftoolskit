'use client';

import { PDFThumbnail } from './PDFThumbnail';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PDFGridProps {
    file: File;
    pageCount: number;
    selectedPages?: number[]; // 1-based indices
    rotations?: Record<number, number>; // pageIndex (0-based) -> degrees
    fineRotations?: Record<number, number>;
    showGrid?: boolean;
    onPageClick?: (pageIndex: number) => void;
    onPageRotate?: (pageIndex: number) => void;
    onPageDelete?: (pageIndex: number) => void;
    customOverlay?: (pageIndex: number) => React.ReactNode;
    customOverlayColor?: (pageIndex: number) => string;
    className?: string;
}

export function PDFGrid({
    file,
    pageCount,
    selectedPages = [],
    rotations = {},
    fineRotations = {},
    showGrid = false,
    onPageClick,
    onPageRotate,
    onPageDelete,
    customOverlay,
    customOverlayColor,
    className
}: PDFGridProps) {
    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4", className)}>
            <AnimatePresence>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                    const pageIndex = pageNum - 1;
                    const isSelected = selectedPages.includes(pageNum);
                    // eslint-disable-next-line security/detect-object-injection
                    const rotation = rotations[pageIndex] || 0;

                    return (
                        <motion.div
                            key={pageNum}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                            className="w-full"
                        >
                            <PDFThumbnail
                                file={file}
                                pageNumber={pageNum}
                                selected={isSelected}
                                rotation={rotation}
                                // eslint-disable-next-line security/detect-object-injection
                                fineRotation={fineRotations[pageIndex] || 0}
                                showGrid={showGrid}
                                onClick={onPageClick ? () => onPageClick(pageIndex) : undefined}
                                onRotate={onPageRotate ? (_e) => onPageRotate(pageIndex) : undefined}
                                onDelete={onPageDelete ? (_e) => onPageDelete(pageIndex) : undefined}
                                overlayIcon={customOverlay ? customOverlay(pageIndex) : undefined}
                                overlayColor={customOverlayColor ? customOverlayColor(pageIndex) : undefined}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

export default PDFGrid;
