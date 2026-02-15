import { PDFDocument, PDFString, PDFDict, PDFName, StandardFonts, rgb, degrees } from 'pdf-lib';

export function applyBranding(pdfDoc: PDFDocument) {
    pdfDoc.setModificationDate(new Date());
    const producer = PDFString.of('PDFToolskit');
    const creator = PDFString.of('PDFToolskit');

    const context = pdfDoc.context;
    if (context && (context as any).trailerInfo && (context as any).trailerInfo.Info) {
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

export async function getGlobalPDFLib(): Promise<any> {
    if (typeof window === 'undefined') {
        return { PDFDocument, StandardFonts, rgb, degrees, PDFName, PDFString, PDFDict };
    }

    if ((window as any).PDFLib) {
        return (window as any).PDFLib;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.js';
        script.onload = () => {
            if ((window as any).PDFLib) {
                resolve((window as any).PDFLib);
            } else {
                reject(new Error('PDFLib not found in window after script load'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load pdf-lib script'));
        document.head.appendChild(script);
    });
}
