import { PDFDocument } from 'pdf-lib';
import { applyBranding, getFileArrayBuffer } from '../core';

export interface PDFFullMetadata {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    keywords?: string;
    pageCount: number;
}

function generateXMP(metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
}): string {
    const formatDate = (date?: Date) => date ? date.toISOString() : new Date().toISOString();
    const escape = (str: string) => str.replace(/[<>&"']/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return c;
        }
    });

    return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c132 79.159224, 2017/11/06-03:34:46">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${escape(metadata.title || '')}</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>${escape(metadata.author || '')}</rdf:li></rdf:Seq></dc:creator>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${escape(metadata.subject || '')}</rdf:li></rdf:Alt></dc:description>
   <xmp:CreateDate>${formatDate(metadata.creationDate)}</xmp:CreateDate>
   <xmp:ModifyDate>${formatDate(metadata.modificationDate)}</xmp:ModifyDate>
   <xmp:CreatorTool>${escape(metadata.creator || 'PDFToolskit')}</xmp:CreatorTool>
   <pdf:Keywords>${escape(metadata.keywords?.join(', ') || '')}</pdf:Keywords>
   <pdf:Producer>${escape(metadata.producer || 'PDFToolskit Metadata Engine')}</pdf:Producer>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

export async function getMetadata(file: File): Promise<PDFFullMetadata> {
    const arrayBuffer = await getFileArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    return {
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
        subject: pdfDoc.getSubject(),
        creator: pdfDoc.getCreator(),
        producer: pdfDoc.getProducer(),
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate(),
        keywords: pdfDoc.getKeywords(),
        pageCount: pdfDoc.getPageCount(),
    };
}

export async function stripMetadata(file: File): Promise<Uint8Array> {
    const arrayBuffer = await getFileArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('PDFToolskit');
    pdfDoc.setProducer('PDFToolskit Metadata Engine');
    pdfDoc.setKeywords([]);

    const zeroDate = new Date(0);
    pdfDoc.setCreationDate(zeroDate);
    pdfDoc.setModificationDate(zeroDate);

    // Wipe XMP explicitly
    try {
        pdfDoc.catalog.delete(pdfDoc.context.obj('Metadata'));
    } catch (_e) {
        // Metadata not found or already deleted
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function updateMetadata(
    file: File,
    metadata: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
        producer?: string;
        creationDate?: Date;
        modificationDate?: Date;
    }
): Promise<Uint8Array> {
    const arrayBuffer = await getFileArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // 1. Update Info Dictionary (Legacy)
    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) pdfDoc.setKeywords(metadata.keywords);
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

    if (metadata.creationDate) pdfDoc.setCreationDate(metadata.creationDate);
    if (metadata.modificationDate) {
        pdfDoc.setModificationDate(metadata.modificationDate);
    } else {
        pdfDoc.setModificationDate(new Date());
    }

    // 2. Synchronize XMP Metadata Stream (Modern)
    const xmpXml = generateXMP({
        ...metadata,
        creationDate: metadata.creationDate || pdfDoc.getCreationDate(),
        modificationDate: metadata.modificationDate || new Date(),
        title: metadata.title ?? pdfDoc.getTitle(),
        author: metadata.author ?? pdfDoc.getAuthor(),
        subject: metadata.subject ?? pdfDoc.getSubject(),
        keywords: metadata.keywords ?? pdfDoc.getKeywords()?.split(',').map(k => k.trim()),
        creator: metadata.creator ?? pdfDoc.getCreator(),
        producer: metadata.producer ?? pdfDoc.getProducer(),
    });

    const xmpStream = pdfDoc.context.stream(xmpXml, {
        Type: 'Metadata',
        Subtype: 'XML',
    });
    const xmpStreamRef = pdfDoc.context.register(xmpStream);
    pdfDoc.catalog.set(pdfDoc.context.obj('Metadata'), xmpStreamRef);

    if (!metadata.producer) applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function setMetadata(
    file: File,
    metadata: { title?: string; author?: string; subject?: string; keywords?: string[] }
): Promise<Uint8Array> {
    return updateMetadata(file, metadata);
}
