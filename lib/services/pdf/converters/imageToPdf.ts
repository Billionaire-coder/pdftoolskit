import { PDFDocument, PageSizes } from 'pdf-lib';

export interface ImageToPdfOptions {
    layout: 'original' | 'a4';
    autoRotate: boolean;
    margin: number;
}

async function fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Uint8Array(await file.arrayBuffer());
}

async function processWebP(file: File): Promise<Uint8Array> {
    // pdf-lib doesn't natively support webp embed, so we convert to JPEG via canvas
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to convert WebP to JPEG'));
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
                reader.readAsArrayBuffer(blob);
            }, 'image/jpeg', 0.95);
        };
        img.onerror = () => reject(new Error('Failed to load WebP image'));
        img.src = URL.createObjectURL(file);
    });
}

export async function imageToPdf(
    files: File[],
    options: ImageToPdfOptions
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
        let imageBytes: Uint8Array;
        let isJpg = file.type === 'image/jpeg' || file.type === 'image/jpg';
        let isWebP = file.type === 'image/webp';

        if (isWebP) {
            imageBytes = await processWebP(file);
            isJpg = true; // Treated as JPG after conversion
        } else {
            imageBytes = await fileToUint8Array(file);
        }

        let image;
        try {
            if (isJpg) {
                image = await pdfDoc.embedJpg(imageBytes);
            } else {
                image = await pdfDoc.embedPng(imageBytes);
            }
        } catch (e) {
            console.error(`Failed to embed image ${file.name}:`, e);
            continue;
        }

        const { width, height } = image;
        let pageWidth = width;
        let pageHeight = height;

        if (options.layout === 'a4') {
            const a4Width = PageSizes.A4[0];
            const a4Height = PageSizes.A4[1];

            // Auto-rotate logic
            const isLandscape = width > height;
            const targetWidth = (options.autoRotate && isLandscape) ? a4Height : a4Width;
            const targetHeight = (options.autoRotate && isLandscape) ? a4Width : a4Height;

            const margin = options.margin;
            const availableWidth = targetWidth - (margin * 2);
            const availableHeight = targetHeight - (margin * 2);

            const scale = Math.min(availableWidth / width, availableHeight / height);

            pageWidth = targetWidth;
            pageHeight = targetHeight;

            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            const drawWidth = width * scale;
            const drawHeight = height * scale;
            const x = (pageWidth - drawWidth) / 2;
            const y = (pageHeight - drawHeight) / 2;

            page.drawImage(image, {
                x,
                y,
                width: drawWidth,
                height: drawHeight,
            });
        } else {
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight,
            });
        }
    }

    return await pdfDoc.save();
}
