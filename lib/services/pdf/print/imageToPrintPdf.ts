/* eslint-disable */
import { PDFDocument, rgb, cmyk, PageSizes } from 'pdf-lib';
import { applyBranding } from '../core';

export type PrintSize = 'original' | 'a4' | 'letter';

export interface PrintOptions {
    dpi: number;
    pageSize: PrintSize;
    bleed?: boolean;      // Add 3mm bleed
    cropMarks?: boolean;  // Add trim marks
    colorBars?: boolean;  // Add CMYK density bars
}

export async function convertImagesToPrintPdf(
    files: { buffer: ArrayBuffer; type: string }[],
    options: PrintOptions
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Constants for Print
    const MM_TO_POINT = 2.83465;
    const BLEED_MM = 3;
    const BLEED_PT = options.bleed ? (BLEED_MM * MM_TO_POINT) : 0;
    const SLUG_PT = (options.cropMarks || options.colorBars) ? 20 : 0; // Usage area for marks

    const TOTAL_EXTRA_MARGIN = BLEED_PT + SLUG_PT;

    for (const file of files) {
        let image;
        try {
            if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(file.buffer);
            } else {
                image = await pdfDoc.embedJpg(file.buffer);
            }
        } catch (e) {
            console.error('Failed to embed image', e);
            continue;
        }

        // Calculate Dimensions
        let pageWidth, pageHeight, imageWidth, imageHeight;

        if (options.pageSize === 'original') {
            // Physical Size = Pixels / DPI
            imageWidth = (image.width / options.dpi) * 72;
            imageHeight = (image.height / options.dpi) * 72;
            pageWidth = imageWidth;
            pageHeight = imageHeight;
        } else if (options.pageSize === 'a4') {
            [pageWidth, pageHeight] = PageSizes.A4;
            // Scale to fit (contain) ensuring margin for content
            const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
            imageWidth = image.width * scale;
            imageHeight = image.height * scale;
        } else { // Letter
            [pageWidth, pageHeight] = PageSizes.Letter;
            const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
            imageWidth = image.width * scale;
            imageHeight = image.height * scale;
        }

        // Add margins for Bleed/Slug
        const finalPageWidth = pageWidth + (TOTAL_EXTRA_MARGIN * 2);
        const finalPageHeight = pageHeight + (TOTAL_EXTRA_MARGIN * 2);

        const page = pdfDoc.addPage([finalPageWidth, finalPageHeight]);

        // Draw Image
        // If bleed is on, we might want to scale the image slightly to cover the bleed area
        // For 'original' size, we just center it.
        // We will draw the image centered.

        const centerX = finalPageWidth / 2;
        const centerY = finalPageHeight / 2;

        page.drawImage(image, {
            x: centerX - (imageWidth / 2),
            y: centerY - (imageHeight / 2),
            width: imageWidth,
            height: imageHeight,
        });

        const trimX = TOTAL_EXTRA_MARGIN;
        const trimY = TOTAL_EXTRA_MARGIN;
        const trimW = pageWidth;
        const trimH = pageHeight;

        // Draw Bleed Box (Metadata)
        if (options.bleed) {
            page.setBleedBox(
                trimX - BLEED_PT,
                trimY - BLEED_PT,
                trimW + (BLEED_PT * 2),
                trimH + (BLEED_PT * 2)
            );
        }

        // Set Trim Box (Actual Page Size)
        page.setTrimBox(trimX, trimY, trimW, trimH);

        // Draw Crop Marks
        if (options.cropMarks) {
            const markLen = 10;
            const offset = 5; // distance from trim line

            // Draw lines using SVG paths (simulated)
            const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
                page.drawLine({
                    start: { x: x1, y: y1 },
                    end: { x: x2, y: y2 },
                    thickness: 0.5,
                    color: cmyk(0, 0, 0, 1), // Registration Black usually, but 100% K is fine for simulation
                });
            };

            // Corners
            // BL
            drawLine(trimX - offset - markLen, trimY, trimX - offset, trimY); // Horiz
            drawLine(trimX, trimY - offset - markLen, trimX, trimY - offset); // Vert

            // BR
            drawLine(trimX + trimW + offset, trimY, trimX + trimW + offset + markLen, trimY); // Horiz
            drawLine(trimX + trimW, trimY - offset - markLen, trimX + trimW, trimY - offset); // Vert

            // TL
            drawLine(trimX - offset - markLen, trimY + trimH, trimX - offset, trimY + trimH); // Horiz
            drawLine(trimX, trimY + trimH + offset, trimX, trimY + trimH + offset + markLen); // Vert

            // TR
            drawLine(trimX + trimW + offset, trimY + trimH, trimX + trimW + offset + markLen, trimY + trimH); // Horiz
            drawLine(trimX + trimW, trimY + trimH + offset, trimX + trimW, trimY + trimH + offset + markLen); // Vert
        }

        // Draw Color Bars (Registration)
        if (options.colorBars) {
            const barSize = 5; // 5pt squares
            const startX = trimX + 20;
            const startY = trimY - 15; // Below the page

            // C, M, Y, K
            const colors = [
                cmyk(1, 0, 0, 0),
                cmyk(0, 1, 0, 0),
                cmyk(0, 0, 1, 0),
                cmyk(0, 0, 0, 1),
                cmyk(0.5, 0.5, 0.5, 0) // Grey
            ];

            colors.forEach((col, idx) => {
                page.drawRectangle({
                    x: startX + (idx * (barSize + 2)),
                    y: startY,
                    width: barSize,
                    height: barSize,
                    color: col,
                    borderColor: cmyk(0, 0, 0, 1),
                    borderWidth: 0.1
                });
            });
        }
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}
