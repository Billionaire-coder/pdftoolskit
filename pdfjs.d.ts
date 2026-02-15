declare module 'pdfjs-dist' {
    export const GlobalWorkerOptions: {
        workerSrc: string;
    };
    export const version: string;
    export function getDocument(src: any): { promise: Promise<any> };
    export * from 'pdfjs-dist/types/src/pdf';
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs' {
    const worker: any;
    export default worker;
}
