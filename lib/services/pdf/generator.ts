
import puppeteer from 'puppeteer';

interface GeneratePdfOptions {
    url?: string;
    html?: string;
    format?: 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape';
    browserlessToken?: string;
}

export async function generatePdfBuffer({ url, html, format = 'a4', orientation = 'portrait', browserlessToken }: GeneratePdfOptions): Promise<Buffer> {
    let browser;
    let targetUrl = url;

    if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        if (browserlessToken) {
            console.log('Connecting to Browserless...');
            browser = await puppeteer.connect({
                browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
            });
        } else {
            console.log('Launching Local Puppeteer...');
            const { browserPool } = await import('@/lib/puppeteer');
            browser = await browserPool.acquire();
        }

        const page = await browser.newPage();

        try {
            page.setDefaultNavigationTimeout(30000);
            page.setDefaultTimeout(30000);
            await page.setViewport({ width: 1280, height: 800 });

            if (html) {
                console.log('Rendering raw HTML content...');
                await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
            } else if (targetUrl) {
                console.log(`Navigating to ${targetUrl}...`);
                await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            } else {
                throw new Error('Either URL or HTML content must be provided');
            }

            await page.emulateMediaType('screen');

            // Auto-scroll for lazy loading
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const maxScrolls = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight || totalHeight / distance >= maxScrolls) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 50);
                });
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            const pdfBuffer = await page.pdf({
                format: format.toUpperCase() as any,
                landscape: orientation === 'landscape',
                printBackground: true,
                timeout: 30000,
                margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
            });

            return Buffer.from(pdfBuffer);

        } finally {
            if (page) await page.close();
        }

    } finally {
        if (browser) {
            if (browserlessToken) {
                await browser.close();
            } else {
                const { browserPool } = await import('@/lib/puppeteer');
                await browserPool.release(browser);
            }
        }
    }
}
