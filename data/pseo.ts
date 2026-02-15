export interface PSEOPage {
    slug: string;
    title: string;
    description: string;
    heading: string;
    toolHref: string;
    toolParams?: Record<string, string | number>;
    content: string;
}

export const pseoPages: PSEOPage[] = [
    {
        slug: 'compress-pdf-to-200kb',
        title: 'Compress PDF to 200KB Online - Free & Secure',
        description: 'Shrink your PDF file size to exactly 200KB or less without losing quality. 100% private, browser-based compression.',
        heading: 'Compress PDF to 200KB',
        toolHref: '/compress-pdf',
        toolParams: { targetSize: 200, unit: 'kb', level: 'custom' },
        content: `
            <p>Need to upload a document to a portal with a strict 200KB limit? Our specialized <strong>PDF to 200KB</strong> tool uses advanced optimization to shrink your files while keeping text readable.</p>
            <h3>Why use PDFToolskit for 200KB compression?</h3>
            <ul>
                <li><strong>Local Processing:</strong> Your sensitive documents stay on your computer.</li>
                <li><strong>Strict Limits:</strong> We prioritize meeting your target size even if it requires aggressive asset optimization.</li>
                <li><strong>No Watermarks:</strong> Completely free for all users.</li>
            </ul>
        `
    },
    {
        slug: 'compress-pdf-to-1mb',
        title: 'Compress PDF to 1MB Online - Fast & Private',
        description: 'Reduce your PDF size to under 1MB for easy email sharing. Process files locally in your browser for maximum security.',
        heading: 'Compress PDF to 1MB',
        toolHref: '/compress-pdf',
        toolParams: { targetSize: 1, unit: 'mb', level: 'custom' },
        content: `
            <p>1MB is the standard "sweet spot" for email attachments. If your report or portfolio is slightly over, use our <strong>1MB PDF Compressor</strong> to shave off the extra weight without pixelating your images.</p>
        `
    },
    {
        slug: 'merge-pdf-for-lawyers',
        title: 'Secure PDF Merger for Lawyers - 100% Local Processing',
        description: 'Merge sensitive legal documents securely. Our zero-server architecture ensures your case files never leave your computer.',
        heading: 'PDF Merger for Legal Professionals',
        toolHref: '/merge-pdf',
        content: `
            <p>Ethics and client confidentiality are non-negotiable. Using standard cloud PDF tools for legal work is a risk. PDFToolskit provides a <strong>WASM-powered merger</strong> that runs entirely in your desktop browser—no data is ever uploaded to the cloud.</p>
        `
    },
    {
        slug: 'convert-scanned-pdf-to-word-no-ocr',
        title: "PDFToolskit - Best Free Browser-Based PDF Optimization",
        description: "Get the best results with PDFToolskit's premium tools.",
        heading: 'Scanned PDF to Word Doc',
        toolHref: '/pdf-to-word',
        content: `
            <p>Converting a scan shouldn't be hard. We combine layout analysis with text extraction to give you an editable .docx file from a flat image PDF.</p>
        `
    },
    {
        slug: 'compress-pdf-to-500kb',
        title: 'Compress PDF to 500KB - Free and No Watermark',
        description: 'Need exactly 500KB? Our tool optimizes your PDF assets to fit under the limit while maintaining clarity.',
        heading: 'PDF Compressor to 500KB',
        toolHref: '/compress-pdf',
        toolParams: { targetSize: 500, unit: 'kb', level: 'custom' },
        content: `
            <p>Finding a tool that hits <strong>exactly 500KB</strong> is rare. We use iterative compression to get as close to your target as possible without over-compressing.</p>
        `
    },
    {
        slug: 'rotate-scanned-pdf-pages-permanently',
        title: 'Rotate Scanned PDF Pages Permanently - Fix Upside Down Scans',
        description: 'Fix messy scans once and for all. Rotate individual pages and save them permanently in the PDF structure.',
        heading: 'Fix Upside-Down Scanned PDFs',
        toolHref: '/rotate-pdf',
        content: `
            <p>Unlike browser viewers that only rotate the view, PDFToolskit <strong>re-writes the PDF file</strong> so it stays rotated on every device.</p>
        `
    },
    {
        slug: 'merge-financial-statements-securely',
        title: 'Merge Financial Statements Securely - Zero Cloud Uploads',
        description: 'Protect your banking and tax data. Merge multiple financial PDFs locally without cloud exposure.',
        heading: 'Secure Financial PDF Merger',
        toolHref: '/merge-pdf',
        content: `
            <p>Banking data is private. Don't upload it to a server. PDFToolskit uses <strong>browser-only processing</strong> to combine your statements securely.</p>
        `
    },
    {
        slug: 'remove-ssn-from-pdf-online',
        title: 'Remove SSN from PDF Online - Free Privacy Tool',
        description: 'Redact Social Security Numbers (SSN) from your documents securely. Uses local AI to detect sensitive patterns.',
        heading: 'Redact SSIs and Sensitive Data',
        toolHref: '/chat-pdf',
        content: `
            <p>Need to hide your SSN before sending a document? Our <strong>AI Privacy Scanner</strong> identifies sensitive numbers and helps you redact them instantly—all without uploading to a server.</p>
        `
    },
    {
        slug: 'scan-pdf-to-black-and-white-online',
        title: 'Scan PDF to Black and White Online - High Contrast Scanner',
        description: 'Convert color scans to high-contrast black and white PDFs. Perfect for documents, receipts, and professional archiving.',
        heading: 'Handheld B&W PDF Scanner',
        toolHref: '/scan-pdf',
        content: `
            <p>Cloud-based scanners often produce blurry or grayish "color" scans. PDFToolskit's <strong>B&W Pro Filter</strong> uses high-contrast binary thresholding to create sharp, professional-grade black and white PDFs directly from your phone camera or webcam.</p>
            <h3>Benefits of B&W Scanning:</h3>
            <ul>
                <li><strong>Higher Contrast:</strong> Makes text easier for OCR to read.</li>
                <li><strong>Smaller File Size:</strong> Binary images take up much less space than color.</li>
                <li><strong>Professional Finish:</strong> Removes shadows and background noise from photos.</li>
            </ul>
        `
    }
];
