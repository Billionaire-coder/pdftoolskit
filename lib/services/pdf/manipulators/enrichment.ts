import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { applyBranding } from '../core';
import { AuditService, AuditRecord } from '../auditService';

export async function addPageNumbers(
    file: File,
    options: {
        position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
        startFrom?: number;
        fontSize?: number;
        textPattern?: string; // e.g. "Page {n} of {total}"
        margin?: number;
        mirror?: boolean; // If true, swaps left/right on even pages
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const count = pages.length;

    const fontSize = options.fontSize || 12;
    const startNum = options.startFrom || 1;
    const pattern = options.textPattern || '{n}';
    const baseMargin = options.margin !== undefined ? options.margin : 20;

    for (let i = 0; i < count; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const page = pages[i];
        const { width, height } = page.getSize();

        // Parse pattern
        // {n} = current page number (1-based index + startOffset)
        // {total} = total pages
        const pageNum = i + startNum;
        const text = pattern
            .replace('{n}', pageNum.toString())
            .replace('{total}', count.toString());

        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        let x = 0;
        let y = 0;

        // Determine effective position based on mirroring
        let effectivePos = options.position;
        if (options.mirror && (i + 1) % 2 === 0) {
            // Even page: swap left/right
            if (effectivePos.includes('left')) effectivePos = effectivePos.replace('left', 'right') as any;
            else if (effectivePos.includes('right')) effectivePos = effectivePos.replace('right', 'left') as any;
        }

        switch (effectivePos) {
            case 'bottom-left': x = baseMargin; y = baseMargin; break;
            case 'bottom-center': x = (width / 2) - (textWidth / 2); y = baseMargin; break;
            case 'bottom-right': x = width - textWidth - baseMargin; y = baseMargin; break;
            case 'top-left': x = baseMargin; y = height - textHeight - baseMargin; break;
            case 'top-center': x = (width / 2) - (textWidth / 2); y = height - textHeight - baseMargin; break;
            case 'top-right': x = width - textWidth - baseMargin; y = height - textHeight - baseMargin; break;
        }

        page.drawText(text, {
            x,
            y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function addWatermark(
    file: File,
    watermarkText: string,
    options: {
        opacity?: number;
        size?: number;
        color?: { r: number; g: number; b: number };
        rotation?: number;
        layout?: 'single' | 'mosaic';
        x?: number; // 0-1 percentage relative to width (for single mode)
        y?: number; // 0-1 percentage relative to height (for single mode)
    } = {}
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    const fontSize = options.size || 50;
    const opacity = options.opacity !== undefined ? options.opacity : 0.5;
    const color = options.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0.5, 0.5, 0.5);
    const rotation = options.rotation !== undefined ? options.rotation : 45;
    const layout = options.layout || 'single';

    for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        if (layout === 'mosaic') {
            // Mosaic Mode: Tile the watermark across the page
            // We'll create a grid. The spacing depends on text size.
            // A simplified mosaic: 3 columns, 5 rows? Or dynamic based on size.
            // Let's do dynamic.
            const horizontalSpacing = textWidth * 2;
            const verticalSpacing = textHeight * 4;

            // Start well outside bounds to account for rotation clipping
            for (let y = -height; y < height * 2; y += verticalSpacing) {
                for (let x = -width; x < width * 2; x += horizontalSpacing) {
                    page.drawText(watermarkText, {
                        x: x,
                        y: y,
                        size: fontSize,
                        font: helveticaFont,
                        color: color,
                        opacity: opacity,
                        rotate: degrees(rotation),
                    });
                }
            }
        } else {
            // Single Mode
            // Calculate position. If x/y provided (0-1), use them. Else center.
            let targetX, targetY;

            if (options.x !== undefined && options.y !== undefined) {
                // User provided relative coordinates (0 at left/top)
                // PDF coordinates: 0 at left/bottom.
                // So x is direct. Y needs inversion.
                targetX = (width * options.x) - (textWidth / 2);
                targetY = (height - (height * options.y)) - (textHeight / 2);
            } else {
                // Default Center
                targetX = (width / 2) - (textWidth / 2);
                targetY = (height / 2) - (textHeight / 2);
            }

            page.drawText(watermarkText, {
                x: targetX,
                y: targetY,
                size: fontSize,
                font: helveticaFont,
                color: color,
                opacity: opacity,
                rotate: degrees(rotation),
            });
        }
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function addImageToPage(
    file: File,
    imageData: Uint8Array,
    placements: {
        pageIndex: number;
        x: number;
        y: number;
        width: number;
        height: number;
    } | {
        pageIndex: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }[],
    options: {
        applyToAll?: boolean;
        auditRecord?: AuditRecord;
    } = {}
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    let image;
    try {
        image = await pdfDoc.embedPng(imageData);
    } catch {
        image = await pdfDoc.embedJpg(imageData);
    }

    const pages = pdfDoc.getPages();
    const placementList = Array.isArray(placements) ? placements : [placements];

    if (options.applyToAll && placementList.length > 0) {
        const template = placementList[0];
        for (const page of pages) {
            page.drawImage(image, {
                x: template.x,
                y: template.y,
                width: template.width,
                height: template.height,
            });
        }
    } else {
        for (const p of placementList) {
            if (p.pageIndex >= 0 && p.pageIndex < pages.length) {
                const page = pages[p.pageIndex];
                page.drawImage(image, {
                    x: p.x,
                    y: p.y,
                    width: p.width,
                    height: p.height,
                });
            }
        }
    }

    if (options.auditRecord) {
        await AuditService.appendCertificate(pdfDoc, options.auditRecord);
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function addRedaction(
    file: File,
    options: {
        pageIndex: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const pages = pdfDoc.getPages();
    if (options.pageIndex >= 0 && options.pageIndex < pages.length) {
        const page = pages[options.pageIndex];
        page.drawRectangle({
            x: options.x,
            y: options.y,
            width: options.width,
            height: options.height,
            color: rgb(0, 0, 0),
            opacity: 1,
        });
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}
