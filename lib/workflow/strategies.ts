/* eslint-disable */
import {
    mergePDFs,
    rotatePDF,
    compressPDF,
    protectPDF,
    addWatermark,
    addPageNumbers,
    setMetadata,
    reversePDF,
    extractPages,
    burstPDF,
    convertPDFToImages
} from '@/lib/pdf-utils';

export interface WorkflowStrategy {
    execute(files: File[], settings: any): Promise<File[]>;
}

export class MergeStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        if (files.length < 2) return files;
        const mergedBytes = await mergePDFs(files);
        const defaultName = "merged_output.pdf";
        const fileName = settings.outputFilename
            ? (settings.outputFilename.endsWith('.pdf') ? settings.outputFilename : `${settings.outputFilename}.pdf`)
            : defaultName;

        return [new File([mergedBytes as any], fileName, { type: "application/pdf" })];
    }
}

export class RotateStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        return await Promise.all(files.map(async (file) => {
            const rotation = settings.rotation || 90;
            const resultBytes = await rotatePDF(file, rotation);
            return new File([resultBytes as any], file.name, { type: file.type });
        }));
    }
}

export class CompressStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        return await Promise.all(files.map(async (file) => {
            const quality = settings.quality || 0.7;
            const resultBytes = await compressPDF(file, quality);
            return new File([resultBytes as any], file.name, { type: file.type });
        }));
    }
}

export class ProtectStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        return await Promise.all(files.map(async (file) => {
            const { password } = settings;
            if (!password) throw new Error("Password required for protection");
            const resultBytes = await protectPDF(file, password);
            return new File([resultBytes as any], `protected_${file.name}`, { type: file.type });
        }));
    }
}

export class WatermarkStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        return await Promise.all(files.map(async (file) => {
            const { text, size, opacity, color } = settings;
            if (!text) throw new Error("Watermark text required");
            const resultBytes = await addWatermark(file, text, { size, opacity, color });
            return new File([resultBytes as any], file.name, { type: file.type });
        }));
    }
}

export class PageNumbersStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        return await Promise.all(files.map(async (file) => {
            const { position, startFrom, fontSize } = settings;
            const resultBytes = await addPageNumbers(file, { position, startFrom, fontSize });
            return new File([resultBytes as any], file.name, { type: file.type });
        }));
    }
}

export class MetadataStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        return await Promise.all(files.map(async (file) => {
            const { title, author, subject, keywords } = settings;
            const resultBytes = await setMetadata(file, { title, author, subject, keywords });
            return new File([resultBytes as any], file.name, { type: file.type });
        }));
    }
}

export class ReverseStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        return await Promise.all(files.map(async (file) => {
            if (settings.mode === 'reverse') {
                const resultBytes = await reversePDF(file);
                return new File([resultBytes as any], file.name, { type: file.type });
            }
            return file;
        }));
    }
}

export class ExtractStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        return await Promise.all(files.map(async (file) => {
            const { pageRange } = settings;
            if (!pageRange) throw new Error("Page range required for extraction");
            const resultBytes = await extractPages(file, pageRange);
            return new File([resultBytes as any], `extracted_${file.name}`, { type: file.type });
        }));
    }
}

export class BurstStrategy implements WorkflowStrategy {
    async execute(files: File[], _settings: any): Promise<File[]> {
        const splitResults = await Promise.all(files.map(async (file) => {
            return await burstPDF(file);
        }));
        return splitResults.flat();
    }
}

export class ConvertToImageStrategy implements WorkflowStrategy {
    async execute(files: File[], settings: any): Promise<File[]> {
        const allFiles: File[] = [];
        for (const file of files) {
            const format = settings.format || 'png';
            const generator = convertPDFToImages(file, { format });
            for await (const img of generator) {
                allFiles.push(img);
            }
        }
        return allFiles;
    }
}

export const WORKFLOW_STRATEGIES: Record<string, WorkflowStrategy> = {
    'merge': new MergeStrategy(),
    'rotate': new RotateStrategy(),
    'compress': new CompressStrategy(),
    'protect': new ProtectStrategy(),
    'watermark': new WatermarkStrategy(),
    'pageNumbers': new PageNumbersStrategy(),
    'metadata': new MetadataStrategy(),
    'reorder': new ReverseStrategy(),
    'extract': new ExtractStrategy(),
    'split': new BurstStrategy(),
    'pdfToImage': new ConvertToImageStrategy(),
};
