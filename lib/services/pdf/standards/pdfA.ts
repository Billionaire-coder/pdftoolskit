
import { PDFDocument, PDFName } from 'pdf-lib';

/**
 * Ensures the PDF/A-1b compliance by injecting XMP metadata and sRGB OutputIntent.
 * Note: This does NOT convert content (fonts, colors, transparency) to PDF/A-1b.
 * Ideally, the input PDF should already be "close" to compliant.
 * 
 * @param pdfBuffer The input PDF file buffer
 * @returns The PDF/A-1b compliant (metadata-wise) PDF buffer
 */
export async function convertToPdfA(pdfBuffer: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // 1. Set Standard Metadata
    const now = new Date();
    pdfDoc.setTitle('PDF/A-1b Compliant Document');
    pdfDoc.setProducer('PDFToolskit (pdf-lib)');
    pdfDoc.setCreator('PDFToolskit');
    pdfDoc.setCreationDate(now);
    pdfDoc.setModificationDate(now);

    // 2. Embed sRGB ICC Profile
    // We fetch the profile from public folder (must be available at runtime)
    // In a real browser environment, we can fetch relative to origin
    let profileBuffer: ArrayBuffer | null = null;
    try {
        const response = await fetch('/profiles/sRGB.icc');
        if (response.ok) {
            profileBuffer = await response.arrayBuffer();
        } else {
            console.error('Failed to strict load sRGB profile for PDF/A');
        }
    } catch (e) {
        console.error('Error loading sRGB profile', e);
    }

    if (profileBuffer) {
        const profileStream = pdfDoc.context.flateStream(new Uint8Array(profileBuffer), {
            N: 3, // RGB has 3 components
            Length: profileBuffer.byteLength,
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

        // Add to Catalog
        const catalog = pdfDoc.catalog;
        let outputIntents = catalog.get(PDFName.of('OutputIntents'));
        if (!outputIntents) {
            outputIntents = pdfDoc.context.obj([]);
            catalog.set(PDFName.of('OutputIntents'), outputIntents);
        }

        // Ensure it's an array and push
        if (outputIntents instanceof Array) {
            // Not direct array, it's a PDFArray wrapper usually, but pdf-lib low level is...
            // Let's use the high level push if possible or low level
        }

        // pdf-lib's catalog.get returns PDFObject. 
        // We know it's likely undefined or existing array.
        // Let's brute force set it for this implementation to be a single item array
        catalog.set(PDFName.of('OutputIntents'), pdfDoc.context.obj([outputIntent]));
    }

    // 3. Inject XMP Metadata
    // We adhere to PDF/A-1b ID schema
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

    // Remove whitespace to save bytes and avoid issues? Not strictly necessary for XML but good
    // pdf-lib doesn't have setMetadataXML, so we do low level
    const metadataStream = pdfDoc.context.flateStream(xmpMetadata, {
        Type: 'Metadata',
        Subtype: 'XML',
    });

    const metadataRef = pdfDoc.context.register(metadataStream);
    pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef);

    return await pdfDoc.save();
}
