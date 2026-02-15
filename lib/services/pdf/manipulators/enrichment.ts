import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { applyBranding } from '../core';

export async function addPageNumbers(
    file: File,
    options: {
        position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
        startFrom?: number;
        fontSize?: number;
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const count = pages.length;

    const fontSize = options.fontSize || 12;
    const startNum = options.startFrom || 1;

    for (let i = 0; i < count; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const page = pages[i];
        const { width, height } = page.getSize();
        const text = `${i + startNum}`;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        let x = 0;
        let y = 0;
        const margin = 20;

        switch (options.position) {
            case 'bottom-left': x = margin; y = margin; break;
            case 'bottom-center': x = (width / 2) - (textWidth / 2); y = margin; break;
            case 'bottom-right': x = width - textWidth - margin; y = margin; break;
            case 'top-left': x = margin; y = height - textHeight - margin; break;
            case 'top-center': x = (width / 2) - (textWidth / 2); y = height - textHeight - margin; break;
            case 'top-right': x = width - textWidth - margin; y = height - textHeight - margin; break;
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
    } = {}
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    const fontSize = options.size || 50;
    const opacity = options.opacity !== undefined ? options.opacity : 0.5;
    const color = options.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0.5, 0.5, 0.5);

    for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);
        // Note: rotate: degrees(45) should be handled carefully for centering
        page.drawText(watermarkText, {
            x: (width / 2) - (textWidth / 2),
            y: (height / 2) - (textHeight / 2),
            size: fontSize,
            font: helveticaFont,
            color: color,
            opacity: opacity,
            rotate: degrees(45),
        });
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
