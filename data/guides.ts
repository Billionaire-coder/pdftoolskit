export const toolGuides: Record<string, { title: string; description: string }[]> = {
    '/merge-pdf': [
        { title: 'Select PDFs', description: 'Upload all the PDF files you want to combine.' },
        { title: 'Reorder Files', description: 'Drag and drop files to arrange them in your desired order.' },
        { title: 'Merge & Download', description: 'Click "Merge PDF" to combine them into a single document.' },
    ],
    '/split-pdf': [
        { title: 'Upload PDF', description: 'Select the file you want to split into smaller parts.' },
        { title: 'Select Pages', description: 'Choose specific page ranges or split every page.' },
        { title: 'Extract', description: 'Download your selected pages as separate PDF files.' },
    ],
    '/compress-pdf': [ // Already done manually, but good to have here
        { title: 'Upload PDF', description: 'Drag & drop your file or click to browse.' },
        { title: 'Choose Mode', description: 'Select "Recommended" for most files, or "Custom" for specific limits.' },
        { title: 'Download', description: 'Get your perfectly optimized PDF file instantly.' },
    ],
    '/pdf-to-jpg': [
        { title: 'Upload File', description: 'Choose the PDF document you want to convert to images.' },
        { title: 'Process', description: 'We will extract every page as a high-quality JPG image.' },
        { title: 'Download', description: 'Download images individually or as a ZIP archive.' },
    ],
    '/jpg-to-pdf': [
        { title: 'Upload Images', description: 'Select JPG, PNG, or GIF images from your device.' },
        { title: 'Arrangement', description: 'Reorder images to appear in the correct sequence in the PDF.' },
        { title: 'Convert', description: 'Click "Create PDF" to merge them all into one document.' },
    ],
    '/rotate-pdf': [
        { title: 'Upload PDF', description: 'Select the file with pages you need to rotate.' },
        { title: 'Rotate Pages', description: 'Click on individual pages or rotate all at once.' },
        { title: 'Save', description: 'Download your new PDF with corrected orientation.' },
    ],
    '/remove-pages': [
        { title: 'Upload Document', description: 'Load the PDF containing pages you want to delete.' },
        { title: 'Select Pages', description: 'Click on the pages you want to remove to select them.' },
        { title: 'Apply', description: 'Click "Remove Pages" to delete them and download the result.' },
    ],
    '/organize-pdf': [
        { title: 'Upload PDF', description: 'Select the file you want to reorganize.' },
        { title: 'Drag & Drop', description: 'Move pages around to change their order in the document.' },
        { title: 'Save', description: 'Download your newly organized PDF file.' },
    ],
    '/protect-pdf': [
        { title: 'Upload PDF', description: 'Choose the file you want to secure.' },
        { title: 'Set Password', description: 'Enter a strong password to encrypt the document.' },
        { title: 'Encrypt', description: 'Download your protected file. It will require the password to open.' },
    ],
    '/unlock-pdf': [
        { title: 'Upload Locked PDF', description: 'Select the file that is currently password protected.' },
        { title: 'Enter Password', description: 'Input the current password if required to verify ownership.' },
        { title: 'Unlock', description: 'Download a clean version of the PDF with no password.' },
    ],
    '/pdf-to-word': [
        { title: 'Select PDF', description: 'Upload the document you need to edit in Word.' },
        { title: 'Convert', description: 'Wait a moment while we extract text and layout.' },
        { title: 'Download DOCX', description: 'Get your editable Word document.' },
    ],
    '/extract-pages': [
        { title: 'Upload PDF', description: 'Choose the source document.' },
        { title: 'Choose Pages', description: 'Select only the specific pages you want to keep.' },
        { title: 'Create PDF', description: 'Download a new PDF containing only your selected pages.' },
    ],
    '/add-page-numbers': [
        { title: 'Upload PDF', description: 'Select the file that needs page numbering.' },
        { title: 'Configure', description: 'Choose position (e.g., Bottom Right) and formatting.' },
        { title: 'Apply', description: 'Download the document with professionally added page numbers.' },
    ],
    '/add-watermark': [
        { title: 'Upload PDF', description: 'Choose the document you want to stamp.' },
        { title: 'Customize', description: 'Enter your text, choose opacity, color, and size.' },
        { title: 'Watermark', description: 'Apply the watermark and download your protected file.' },
    ],
    '/crop-pdf': [
        { title: 'Upload PDF', description: 'Select the file you need to trim.' },
        { title: 'Set Area', description: 'Drag the selection box to define the visible area.' },
        { title: 'Crop', description: 'Apply the crop to all or selected pages.' },
    ],
    '/sign-pdf': [
        { title: 'Upload PDF', description: 'Open the document you need to sign.' },
        { title: 'Create Signature', description: 'Draw, type, or upload your signature.' },
        { title: 'Place & Save', description: 'Drag the signature to the correct spot and download.' },
    ],
    '/redact-pdf': [
        { title: 'Upload Document', description: 'Choose the file containing sensitive info.' },
        { title: 'Select Areas', description: 'Draw rectangles over text or images to black them out.' },
        { title: 'Redact', description: 'Permanently burn in the redaction. This cannot be undone.' },
    ],
    '/scan-pdf': [
        { title: 'Open Camera', description: 'Allow access to your device camera.' },
        { title: 'Capture', description: 'Take photos of your physical documents.' },
        { title: 'Save as PDF', description: 'Convert your captures into a single PDF file.' },
    ],
    '/ocr-pdf': [
        { title: 'Upload Scan', description: 'Upload a scanned PDF or image with text.' },
        { title: 'Process', description: 'AI will analyze the image to recognize text characters.' },
        { title: 'Get Text', description: 'Copy the extracted text or download as a text file.' },
    ],
    '/edit-metadata': [
        { title: 'Upload PDF', description: 'Select the file to update info for.' },
        { title: 'Edit Fields', description: 'Modify Title, Author, Subject, and Keywords.' },
        { title: 'Save', description: 'Update the file with new metadata properties.' },
    ],
    '/flatten-pdf': [
        { title: 'Upload Form', description: 'Choose a PDF with fillable forms or layers.' },
        { title: 'Flatten', description: 'Merge all layers into a single visual layer.' },
        { title: 'Download', description: 'Get a non-editable version of your document.' },
    ],
    '/repair-pdf': [
        { title: 'Upload Corrupt File', description: 'Select the PDF that wont open.' },
        { title: 'Analyze', description: 'We will attempt to rebuild the file structure.' },
        { title: 'Recover', description: 'Download the recovered version of your document.' },
    ],
    '/pdf-to-excel': [
        { title: 'Upload PDF', description: 'Select the PDF containing tables you want to convert.' },
        { title: 'Convert', description: 'Our engine extracts data columns and rows automatically.' },
        { title: 'Download XLSX', description: 'Get your collaborative Excel spreadsheet.' },
    ],
    '/excel-to-pdf': [
        { title: 'Upload Excel', description: 'Choose your .xlsx or .xls spreadsheet file.' },
        { title: 'Format', description: 'We ensure your tables fit perfectly on the PDF pages.' },
        { title: 'Save', description: 'Download the professional PDF version of your data.' },
    ],
    '/pdf-to-powerpoint': [
        { title: 'Upload Presentation', description: 'Select the PDF slides you want to edit.' },
        { title: 'Convert', description: 'We recreate slides, text boxes, and images for PowerPoint.' },
        { title: 'Download PPTX', description: 'Get your editable presentation file.' },
    ],
    '/powerpoint-to-pdf': [
        { title: 'Upload PPT', description: 'Choose your PowerPoint presentation file.' },
        { title: 'Process', description: 'We convert each slide into a high-quality PDF page.' },
        { title: 'Download', description: 'Get your presentation as a secure, shareable PDF.' },
    ],
    '/html-to-pdf': [
        { title: 'Enter URL', description: 'Paste the web address or upload an HTML file.' },
        { title: 'Settings', description: 'Adjust page size, orientation, and margins if needed.' },
        { title: 'Capture', description: 'Download the webpage as a clean PDF document.' },
    ],
    '/edit-pdf': [
        { title: 'Upload PDF', description: 'Select the file you want to edit or fill.' },
        { title: 'Pro Suite', description: 'Forms, Signatures, Stamps, Redaction, and Design Tools.' },
        { title: 'Download', description: 'Securely save your professionally edited document.' },
    ],
    '/word-to-pdf': [
        { title: 'Upload Word', description: 'Select the .docx or .doc file you want to convert.' },
        { title: 'Processing', description: 'We extract text and preserve readable formatting for the PDF.' },
        { title: 'Save PDF', description: 'Download your high-quality PDF document instantly.' },
    ],
    '/standards/pdf-a': [
        { title: 'Upload PDF', description: 'Select the document you want to convert for long-term archiving.' },
        { title: 'Add Metadata', description: 'We automatically inject XMP metadata for PDF/A-1b conformance.' },
        { title: 'Download', description: 'Save your archival-ready PDF document.' },
    ],
    '/print-ready-pdf': [
        { title: 'Select Images', description: 'Choose high-quality photos or scans (JPG, PNG) from your device.' },
        { title: 'Set Print DPI', description: 'Select 300 DPI for professional printing results.' },
        { title: 'Generate PDF', description: 'Download your optimized PDF ready for any professional printer.' },
    ],
};
