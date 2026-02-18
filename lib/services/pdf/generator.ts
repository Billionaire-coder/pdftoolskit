
import puppeteer from 'puppeteer';

interface GeneratePdfOptions {
    url?: string;
    html?: string;
    format?: 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape';
    browserlessToken?: string;
    viewport?: 'mobile' | 'tablet' | 'desktop';
    cleanShot?: boolean;
}

const VIEWPORT_MAP = {
    mobile: { width: 390, height: 844, isMobile: true },
    tablet: { width: 820, height: 1180, isMobile: true },
    desktop: { width: 1440, height: 900, isMobile: false }
};

export async function generatePdfBuffer({
    url,
    html,
    format = 'a4',
    orientation = 'portrait',
    browserlessToken,
    viewport = 'desktop',
    cleanShot = true
}: GeneratePdfOptions): Promise<Buffer> {
    let browser;
    let targetUrl = url;

    if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        if (browserlessToken) {
            browser = await puppeteer.connect({
                browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
            });
        } else {
            const { browserPool } = await import('@/lib/puppeteer');
            browser = await browserPool.acquire();
        }

        const page = await browser.newPage();

        try {
            page.setDefaultNavigationTimeout(45000);
            page.setDefaultTimeout(45000);

            const vpSize = VIEWPORT_MAP[viewport];
            await page.setViewport(vpSize);

            if (viewport !== 'desktop') {
                await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
            }

            if (html) {
                await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
            } else if (targetUrl) {
                await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
            } else {
                throw new Error('Either URL or HTML content must be provided');
            }

            await page.emulateMediaType('screen');

            // Clean-Shot Engine: Strip common overlays
            if (cleanShot) {
                await page.evaluate(() => {
                    const selectors = [
                        '[id*="cookie"]', '[class*="cookie"]', '[id*="consent"]', '[class*="consent"]',
                        '[id*="banner"]', '[class*="banner"]', '[id*="popup"]', '[class*="popup"]',
                        '[id*="modal"]', '[class*="modal"]', '[id*="newsletter"]', '[class*="newsletter"]',
                        '[id*="overlay"]', '[class*="overlay"]', '.cmp-banner', '#onetrust-consent-sdk',
                        '.ad-container', '[class*="advertisement"]', '.promo-bar'
                    ];

                    document.querySelectorAll(selectors.join(',')).forEach(el => {
                        (el as HTMLElement).style.display = 'none';
                    });

                    // Unfreeze scroll if locked by modal
                    document.body.style.overflow = 'auto';
                    document.documentElement.style.overflow = 'auto';
                });
            }

            // Auto-scroll for lazy loading
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 200;
                    const maxScrolls = 50;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight || totalHeight / distance >= maxScrolls) {
                            clearInterval(timer);
                            window.scrollTo(0, 0); // Reset to top for capture
                            resolve();
                        }
                    }, 100);
                });
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            const pdfBuffer = await page.pdf({
                format: format.toUpperCase() as any,
                landscape: orientation === 'landscape',
                printBackground: true,
                timeout: 30000,
                margin: { top: '0', right: '0', bottom: '0', left: '0' }, // Full bleed for web archival
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
