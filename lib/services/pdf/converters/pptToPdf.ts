/* eslint-disable */
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

export interface PptToPdfOptions {
    mode: 'vivid' | 'structure';
}

export class PptToPdfService {
    // EMU to Points conversion (1 inch = 914400 EMUs, 1 inch = 72 Points)
    private static emuToPoints(emu: number): number {
        return (emu / 914400) * 72;
    }

    /**
     * Converts a PPTX file to PDF with spatial reconstruction
     */
    static async convert(file: File, options: PptToPdfOptions = { mode: 'vivid' }): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Find slide size in ppt/presentation.xml
        const presXml = await zip.file('ppt/presentation.xml')?.async('string');
        const parser = new DOMParser();
        const presDoc = parser.parseFromString(presXml || '', 'text/xml');
        const sldSz = presDoc.getElementsByTagName('p:sldSz')[0];

        const slideWidthEmus = parseInt(sldSz?.getAttribute('cx') || '9144000'); // Default 10 inch
        const slideHeightEmus = parseInt(sldSz?.getAttribute('cy') || '5143500'); // Default 16:9 approx

        const widthPts = this.emuToPoints(slideWidthEmus);
        const heightPts = this.emuToPoints(slideHeightEmus);

        const pdf = new jsPDF({
            orientation: widthPts > heightPts ? 'landscape' : 'portrait',
            unit: 'pt',
            format: [widthPts, heightPts]
        });

        let slideIndex = 1;
        while (true) {
            const slidePath = `ppt/slides/slide${slideIndex}.xml`;
            const slideFile = zip.file(slidePath);
            if (!slideFile) break;

            if (slideIndex > 1) pdf.addPage([widthPts, heightPts]);

            const slideXml = await slideFile.async('string');
            const slideDoc = parser.parseFromString(slideXml, 'text/xml');

            if (options.mode === 'vivid') {
                // 1. Resource Mapping (_rels)
                const relsPath = `ppt/slides/_rels/slide${slideIndex}.xml.rels`;
                const relsFile = zip.file(relsPath);
                const relsMap: Record<string, string> = {};
                if (relsFile) {
                    const relsXml = await relsFile.async('string');
                    const relsDoc = parser.parseFromString(relsXml, 'text/xml');
                    const relationships = relsDoc.getElementsByTagName('Relationship');
                    for (let i = 0; i < relationships.length; i++) {
                        const id = relationships[i].getAttribute('Id');
                        const target = relationships[i].getAttribute('Target');
                        if (id && target) relsMap[id] = target.replace('../', 'ppt/');
                    }
                }

                // 2. Extract Images (p:pic)
                const pics = slideDoc.getElementsByTagName('p:pic');
                for (let i = 0; i < pics.length; i++) {
                    const pic = pics[i];
                    const rId = pic.getElementsByTagName('a:blip')[0]?.getAttribute('r:embed');
                    const xfrm = pic.getElementsByTagName('a:off')[0];
                    const ext = pic.getElementsByTagName('a:ext')[0];

                    if (rId && relsMap[rId] && xfrm && ext) {
                        const x = this.emuToPoints(parseInt(xfrm.getAttribute('x') || '0'));
                        const y = this.emuToPoints(parseInt(xfrm.getAttribute('y') || '0'));
                        const w = this.emuToPoints(parseInt(ext.getAttribute('cx') || '0'));
                        const h = this.emuToPoints(parseInt(ext.getAttribute('cy') || '0'));

                        const imgFile = zip.file(relsMap[rId]);
                        if (imgFile) {
                            const imgData = await imgFile.async('base64');
                            const imgExt = relsMap[rId].split('.').pop()?.toLowerCase();
                            try {
                                pdf.addImage(`data:image/${imgExt};base64,${imgData}`, imgExt === 'png' ? 'PNG' : 'JPEG', x, y, w, h);
                            } catch (e) {
                                console.warn("Failed to add image to PDF", e);
                            }
                        }
                    }
                }
            }

            // 3. Extract Text Boxes (p:sp)
            const shapes = slideDoc.getElementsByTagName('p:sp');
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const xfrm = shape.getElementsByTagName('a:off')[0];
                const ext = shape.getElementsByTagName('a:ext')[0];
                const textBody = shape.getElementsByTagName('p:txBody')[0];

                if (textBody && xfrm && ext) {
                    const x = this.emuToPoints(parseInt(xfrm.getAttribute('x') || '0'));
                    const y = this.emuToPoints(parseInt(xfrm.getAttribute('y') || '0'));
                    const w = this.emuToPoints(parseInt(ext.getAttribute('cx') || '0'));
                    const h = this.emuToPoints(parseInt(ext.getAttribute('cy') || '0'));

                    const paragraphs = textBody.getElementsByTagName('a:p');
                    let currentY = y + 12; // Start inside the box

                    for (let j = 0; j < paragraphs.length; j++) {
                        const texts = paragraphs[j].getElementsByTagName('a:t');
                        let paraText = "";
                        for (let k = 0; k < texts.length; k++) {
                            paraText += texts[k].textContent || "";
                        }

                        if (paraText.trim()) {
                            pdf.setFontSize(14);
                            const splitText = pdf.splitTextToSize(paraText, w - 10);
                            pdf.text(splitText, x + 5, currentY);
                            currentY += (splitText.length * 16);
                        }
                    }
                }
            }

            slideIndex++;
        }

        return new Uint8Array(pdf.output('arraybuffer'));
    }
}
