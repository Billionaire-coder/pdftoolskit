import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Convert HTML content to PDF
 * Renders the provided HTML string into a container, captures it, and saves as PDF
 */
export interface PdfOptions {
    format: 'a4' | 'letter';
    orientation: 'portrait' | 'landscape';
}

const PAGE_SIZES = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 },
};

/**
 * Convert HTML content to PDF
 * Renders the providing HTML string into a container, captures it, and saves as PDF
 */
export async function htmlToPdf(htmlContent: string, options: PdfOptions = { format: 'a4', orientation: 'portrait' }): Promise<Uint8Array> {
    // Create a hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '0';
    // Adjust container width based on ratio to ensure content fits naturally
    // A4 Portrait ratio ~0.7, Landscape ~1.4
    const isPortrait = options.orientation === 'portrait';
    container.style.width = isPortrait ? '800px' : '1100px';
    container.style.background = 'white';
    container.style.padding = '40px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);

        // Calculate dimensions
        const size = PAGE_SIZES[options.format];
        const pageWidth = isPortrait ? size.width : size.height;
        const pageHeight = isPortrait ? size.height : size.width;

        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const doc = new jsPDF(isPortrait ? 'p' : 'l', 'mm', options.format);
        let heightLeft = imgHeight;
        let position = 0;

        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        return new Uint8Array(doc.output('arraybuffer'));
    } finally {
        document.body.removeChild(container);
    }
}
