import { PDFDocument, degrees, rgb } from 'pdf-lib';
import { applyBranding } from '../core';
import { parsePageRange } from '@/lib/utils';

export async function cropPDF(
    file: File,
    margins: { top: number; bottom: number; left: number; right: number },
    options?: {
        pageRange?: string;
        perPageCrops?: Record<number, {
            top: number; bottom: number; left: number; right: number;
            mode?: 'keep' | 'remove'; // Default 'keep'
        }>;
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // CASE A: Specific Per-Page Crops (Advanced Mode)
    if (options?.perPageCrops && Object.keys(options.perPageCrops).length > 0) {
        const pages = pdfDoc.getPages();

        Object.entries(options.perPageCrops).forEach(([pageIndexStr, config]) => {
            const index = parseInt(pageIndexStr, 10);
            if (index >= 0 && index < pages.length) {
                const page = pages[index];
                const { x, y, width, height } = page.getMediaBox();

                const newX = x + config.left;
                const newY = y + config.bottom;
                const newWidth = width - config.left - config.right;
                const newHeight = height - config.top - config.bottom;

                if (newWidth > 0 && newHeight > 0) {
                    if (config.mode === 'remove') {
                        page.drawRectangle({
                            x: newX,
                            y: newY,
                            width: newWidth,
                            height: newHeight,
                            color: rgb(1, 1, 1),
                        });
                    } else {
                        page.setMediaBox(newX, newY, newWidth, newHeight);
                    }
                }
            }
        });
    }
    // CASE B: Global Margins with optional Range (Simple Mode)
    else {
        const totalPages = pdfDoc.getPageCount();
        const pageIndices = parsePageRange(options?.pageRange || '', totalPages);

        const pages = pdfDoc.getPages();
        pages.forEach((page: any, index: number) => {
            if (!pageIndices.includes(index)) return;

            const { x, y, width, height } = page.getMediaBox();

            const newX = x + margins.left;
            const newY = y + margins.bottom;
            const newWidth = width - margins.left - margins.right;
            const newHeight = height - margins.top - margins.bottom;

            if (newWidth > 0 && newHeight > 0) {
                page.setMediaBox(newX, newY, newWidth, newHeight);
            }
        });
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function flattenPDF(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();

    try {
        form.flatten();
    } catch {
        // No form fields or already flattened
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}


export async function mergePDFs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    applyBranding(mergedPdf);
    return await mergedPdf.save();
}

export async function splitPDF(file: File, pageRanges: { start: number; end: number }[]): Promise<Uint8Array[]> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const results: Uint8Array[] = [];

    for (const range of pageRanges) {
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(
            sourcePdf,
            Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i)
        );
        pages.forEach((page) => newPdf.addPage(page));
        applyBranding(newPdf);
        results.push(await newPdf.save());
    }

    return results;
}

export async function removePagesFromPDF(file: File, pageIndicesToRemove: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i)
        .filter(i => !pageIndicesToRemove.includes(i));

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, pagesToKeep);
    copiedPages.forEach((page) => newPdf.addPage(page));

    applyBranding(newPdf);
    return await newPdf.save();
}

export async function rotatePDF(file: File, rotation: 90 | 180 | 270): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    pages.forEach((page: any) => {
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + rotation) % 360;
        page.setRotation(degrees(newRotation));
    });

    applyBranding(pdf);
    return await pdf.save();
}

export async function organizePDF(file: File, newPageOrder: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const copiedPages = await newPdf.copyPages(sourcePdf, newPageOrder);
    copiedPages.forEach((page) => newPdf.addPage(page));

    applyBranding(newPdf);
    return await newPdf.save();
}
