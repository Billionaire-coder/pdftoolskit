
import { PDFDocument, PageSizes } from 'pdf-lib';

export type PrintSize = 'original' | 'a4' | 'letter';

interface PrintOptions {
    dpi: number; // Default 300
    pageSize: PrintSize;
}

/**
 * Converts images to a "Print Ready" PDF.
 * Key difference: It enforces physical dimensions based on DPI, rather than 
 * just "fitting to screen" or generic 72 DPI.
 */
export async function convertImagesToPrintPdf(
    files: Array<{ buffer: ArrayBuffer; type: string }>,
    options: PrintOptions = { dpi: 300, pageSize: 'original' }
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Set Creator Metadata
    pdfDoc.setCreator('PDFToolskit (Print Engine)');
    pdfDoc.setProducer('PDFToolskit Precision');

    for (const file of files) {
        let image;
        try {
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                image = await pdfDoc.embedJpg(file.buffer);
            } else if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(file.buffer);
            } else {
                continue; // Skip unsupported
            }
        } catch (e) {
            console.error('Failed to embed image', e);
            continue;
        }

        const { width: widthPx, height: heightPx } = image;

        // Calculate physical size in points (1/72 inch) based on target DPI
        // Formula: (Pixels / DPI) * 72 = Points
        const widthPts = (widthPx / options.dpi) * 72;
        const heightPts = (heightPx / options.dpi) * 72;

        let pageWidth = widthPts;
        let pageHeight = heightPts;
        let drawWidth = widthPts;
        let drawHeight = heightPts;
        let drawX = 0;
        let drawY = 0;

        if (options.pageSize === 'a4') {
            [pageWidth, pageHeight] = PageSizes.A4;
            // Fit logic: Scale down if strictly necessary, or center? 
            // "Print Ready" usually implies max quality. 
            // Let's implement "Scale to Fit" preserving aspect ratio for A4
            const scaleX = pageWidth / widthPts;
            const scaleY = pageHeight / heightPts;
            // Usually print ready means "fit to page".
            // Let's use min(scaleX, scaleY) to fit entirely.
            // But if image is smaller than A4 @ 300dpi, do we upscale? 
            // Upscaling reduces quality. Let's cap at 1.0 scaling (no upscaling) unless user wants it.
            // For now, simple "contain" logic.
            const finalScale = Math.min(scaleX, scaleY);

            drawWidth = widthPts * finalScale;
            drawHeight = heightPts * finalScale;

            // Center
            drawX = (pageWidth - drawWidth) / 2;
            drawY = (pageHeight - drawHeight) / 2;
        } else if (options.pageSize === 'letter') {
            [pageWidth, pageHeight] = PageSizes.Letter;
            const scaleX = pageWidth / widthPts;
            const scaleY = pageHeight / heightPts;
            const finalScale = Math.min(scaleX, scaleY);
            drawWidth = widthPts * finalScale;
            drawHeight = heightPts * finalScale;
            drawX = (pageWidth - drawWidth) / 2;
            drawY = (pageHeight - drawHeight) / 2;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(image, {
            x: drawX,
            y: drawY,
            width: drawWidth,
            height: drawHeight,
        });
    }

    return await pdfDoc.save();
}
