import { PDFDocument } from 'pdf-lib';

export interface ScanToPdfOptions {
    fileName?: string;
    addBranding?: boolean;
}

export async function imagesToPdf(imageUrls: string[], options: ScanToPdfOptions = {}): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    for (const url of imageUrls) {
        const imgBytes = await fetch(url).then(res => res.arrayBuffer());
        const img = await pdfDoc.embedJpg(imgBytes);

        // Normalize or keep original
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
        });
    }

    if (options.addBranding) {
        const pages = pdfDoc.getPages();
        for (const page of pages) {
            const { width } = page.getSize();
            page.drawText('Scanned with PDFToolskit', {
                x: width / 2 - 50,
                y: 20,
                size: 8,
                opacity: 0.5
            });
        }
    }

    return await pdfDoc.save();
}
