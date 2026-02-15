import { Document, Paragraph, TextRun, Packer } from 'docx';
import { initOCRWorker, performOCR } from '@/lib/ocr-utils';
import type { Worker } from 'tesseract.js';

export async function pdfToWord(file: File): Promise<{ data: Uint8Array; isScanned: boolean }> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');

        if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;

        const paragraphs: Paragraph[] = [];
        let ocrWorker: Worker | null = null;
        const tolerance = 6;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();

            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `Page ${pageNum}`, bold: true, size: 24 }),
                    ],
                    spacing: { before: 240, after: 120 },
                })
            );

            const items = textContent.items as any[];
            const lines: { y: number; str: string }[] = [];

            items.forEach(item => {
                if (!('str' in item) || !('transform' in item)) return;
                const y = item.transform[5];
                let line = lines.find(l => Math.abs(l.y - y) < tolerance);
                if (!line) {
                    line = { y, str: '' };
                    lines.push(line);
                }
                line.str += item.str;
            });

            lines.sort((a, b) => b.y - a.y);

            lines.forEach(line => {
                if (line.str.trim()) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: line.str, size: 22 }),
                            ],
                        })
                    );
                }
            });

            // OCR Fallback
            if (lines.length === 0) {
                if (!ocrWorker) ocrWorker = await initOCRWorker();
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport }).promise;
                    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                    if (blob) {
                        const ocrLines = await performOCR(ocrWorker, blob);
                        ocrLines.forEach((textLine: string) => {
                            if (textLine.trim()) {
                                paragraphs.push(
                                    new Paragraph({
                                        children: [new TextRun({ text: textLine, size: 22 })],
                                    })
                                );
                            }
                        });
                    }
                }
            }
            paragraphs.push(new Paragraph({ text: "", spacing: { after: 720 } }));
        }

        if (ocrWorker) await ocrWorker.terminate();
        await pdfDoc.cleanup();
        await pdfDoc.destroy();

        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs.length > 0 ? paragraphs : [
                    new Paragraph({
                        children: [new TextRun({ text: 'No content found.', size: 22 })],
                    }),
                ],
            }],
        });

        const docxBytes = await Packer.toBuffer(doc);
        const isScanned = paragraphs.length < 5 && pdfDoc.numPages > 0;

        return { data: new Uint8Array(docxBytes), isScanned };
    } catch (error) {
        console.error('PDF to Word error:', error);
        throw error;
    }
}
