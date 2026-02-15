import { PDFDocument } from 'pdf-lib';
import { applyBranding } from '../core';

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

export async function getMetadata(file: File): Promise<PDFFullMetadata> {
    const arrayBuffer = await file.arrayBuffer();
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
    const arrayBuffer = await file.arrayBuffer();
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
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) pdfDoc.setKeywords(metadata.keywords);
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

    pdfDoc.setModificationDate(new Date());

    if (!metadata.producer) applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function setMetadata(
    file: File,
    metadata: { title?: string; author?: string; subject?: string; keywords?: string[] }
): Promise<Uint8Array> {
    return updateMetadata(file, metadata);
}

