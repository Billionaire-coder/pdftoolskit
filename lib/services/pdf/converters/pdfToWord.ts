import { Document, Paragraph, TextRun, Packer, AlignmentType } from 'docx';
import { initOCRWorker, performOCR } from '@/lib/ocr-utils';
import type { Worker } from 'tesseract.js';

interface TextBlock {
    text: string;
    fontSize: number;
    bold: boolean;
    italic: boolean;
    x: number;
    y: number;
    width: number;
}

interface Line {
    y: number;
    blocks: TextBlock[];
}

export async function pdfToWord(file: File): Promise<{ data: Uint8Array; isScanned: boolean }> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');

        if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;

        const docParagraphs: Paragraph[] = [];
        let ocrWorker: Worker | null = null;
        const lineTolerance = 4;
        const paragraphTolerance = 14;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });

            // 1. Group items into lines
            const lines: Line[] = [];
            const items = textContent.items as any[];

            items.forEach(item => {
                if (!('str' in item) || !('transform' in item)) return;

                const x = item.transform[4];
                const y = item.transform[5];
                const fontSize = Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2);
                const fontName = (item.fontName || '').toLowerCase();

                const block: TextBlock = {
                    text: item.str,
                    fontSize: fontSize,
                    bold: fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy'),
                    italic: fontName.includes('italic') || fontName.includes('oblique'),
                    x,
                    y,
                    width: item.width
                };

                let line = lines.find(l => Math.abs(l.y - y) < lineTolerance);
                if (!line) {
                    line = { y, blocks: [] };
                    lines.push(line);
                }
                line.blocks.push(block);
            });

            // Sort lines from top to bottom
            lines.sort((a, b) => b.y - a.y);

            // 2. Sort blocks within each line from left to right
            lines.forEach(line => line.blocks.sort((a, b) => a.x - b.x));

            // 3. Group lines into paragraphs and create docx objects
            let currentParagraphChildren: TextRun[] = [];
            let lastLineY = lines.length > 0 ? lines[0].y : 0;

            lines.forEach((line, index) => {
                const spacing = Math.abs(lastLineY - line.y);

                // If spacing is significant, start a new paragraph
                if (index > 0 && spacing > paragraphTolerance) {
                    if (currentParagraphChildren.length > 0) {
                        docParagraphs.push(new Paragraph({ children: currentParagraphChildren }));
                        currentParagraphChildren = [];
                    }
                }

                line.blocks.forEach(block => {
                    const textContent = block.text;
                    if (textContent) {
                        currentParagraphChildren.push(
                            new TextRun({
                                text: textContent,
                                bold: block.bold,
                                italics: block.italic,
                                size: Math.round(block.fontSize * 2), // docx uses half-points
                            })
                        );
                    }
                });

                lastLineY = line.y;
            });

            // Push final paragraph of the page
            if (currentParagraphChildren.length > 0) {
                docParagraphs.push(new Paragraph({ children: currentParagraphChildren }));
            }

            // OCR Fallback for empty pages
            if (lines.length === 0) {
                if (!ocrWorker) ocrWorker = await initOCRWorker();
                const renderViewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.height = renderViewport.height;
                    canvas.width = renderViewport.width;
                    await page.render({ canvasContext: context, viewport: renderViewport }).promise;
                    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                    if (blob) {
                        const ocrLines = await performOCR(ocrWorker, blob);
                        ocrLines.forEach((textLine: string) => {
                            if (textLine.trim()) {
                                docParagraphs.push(
                                    new Paragraph({
                                        children: [new TextRun({ text: textLine, size: 22 })],
                                    })
                                );
                            }
                        });
                    }
                }
            }

            // Add page separator (spacing)
            docParagraphs.push(new Paragraph({ text: "", spacing: { after: 240 } }));
        }

        if (ocrWorker) await ocrWorker.terminate();
        await pdfDoc.cleanup();
        await pdfDoc.destroy();

        const doc = new Document({
            sections: [{
                properties: {},
                children: docParagraphs.length > 0 ? docParagraphs : [
                    new Paragraph({
                        children: [new TextRun({ text: 'No content found.', size: 22 })],
                    }),
                ],
            }],
        });

        const docxBytes = await Packer.toBuffer(doc);
        const isScanned = docParagraphs.length < 5 && pdfDoc.numPages > 0; // Simple heuristic

        return { data: new Uint8Array(docxBytes), isScanned };
    } catch (error) {
        console.error('PDF to Word error:', error);
        throw error;
    }
}
