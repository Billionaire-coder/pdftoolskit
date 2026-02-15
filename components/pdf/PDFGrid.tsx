'use client';

import React from 'react';
import { PDFThumbnail } from './PDFThumbnail';
import { cn } from '@/lib/utils';

interface PDFGridProps {
    file: File;
    pageCount: number;
    selectedPages?: number[]; // 1-based indices
    rotations?: Record<number, number>; // pageIndex (0-based) -> degrees
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
    onPageClick,
    onPageRotate,
    onPageDelete,
    customOverlay,
    customOverlayColor,
    className
}: PDFGridProps) {
    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4", className)}>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                const pageIndex = pageNum - 1;
                const isSelected = selectedPages.includes(pageNum);
                const rotation = rotations[pageIndex] || 0;

                return (
                    <PDFThumbnail
                        key={pageNum}
                        file={file}
                        pageNumber={pageNum}
                        selected={isSelected}
                        rotation={rotation}
                        onClick={onPageClick ? () => onPageClick(pageIndex) : undefined}
                        onRotate={onPageRotate ? (e) => onPageRotate(pageIndex) : undefined}
                        onDelete={onPageDelete ? (e) => onPageDelete(pageIndex) : undefined}
                        overlayIcon={customOverlay ? customOverlay(pageIndex) : undefined}
                        overlayColor={customOverlayColor ? customOverlayColor(pageIndex) : undefined}
                    />
                );
            })}
        </div>
    );
}

export default PDFGrid;
