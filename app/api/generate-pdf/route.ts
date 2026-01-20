import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
    try {
        const { url, format = 'a4', orientation = 'portrait' } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        let targetUrl = url;
        // Ensure protocol
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }

        // Validate URL
        try {
            new URL(targetUrl);
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Safer for containerized environments
        });

        try {
            const page = await browser.newPage();

            // Set viewport to a reasonable desktop size for responsive sites
            await page.setViewport({ width: 1280, height: 800 });

            // Navigate to URL
            // networkidle0 waits until there are no more than 0 network connections for at least 500ms
            // This ensures most assets are loaded.
            await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });

            // Add some basic print styles if needed, or rely on the page's print styles
            // We force screen media type to get the "correct" visual look instead of print stylesheet sometimes
            await page.emulateMediaType('screen');

            // Auto-scroll to trigger lazy loading
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });

            // Wait a bit more for lazy loaded images to finish fetching
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: format.toUpperCase() as any, // 'A4', 'LETTER'
                landscape: orientation === 'landscape',
                printBackground: true,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm',
                },
            });

            await browser.close();

            // Return PDF
            const blob = new Blob([pdfBuffer as any], { type: 'application/pdf' });
            return new NextResponse(blob, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${new URL(targetUrl).hostname}.pdf"`,
                },
            });

        } catch (pageError: any) {
            await browser.close();
            console.error('Puppeteer Page Error:', pageError);
            return NextResponse.json({ error: `Failed to render page: ${pageError.message}` }, { status: 500 });
        }

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
