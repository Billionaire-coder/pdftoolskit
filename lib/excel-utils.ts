import { excelToPdf as advancedExcelToPdf } from './services/pdf/converters/excelToPdf';

// ... (pdfToExcel remains the same)

/**
 * Convert Excel to PDF (Legacy wrapper)
 */
export async function excelToPdf(file: File): Promise<Uint8Array> {
    return advancedExcelToPdf(file, {
        orientation: 'p',
        sheets: 'all',
        preserveStyles: true
    });
}
