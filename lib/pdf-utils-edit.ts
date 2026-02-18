import { PDFDocument, rgb, StandardFonts, PDFPage, degrees } from 'pdf-lib';
import { applyBranding } from './pdf-utils';

export type FontName = 'Helvetica' | 'Times Roman' | 'Courier' | 'Symbol' | 'Inter';

export type PDFModification = {
    type: 'text' | 'image' | 'shape' | 'drawing' | 'field';
    pageIndex: number;
    x: number;
    y: number; // Top-left relative from UI
    // Text
    text?: string;
    textSize?: number;
    textColor?: string; // Hex
    font?: FontName;
    // Image
    imageData?: Uint8Array;
    width?: number;
    height?: number;
    // Shape & Drawing
    shapeType?: 'rectangle' | 'circle' | 'line';
    strokeColor?: string; // Hex
    fillColor?: string; // Hex
    strokeWidth?: number;
    opacity?: number;
    rotate?: number; // Degrees
    // Drawing specific
    pathPoints?: { x: number, y: number }[];
    // SVG Path (for icons/signatures)
    svgPath?: string;
    scale?: number;
    zIndex?: number;

    // Field (New Form Builder)
    fieldType?: 'text' | 'checkbox' | 'dropdown';
    fieldName?: string;
    fieldValue?: string;
    readOnly?: boolean;
    required?: boolean;
    multiline?: boolean;
    checked?: boolean;
    options?: string[]; // For dropdowns
};

