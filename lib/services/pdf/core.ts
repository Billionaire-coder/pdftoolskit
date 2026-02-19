import { PDFDocument, PDFString, PDFDict, PDFName, StandardFonts, rgb, degrees } from 'pdf-lib';

export function applyBranding(pdfDoc: PDFDocument) {
    pdfDoc.setModificationDate(new Date());
    const producer = PDFString.of('PDFToolskit');
    const creator = PDFString.of('PDFToolskit');

    const context = pdfDoc.context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (context && (context as any).trailerInfo && (context as any).trailerInfo.Info) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const infoRef = (context as any).trailerInfo.Info;
        const info = context.lookup(infoRef);
        if (info instanceof PDFDict) {
            info.set(PDFName.of('Producer'), producer);
            info.set(PDFName.of('Creator'), creator);
            return;
        }
    }

    pdfDoc.setProducer('PDFToolskit Core Engine');
    pdfDoc.setCreator('PDFToolskit');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGlobalPDFLib(): Promise<any> {
    if (typeof window === 'undefined') {
        return { PDFDocument, StandardFonts, rgb, degrees, PDFName, PDFString, PDFDict };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).PDFLib) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).PDFLib;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.js';
        script.onload = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).PDFLib) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                resolve((window as any).PDFLib);
            } else {
                reject(new Error('PDFLib not found in window after script load'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load pdf-lib script'));
        document.head.appendChild(script);
    });
}
/**
 * Robustly extracts an ArrayBuffer from a File/Blob, providing full compatibility 
 * across environments (Browsers, Node.js, and Test JSDOM).
 */
export async function getFileArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
    if (typeof file.arrayBuffer === 'function') {
        try {
            return await file.arrayBuffer();
        } catch (_e) {
            // Fall through to fallback if it exists but fails
        }
    }

    // Fallback for environments lacking file.arrayBuffer (e.g. older JSDOM)
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('FileReader failed to read the file.'));
        reader.readAsArrayBuffer(file);
    });
}
