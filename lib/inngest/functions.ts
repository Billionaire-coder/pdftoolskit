import { inngest } from "./client";

export const generatePdf = inngest.createFunction(
    { id: "generate-pdf" },
    { event: "pdf/generate" },
    async ({ event, step }) => {
        const { html, options } = event.data;

        const pdfBuffer = await step.run("generate-pdf-buffer", async () => {
            console.log("Processing PDF generation for:", options?.filename || "document.pdf");

            // Phase 34: Real Logic
            const { generatePdfBuffer } = await import('@/lib/services/pdf/generator');

            const isUrl = html.startsWith('http') || html.startsWith('https');
            const buffer = await generatePdfBuffer({
                url: isUrl ? html : undefined,
                html: isUrl ? undefined : html,
                format: options?.format || 'a4',
                orientation: options?.orientation || 'portrait',
                browserlessToken: process.env.BROWSERLESS_TOKEN
            });

            // In a real Inngest setup, we can't return a Buffer directly in the JSON body if it's huge.
            // We would upload to S3 here.
            // For now, we'll return a localized success message or base64 if small.
            return {
                status: "completed",
                size: buffer.length
            };
        });

        return { body: pdfBuffer };
    }
);