export async function editPDF(
    file: File,
    modifications: PDFModification[]
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const fonts: Record<string, any> = {
        'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'Times Roman': await pdfDoc.embedFont(StandardFonts.TimesRoman),
        'Courier': await pdfDoc.embedFont(StandardFonts.Courier),
        'Symbol': await pdfDoc.embedFont(StandardFonts.Symbol),
    };

    // Try to embed Inter if used
    if (modifications.some(m => m.font === 'Inter')) {
        try {
            // Fetch font from public directory
            const fontUrl = 'https://pdftoolskit.vercel.app/fonts/Inter-Regular.ttf'; // Using absolute for browser-side or handling accordingly
            // Since we are server-side in this utility context (or client side with fetch)
            const fontRes = await fetch(new URL('/fonts/Inter-Regular.ttf', window.location.origin));
            const fontBytes = await fontRes.arrayBuffer();
            fonts['Inter'] = await pdfDoc.embedFont(fontBytes);
        } catch (e) {
            console.warn("Failed to embed Inter font, falling back to Helvetica", e);
            fonts['Inter'] = fonts['Helvetica'];
        }
    }

    const pages = pdfDoc.getPages();

    // Sort modifications by zIndex for correct rendering order
    const sortedMods = [...modifications].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    const form = pdfDoc.getForm();

    for (const mod of sortedMods) {
        if (mod.pageIndex < 0 || mod.pageIndex >= pages.length) continue;
        const page = pages[mod.pageIndex];
        const { height: pageHeight } = page.getSize();

        // Color helpers
        const getRgb = (hex?: string) => hex ? hexToRgb(hex) : undefined;

        // Ensure unique field name if not provided
        const fieldName = mod.fieldName || `field_${mod.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        const options = {
            opacity: mod.opacity ?? 1,
            color: getRgb(mod.fillColor),
            borderColor: getRgb(mod.strokeColor),
            borderWidth: mod.strokeWidth ?? 1,
            rotate: mod.rotate ? degrees(mod.rotate) : undefined
        };

        if (mod.type === 'field') {
            const pdfY = pageHeight - mod.y - (mod.height || 20);

            if (mod.fieldType === 'text') {
                try {
                    const textField = form.createTextField(fieldName);
                    textField.setText(mod.fieldValue || '');
                    textField.addToPage(page, {
                        x: mod.x,
                        y: pdfY,
                        width: mod.width || 200,
                        height: mod.height || 20,
                        textColor: getRgb(mod.textColor) || rgb(0, 0, 0),
                        backgroundColor: getRgb(mod.fillColor),
                        borderColor: getRgb(mod.strokeColor),
                        borderWidth: mod.strokeWidth ?? 1,
                    });
                    if (mod.readOnly) textField.enableReadOnly();
                    if (mod.required) textField.enableRequired();
                    if (mod.multiline) textField.enableMultiline();
                } catch (e) {
                    console.error("Failed to create text field", e);
                }
            } else if (mod.fieldType === 'checkbox') {
                try {
                    const checkBox = form.createCheckBox(fieldName);
                    checkBox.addToPage(page, {
                        x: mod.x,
                        y: pdfY,
                        width: mod.width || 20,
                        height: mod.height || 20,
                        textColor: getRgb(mod.textColor) || rgb(0, 0, 0),
                        backgroundColor: getRgb(mod.fillColor),
                        borderColor: getRgb(mod.strokeColor),
                        borderWidth: mod.strokeWidth ?? 1,
                    });
                    if (mod.fieldValue === 'true' || mod.checked) checkBox.check();
                    if (mod.readOnly) checkBox.enableReadOnly();
                    if (mod.required) checkBox.enableRequired();
                } catch (e) {
                    console.error("Failed to create checkbox", e);
                }
            }
            else if (mod.fieldType === 'dropdown' && mod.options) { // Example expansion
                // Dropdown logic could go here
            }

        } else if (mod.type === 'text' && mod.text) {
            // ... (Existing Text Logic)
            const size = mod.textSize || 12;
            const color = mod.textColor ? hexToRgb(mod.textColor) : rgb(0, 0, 0);
            const font = fonts[mod.font || 'Helvetica'];

            // Baseline adjustment approx
            const pdfY = pageHeight - mod.y - (size * 0.75);

            page.drawText(mod.text, {
                x: mod.x,
                y: pdfY,
                size: size,
                font: font,
                color: color,
                opacity: mod.opacity ?? 1, // Fix: Use direct mod access or options
                rotate: options.rotate
            });
        }
        else if (mod.type === 'image' && mod.imageData) {
            // ... (Existing Image Logic)
            let image;
            try {
                image = await pdfDoc.embedPng(mod.imageData);
            } catch {
                try {
                    image = await pdfDoc.embedJpg(mod.imageData);
                } catch (e) {
                    console.error("Failed to embed image", e);
                    continue;
                }
            }
            const w = mod.width || 100;
            const h = mod.height || 100;
            const pdfY = pageHeight - mod.y - h;

            page.drawImage(image, {
                x: mod.x,
                y: pdfY,
                width: w,
                height: h,
                opacity: mod.opacity ?? 1,
                rotate: options.rotate
            });
        }
        else if (mod.type === 'shape') {
            // ... (Existing Shape Logic)
            const pdfY = pageHeight - mod.y - (mod.height || 0);

            if (mod.shapeType === 'rectangle') {
                page.drawRectangle({
                    x: mod.x,
                    y: pdfY,
                    width: mod.width || 50,
                    height: mod.height || 50,
                    ...options
                });
            } else if (mod.shapeType === 'circle') {
                const r = (mod.width || 50) / 2;
                page.drawCircle({
                    x: mod.x + r,
                    y: pdfY + (mod.height || 50) / 2,
                    size: r,
                    ...options
                });
            } else if (mod.shapeType === 'line') {
                page.drawLine({
                    start: { x: mod.x, y: pageHeight - mod.y },
                    end: { x: mod.x + (mod.width || 50), y: pageHeight - (mod.y + (mod.height || 0)) },
                    thickness: mod.strokeWidth || 1,
                    color: options.borderColor || rgb(0, 0, 0),
                    opacity: options.opacity
                });
            }
        }
        else if (mod.type === 'drawing') {
            // ... (Existing Drawing Logic)
            if (mod.svgPath) {
                // SVG Path Rendering
                const pdfY = pageHeight - mod.y - (mod.height || 50);
                page.drawSvgPath(mod.svgPath, {
                    x: mod.x,
                    y: pdfY,
                    scale: mod.scale || 1,
                    color: options.borderColor || rgb(0, 0, 0),
                    opacity: options.opacity,
                    rotate: options.rotate,
                    borderWidth: mod.strokeWidth // Actually thickness for path
                });
            }
            else if (mod.pathPoints && mod.pathPoints.length > 1) {
                // Freehand Lines
                const points = mod.pathPoints;
                const pathColor = getRgb(mod.strokeColor) || rgb(0, 0, 0);
                const thick = mod.strokeWidth || 2;

                for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];

                    page.drawLine({
                        start: { x: p1.x, y: pageHeight - p1.y },
                        end: { x: p2.x, y: pageHeight - p2.y },
                        thickness: thick,
                        color: pathColor,
                        opacity: mod.opacity ?? 1
                    });
                }
            }
        }
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ) : rgb(0, 0, 0);
}
