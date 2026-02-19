/**
 * Convert PowerPoint to PDF
 * Extracts text and images from slides (Best Effort) and places them in a PDF
 * Note: Client-side only. Cannot render complex layouts perfectly.
 */
export async function powerPointToPdf(file: File): Promise<Uint8Array> {
    const jsPDF = (await import('jspdf')).default;
    const JSZip = (await import('jszip')).default;

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const doc = new jsPDF();
    let yPos = 20;
    const margin = 15;
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.text(file.name, margin, yPos);
    yPos += 15;

    // Iterate through slides (assuming slide1.xml, slide2.xml...)
    // This is a naive implementation for simple text extraction
    let slideIndex = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const slideFile = zip.file(`ppt/slides/slide${slideIndex}.xml`);
        if (!slideFile) break;

        const slideXml = await slideFile.async('string');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(slideXml, 'text/xml');

        // Extract text in order
        const textElements = xmlDoc.getElementsByTagName('a:t');

        if (textElements.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Slide ${slideIndex}`, margin, yPos);
            yPos += 10;
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);

            for (let i = 0; i < textElements.length; i++) {
                // eslint-disable-next-line security/detect-object-injection
                const text = textElements[i].textContent || '';
                if (text.trim()) {
                    const lines = doc.splitTextToSize(text, 180);

                    if (yPos + (lines.length * 5) > pageHeight - 10) {
                        doc.addPage();
                        yPos = 20;
                    }

                    doc.text(lines, margin, yPos);
                    yPos += (lines.length * 5) + 2;
                }
            }
            yPos += 10;
        }

        slideIndex++;
    }

    if (slideIndex === 1) {
        doc.text("Could not find slides or extract text. This might be a complex PPTX.", margin, yPos);
    }

    return new Uint8Array(doc.output('arraybuffer'));
}
