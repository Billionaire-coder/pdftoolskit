/* eslint-disable */
import { PDFDocument } from 'pdf-lib';
import { applyBranding } from '../core';

export async function reversePDF(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const totalPages = sourcePdf.getPageCount();
    const reverseIndices = Array.from({ length: totalPages }, (_, i) => totalPages - 1 - i);

    const copiedPages = await newPdf.copyPages(sourcePdf, reverseIndices);
    copiedPages.forEach((page: any) => newPdf.addPage(page));

    applyBranding(newPdf);
    return await newPdf.save();
}

export async function extractPages(file: File, pageRange: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();
    const totalPages = sourcePdf.getPageCount();

    const pageIndices = new Set<number>();
    const parts = pageRange.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= totalPages) pageIndices.add(i - 1);
                }
            }
        } else {
            const pageNum = parseInt(part);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                pageIndices.add(pageNum - 1);
            }
        }
    }

    const indices = Array.from(pageIndices).sort((a, b) => a - b);
    if (indices.length === 0) throw new Error("Invalid page range");

    const copiedPages = await newPdf.copyPages(sourcePdf, indices);
    copiedPages.forEach((page: any) => newPdf.addPage(page));

    applyBranding(newPdf);
    return await newPdf.save();
}

export async function burstPDF(file: File): Promise<File[]> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const totalPages = sourcePdf.getPageCount();
    const files: File[] = [];

    for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(copiedPage);
        applyBranding(newPdf);
        const bytes = await newPdf.save();
        // @ts-ignore - Uint8Array is compatible with BlobPart in practice
        files.push(new File([bytes], `${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`, { type: 'application/pdf' }));
    }

    return files;
}

export async function* convertPDFToImages(
    file: File,
    options: {
        format?: 'png' | 'jpeg';
        scale?: number;
        quality?: number;
    } = {}
): AsyncGenerator<File> {
    const { format = 'png', scale = 2.0, quality = 0.85 } = options;
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');

    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Failed to get canvas context');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        const blob = await new Promise<Blob | null>(resolve =>
            canvas.toBlob(resolve, `image/${format}`, quality)
        );

        if (blob) {
            yield new File(
                [blob],
                `${file.name.replace('.pdf', '')}_page_${i}.${format === 'jpeg' ? 'jpg' : 'png'}`,
                { type: `image/${format}` }
            );
        }

        // Memory cleanup
        canvas.width = 0;
        canvas.height = 0;
        canvas.remove();
        (page as any).cleanup();
    }

    await pdf.destroy();
}
