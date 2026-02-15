/* eslint-disable */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function validatePDFFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (file.type !== 'application/pdf') {
        return { valid: false, error: 'File must be a PDF' };
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        return { valid: false, error: 'File size must be less than 50MB' };
    }

    return { valid: true };
}

export function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function getBaseFileName(filename: string, extension: string = ''): string {
    const lastDot = filename.lastIndexOf('.');
    const baseName = lastDot > 0 ? filename.substring(0, lastDot) : filename;
    return extension ? `${baseName}_${extension}` : baseName;
}

/**
 * Parses a page range string into an array of 0-based page indices.
 * Inputs can be: "1", "1-5", "1,3,5", "1-3, 7"
 * @param range - The user input string (1-based pages)
 * @param totalPages - The total number of pages in the document
 * @returns Array of unique, 0-based sorted indices
 */
export function parsePageRange(range: string, totalPages: number): number[] {
    if (!range || !range.trim()) {
        // Return all pages if empty
        return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages = new Set<number>();
    const parts = range.split(',');

    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            // Handle range "1-5"
            const [startStr, endStr] = trimmed.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);

            if (!isNaN(start) && !isNaN(end)) {
                // Convert to 0-based and clamp
                const rangeStart = Math.max(0, Math.min(start - 1, totalPages - 1));
                const rangeEnd = Math.max(0, Math.min(end - 1, totalPages - 1));

                const low = Math.min(rangeStart, rangeEnd);
                const high = Math.max(rangeStart, rangeEnd);

                for (let i = low; i <= high; i++) {
                    pages.add(i);
                }
            }
        } else {
            // Handle single page "5"
            const pageNum = parseInt(trimmed, 10);
            if (!isNaN(pageNum)) {
                // Convert to 0-based
                const index = pageNum - 1;
                if (index >= 0 && index < totalPages) {
                    pages.add(index);
                }
            }
        }
    }

    // Sort logic
    return Array.from(pages).sort((a, b) => a - b);
}
