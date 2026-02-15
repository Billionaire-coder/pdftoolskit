import {
    FileText,
    Scissors,
    Minimize2,
    Image as ImageIcon,
    FileImage,
    RotateCw,
    Trash2,
    LayoutGrid,
    GripVertical,
    Lock,
    Unlock,
    FileDown,
    Files,
    Hash,
    Droplet,
    Crop,
    PenTool,
    EyeOff,
    Camera,
    Tag,
    Layers,
    Wrench,
    RefreshCw,
    FileSpreadsheet,
    FileCode2,
    Presentation,
    FileType,
    Globe,
    LucideIcon,
    Workflow,
    MessageSquare,
    ShieldAlert,
    Printer,
    ShieldCheck
} from 'lucide-react';

export type ToolCategory = 'Workflows' | 'Organize PDF' | 'Optimize PDF' | 'Convert PDF' | 'Edit PDF' | 'PDF Security';

export interface Tool {
    id: string; // Added for i18n
    name: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
    category: ToolCategory;
}

export const tools: Tool[] = [
    {
        id: 'mergePdf',
        name: 'Merge PDF',
        description: 'Combine multiple PDF files into one document',
        icon: FileText,
        href: '/merge-pdf',
        color: 'from-purple-500 to-pink-500',
        category: 'Organize PDF'
    },
    {
        id: 'splitPdf',
        name: 'Split PDF',
        description: 'Extract pages from your PDF document',
        icon: Scissors,
        href: '/split-pdf',
        color: 'from-blue-500 to-cyan-500',
        category: 'Organize PDF'
    },
    {
        id: 'compressPdf',
        name: 'Compress PDF',
        description: 'Reduce PDF file size while maintaining quality',
        icon: Minimize2,
        href: '/compress-pdf',
        color: 'from-green-500 to-emerald-500',
        category: 'Optimize PDF'
    },
    {
        id: 'pdfToWord',
        name: 'PDF to Word',
        description: 'Convert PDF documents to editable Word files',
        icon: FileDown,
        href: '/pdf-to-word',
        color: 'from-blue-500 to-indigo-500',
        category: 'Convert PDF'
    },
    {
        id: 'pdfToJpg',
        name: 'PDF to JPG',
        description: 'Convert PDF pages to high-quality images',
        icon: ImageIcon,
        href: '/pdf-to-jpg',
        color: 'from-orange-500 to-red-500',
        category: 'Convert PDF'
    },
    {
        id: 'jpgToPdf',
        name: 'JPG to PDF',
        description: 'Create PDF from multiple images',
        icon: FileImage,
        href: '/jpg-to-pdf',
        color: 'from-indigo-500 to-purple-500',
        category: 'Convert PDF'
    },
    {
        id: 'chatPdf',
        name: 'Chat with PDF',
        description: 'Ask questions and extract insights from your PDF using AI',
        icon: MessageSquare,
        href: '/chat-pdf',
        color: 'from-violet-600 to-fuchsia-600',
        category: 'Edit PDF'
    },
    {
        id: 'signPdf',
        name: 'Sign PDF',
        description: 'Add your signature to PDF documents',
        icon: PenTool,
        href: '/sign-pdf',
        color: 'from-indigo-500 to-blue-600',
        category: 'PDF Security'
    },
    {
        id: 'pdfToExcel',
        name: 'PDF to Excel',
        description: 'Convert PDF tables to editable Excel spreadsheets',
        icon: FileSpreadsheet,
        href: '/pdf-to-excel',
        color: 'from-green-500 to-emerald-600',
        category: 'Convert PDF'
    },
    {
        id: 'excelToPdf',
        name: 'Excel to PDF',
        description: 'Convert Excel spreadsheets to professional PDFs',
        icon: FileCode2,
        href: '/excel-to-pdf',
        color: 'from-green-600 to-teal-600',
        category: 'Convert PDF'
    },
    {
        id: 'ocrPdf',
        name: 'OCR PDF',
        description: 'Extract text from scanned PDFs and Images',
        icon: RefreshCw,
        href: '/ocr-pdf',
        color: 'from-teal-400 to-emerald-500',
        category: 'Convert PDF'
    },
    {
        id: 'editPdf',
        name: 'Edit PDF',
        description: 'Edit text, add images, and annotate PDFs',
        icon: PenTool,
        href: '/edit-pdf',
        color: 'from-blue-600 to-indigo-600',
        category: 'Edit PDF'
    },
    {
        id: 'scanPdf',
        name: 'Scan to PDF',
        description: 'Capture documents using your camera',
        icon: Camera,
        href: '/scan-pdf',
        color: 'from-indigo-500 to-purple-600',
        category: 'Convert PDF'
    },
    {
        id: 'pdfToPowerPoint',
        name: 'PDF to PowerPoint',
        description: 'Convert PDF slides to editable PowerPoint',
        icon: Presentation,
        href: '/pdf-to-powerpoint',
        color: 'from-orange-500 to-red-500',
        category: 'Convert PDF'
    },
    {
        id: 'powerPointToPdf',
        name: 'PowerPoint to PDF',
        description: 'Convert PowerPoint presentations to PDF',
        icon: FileType,
        href: '/powerpoint-to-pdf',
        color: 'from-red-600 to-orange-600',
        category: 'Convert PDF'
    },
    {
        id: 'htmlToPdf',
        name: 'HTML to PDF',
        description: 'Convert web pages and HTML to PDF',
        icon: Globe,
        href: '/html-to-pdf',
        color: 'from-blue-400 to-indigo-500',
        category: 'Convert PDF'
    },
    {
        id: 'rotatePdf',
        name: 'Rotate PDF',
        description: 'Rotate PDF pages to the correct orientation',
        icon: RotateCw,
        href: '/rotate-pdf',
        color: 'from-pink-500 to-rose-500',
        category: 'Edit PDF'
    },
    {
        id: 'organizePdf',
        name: 'Organize PDF',
        description: 'Reorder and reorganize PDF pages',
        icon: GripVertical,
        href: '/organize-pdf',
        color: 'from-cyan-500 to-blue-500',
        category: 'Organize PDF'
    },
    {
        id: 'masterOrganizer',
        name: 'Master Organizer',
        description: 'Unified UI to Reorder, Rotate and Delete pages',
        icon: LayoutGrid,
        href: '/master-organizer',
        color: 'from-blue-500 to-indigo-600',
        category: 'Organize PDF'
    },
    {
        id: 'removePages',
        name: 'Remove Pages',
        description: 'Delete unwanted pages from your PDF',
        icon: Trash2,
        href: '/remove-pages',
        color: 'from-yellow-500 to-orange-500',
        category: 'Organize PDF'
    },
    {
        id: 'extractPages',
        name: 'Extract Pages',
        description: 'Create a new PDF with specific pages',
        icon: Files,
        href: '/extract-pages',
        color: 'from-purple-500 to-pink-500',
        category: 'Organize PDF'
    },
    {
        id: 'addPageNumbers',
        name: 'Add Page Numbers',
        description: 'Insert page numbers with custom positioning',
        icon: Hash,
        href: '/add-page-numbers',
        color: 'from-green-500 to-emerald-500',
        category: 'Edit PDF'
    },
    {
        id: 'addWatermark',
        name: 'Add Watermark',
        description: 'Stamp text watermarks on your documents',
        icon: Droplet,
        href: '/add-watermark',
        color: 'from-indigo-500 to-violet-500',
        category: 'Edit PDF'
    },
    {
        id: 'cropPdf',
        name: 'Crop PDF',
        description: 'Trim margins from your PDF pages',
        icon: Crop,
        href: '/crop-pdf',
        color: 'from-orange-500 to-red-500',
        category: 'Edit PDF'
    },
    {
        id: 'protectPdf',
        name: 'Password Protect',
        description: 'Secure PDF files with password encryption',
        icon: Lock,
        href: '/protect-pdf',
        color: 'from-red-500 to-orange-500',
        category: 'PDF Security'
    },
    {
        id: 'unlockPdf',
        name: 'Unlock PDF',
        description: 'Remove password protection from PDFs',
        icon: Unlock,
        href: '/unlock-pdf',
        color: 'from-green-500 to-teal-500',
        category: 'PDF Security'
    },
    {
        id: 'redactPdf',
        name: 'Redact PDF',
        description: 'Permanently hide sensitive information',
        icon: EyeOff,
        href: '/redact-pdf',
        color: 'from-gray-700 to-black',
        category: 'PDF Security'
    },
    {
        id: 'editMetadata',
        name: 'Edit Metadata',
        description: 'Update Title, Author and Keywords',
        icon: Tag,
        href: '/edit-metadata',
        color: 'from-blue-400 to-indigo-500',
        category: 'Edit PDF'
    },
    {
        id: 'flattenPdf',
        name: 'Flatten PDF',
        description: 'Merge layers and lock forms',
        icon: Layers,
        href: '/flatten-pdf',
        color: 'from-indigo-800 to-purple-800',
        category: 'Edit PDF'
    },
    {
        id: 'repairPdf',
        name: 'Repair PDF',
        description: 'Fix corrupted PDF documents',
        icon: Wrench,
        href: '/repair-pdf',
        color: 'from-green-500 to-emerald-600',
        category: 'Optimize PDF'
    },
    {
        id: 'metadataAuditor',
        name: 'Metadata Auditor',
        description: 'Inspect and wipe hidden tracking data',
        icon: ShieldAlert,
        href: '/metadata-auditor',
        color: 'from-rose-500 to-orange-600',
        category: 'PDF Security'
    },
    {
        id: 'createWorkflow',
        name: 'Create Workflow',
        description: 'Build custom automated PDF workflows',
        icon: Workflow,
        href: '/workflows/create',
        color: 'from-blue-600 to-indigo-600',
        category: 'Workflows'
    },
    {
        id: 'pdfA',
        name: 'PDF/A Converter',
        description: 'Convert PDF to long-term archiving format',
        icon: ShieldCheck,
        href: '/standards/pdf-a',
        color: 'from-emerald-600 to-teal-700',
        category: 'Optimize PDF'
    },
    {
        id: 'printReadyPdf',
        name: 'Print-Ready PDF',
        description: 'Prepare PDF for professional printing (CMYK)',
        icon: Printer,
        href: '/print-ready-pdf',
        color: 'from-blue-700 to-indigo-800',
        category: 'Optimize PDF'
    },
    {
        id: 'wordToPdf',
        name: 'Word to PDF',
        description: 'Convert Word documents to PDF format',
        icon: FileText,
        href: '/word-to-pdf',
        color: 'from-blue-500 to-indigo-500',
        category: 'Convert PDF'
    },
];
