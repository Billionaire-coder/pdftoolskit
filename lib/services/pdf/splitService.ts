/* eslint-disable */
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { applyBranding } from './core';
import { getBaseFileName } from '@/lib/utils';

export interface SplitOptions {
    mode: 'manual' | 'interval' | 'range';
    interval?: number;
    ranges?: string;
    selectedPages?: number[];
}

export class SplitService {
    /**
     * Splits a PDF into multiple separate PDF files bundled in a ZIP
     */
    static async split(file: File, options: SplitOptions): Promise<{ blob: Blob, fileName: string }> {
        const arrayBuffer = await file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer);
        const totalPages = sourcePdf.getPageCount();
        const baseName = getBaseFileName(file.name);

        let splitIndices: number[][] = [];

        if (options.mode === 'manual' && options.selectedPages) {
            // Each selected page becomes a separate file
            splitIndices = options.selectedPages.map(p => [p - 1]);
        } else if (options.mode === 'interval' && options.interval) {
            // Split every N pages
            for (let i = 0; i < totalPages; i += options.interval) {
                const chunk: number[] = [];
                for (let j = 0; j < options.interval && (i + j) < totalPages; j++) {
                    chunk.push(i + j);
                }
                splitIndices.push(chunk);
            }
        } else if (options.mode === 'range' && options.ranges) {
            // Parse custom ranges: "1-5, 8, 10-12"
            const parts = options.ranges.split(',').map(p => p.trim());
            for (const part of parts) {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(n => parseInt(n));
                    if (!isNaN(start) && !isNaN(end)) {
                        const chunk: number[] = [];
                        for (let i = start; i <= end; i++) {
                            if (i >= 1 && i <= totalPages) chunk.push(i - 1);
                        }
                        if (chunk.length > 0) splitIndices.push(chunk);
                    }
                } else {
                    const pageNum = parseInt(part);
                    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                        splitIndices.push([pageNum - 1]);
                    }
                }
            }
        }

        if (splitIndices.length === 0) {
            throw new Error("No pages selected for splitting");
        }

        const zip = new JSZip();

        for (let i = 0; i < splitIndices.length; i++) {
            const indices = splitIndices[i];
            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(sourcePdf, indices);
            copiedPages.forEach(page => newPdf.addPage(page));

            applyBranding(newPdf);
            const pdfBytes = await newPdf.save();

            const rangeStr = indices.length === 1
                ? `page_${indices[0] + 1}`
                : `pages_${indices[0] + 1}-${indices[indices.length - 1] + 1}`;

            zip.file(`${baseName}_${rangeStr}.pdf`, pdfBytes);

            // Critical: Clean up memory between large chunks if possible
            // pdf-lib doesn't have a specific .dispose(), but we ensure no references remain
        }

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        return {
            blob: zipBlob,
            fileName: `${baseName}_split_segments.zip`
        };
    }
}
