import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

export interface PdfToExcelOptions {
    mergePages: boolean;
    detectNumbers: boolean;
}

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

function castValue(str: string, detectNumbers: boolean): string | number {
    if (!detectNumbers) return str;

    // Clean string for number check (remove common currency/separators)
    const clean = str.replace(/[$,\s]/g, '');
    if (clean && !isNaN(Number(clean)) && /^\d+(\.\d+)?$/.test(clean)) {
        return Number(clean);
    }

    // Percentage check
    if (clean.endsWith('%')) {
        const pClean = clean.slice(0, -1);
        if (!isNaN(Number(pClean))) {
            return Number(pClean) / 100;
        }
    }

    return str;
}

export async function pdfToExcel(
    file: File,
    options: PdfToExcelOptions
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    const workbook = XLSX.utils.book_new();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allData: any[][] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = textContent.items as any[];

        // 1. Cluster X-coordinates to identify global columns for this page
        // We use a tolerance (e.g., 5 points) to group items into vertical slots
        const xCoords = items.map(item => item.transform[4]).sort((a, b) => a - b);
        const columnSlots: number[] = [];
        if (xCoords.length > 0) {
            columnSlots.push(xCoords[0]);
            for (let i = 1; i < xCoords.length; i++) {
                // eslint-disable-next-line security/detect-object-injection
                if (xCoords[i] - columnSlots[columnSlots.length - 1] > 8) {
                    // eslint-disable-next-line security/detect-object-injection
                    columnSlots.push(xCoords[i]);
                }
            }
        }

        // 2. Group items into rows by Y coordinate
        // eslint-disable-next-line security/detect-object-injection
        const rows: Record<string, { x: number, str: string }[]> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items.forEach((item: any) => {
            const y = Math.round(item.transform[5]);
            // eslint-disable-next-line security/detect-object-injection
            if (!rows[y]) rows[y] = [];
            // eslint-disable-next-line security/detect-object-injection
            // eslint-disable-next-line security/detect-object-injection
            rows[y].push({ x: item.transform[4], str: item.str });
        });

        // 3. Sort rows by Y descending (PDF top-to-bottom)
        const sortedY = Object.keys(rows).sort((a, b) => parseInt(b) - parseInt(a));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageData: any[][] = [];

        sortedY.forEach(y => {
            // eslint-disable-next-line security/detect-object-injection
            const rowItems = rows[y].sort((a, b) => a.x - b.x);
            const rowOutput = new Array(columnSlots.length).fill('');

            rowItems.forEach(item => {
                // Find nearest column slot
                let bestSlot = 0;
                let minDiff = Math.abs(item.x - columnSlots[0]);

                for (let i = 1; i < columnSlots.length; i++) {
                    // eslint-disable-next-line security/detect-object-injection
                    const diff = Math.abs(item.x - columnSlots[i]);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestSlot = i;
                    }
                }

                // If text already exists in this slot (likely concatenated segments), append it
                const val = castValue(item.str, options.detectNumbers);
                // eslint-disable-next-line security/detect-object-injection
                if (rowOutput[bestSlot] !== '') {
                    // eslint-disable-next-line security/detect-object-injection
                    rowOutput[bestSlot] = `${rowOutput[bestSlot]} ${val}`;
                } else {
                    // eslint-disable-next-line security/detect-object-injection
                    rowOutput[bestSlot] = val;
                }
            });

            if (options.mergePages) {
                allData.push(rowOutput);
            } else {
                pageData.push(rowOutput);
            }
        });

        if (!options.mergePages) {
            const worksheet = XLSX.utils.aoa_to_sheet(pageData);
            XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNum}`);
        }
    }

    if (options.mergePages) {
        const worksheet = XLSX.utils.aoa_to_sheet(allData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidated Data');
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Uint8Array(excelBuffer);
}
