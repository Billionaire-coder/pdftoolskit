
import { PDFDocument, PDFName } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Mock browser fetch for Node environment
// @ts-ignore
global.fetch = async (url: any) => {
    const urlStr = url.toString();
    if (urlStr.includes('sRGB.icc')) {
        const filePath = path.join(process.cwd(), 'public', 'profiles', 'sRGB.icc');
        const buffer = fs.readFileSync(filePath);
        return {
            ok: true,
            arrayBuffer: async () => {
                // Return a copy of the buffer to avoid detached buffer issues if converted to standard ArrayBuffer
                return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            },
        };
    }
    return { ok: false };
};

const convertToPdfA_Verification = async (pdfBuffer: Uint8Array): Promise<Uint8Array> => {
    // Inlined logic from lib/services/pdf/standards/pdfA.ts
    // We strictly use the logic we wrote there.

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const now = new Date();

    // 1. Set Standard Metadata
    pdfDoc.setTitle('PDF/A-1b Compliant Document');
    pdfDoc.setProducer('PDFToolskit (pdf-lib)');
    pdfDoc.setCreator('PDFToolskit');
    pdfDoc.setCreationDate(now);
    pdfDoc.setModificationDate(now);

    let profileBuffer = null;
    try {
        const response = await fetch('/profiles/sRGB.icc');
        if (response.ok) {
            profileBuffer = await response.arrayBuffer();
        }
    } catch (e) {
        console.error("Fetch error in mock", e);
    }

    if (profileBuffer) {
        const profileStream = pdfDoc.context.flateStream(new Uint8Array(profileBuffer as ArrayBuffer), {
            N: 3, Length: (profileBuffer as ArrayBuffer).byteLength,
        });
        const profileRef = pdfDoc.context.register(profileStream);
        const outputIntent = pdfDoc.context.obj({
            Type: 'OutputIntent',
            S: 'GTS_PDFA1',
            OutputConditionIdentifier: 'sRGB IEC61966-2.1',
            RegistryName: 'http://www.color.org',
            Info: 'sRGB IEC61966-2.1',
            DestOutputProfile: profileRef,
        });

        // Fix: catalog.set expects a PDFObject, so we wrap array in context.obj([]) or just pass the array reference if we created one?
        // pdf-lib catalog.set takes (PDFName, PDFObject).
        // pdfDoc.context.obj([...]) creates a PDFArray.
        pdfDoc.catalog.set(PDFName.of('OutputIntents'), pdfDoc.context.obj([outputIntent]));
    }

    const xmpMetadata = `
        <x:xmpmeta xmlns:x="adobe:ns:meta/">
          <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
            <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
              <pdfaid:part>1</pdfaid:part>
              <pdfaid:conformance>B</pdfaid:conformance>
            </rdf:Description>
            <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
              <dc:format>application/pdf</dc:format>
              <dc:title>
                <rdf:Alt>
                  <rdf:li xml:lang="x-default">PDF/A-1b Document</rdf:li>
                </rdf:Alt>
              </dc:title>
            </rdf:Description>
             <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
                <xmp:CreatorTool>PDFToolskit</xmp:CreatorTool>
                <xmp:ModifyDate>${now.toISOString()}</xmp:ModifyDate>
                <xmp:CreateDate>${now.toISOString()}</xmp:CreateDate>
                <xmp:MetadataDate>${now.toISOString()}</xmp:MetadataDate>
            </rdf:Description>
          </rdf:RDF>
        </x:xmpmeta>
    `.trim();

    const metadataStream = pdfDoc.context.flateStream(xmpMetadata, { Type: 'Metadata', Subtype: 'XML' });
    const metadataRef = pdfDoc.context.register(metadataStream);
    pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);

    return await pdfDoc.save();
};

async function runTest() {
    console.log("Creating dummy PDF...");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText('Test PDF/A');
    const pdfBytes = await pdfDoc.save();

    console.log("Converting to PDF/A...");
    const resultBytes = await convertToPdfA_Verification(pdfBytes);

    console.log("Verifying result...");
    // Load result to check internal structure
    const resultDoc = await PDFDocument.load(resultBytes);

    const outputIntents = resultDoc.catalog.get(PDFName.of('OutputIntents'));
    const metadata = resultDoc.catalog.get(PDFName.of('Metadata'));

    if (outputIntents) {
        console.log("✅ OutputIntents found present.");
    } else {
        console.error("❌ OutputIntents MISSING.");
        process.exit(1);
    }

    if (metadata) {
        console.log("✅ Metadata found present.");
    } else {
        console.error("❌ Metadata MISSING.");
        process.exit(1);
    }

    console.log("PDF/A structure verification passed.");
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
