import puppeteer, { Browser } from 'puppeteer';

const puppeteerArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--js-flags="--max-old-space-size=512"',
];

interface PoolOptions {
    max: number;
    min: number;
    idleTimeoutMillis: number;
}

class SimpleBrowserPool {
    private pool: Browser[] = [];
    private options: PoolOptions;
    private activeCount = 0;

    constructor(options: PoolOptions) {
        this.options = options;
    }

    async acquire(retries = 0): Promise<Browser> {
        // 1. Try to get an idle browser
        if (this.pool.length > 0) {
            const browser = this.pool.pop();
            // Validate browser is still open
            if (browser && browser.isConnected()) {
                this.activeCount++;
                return browser;
            }
        }

        // 2. Create new if we have capacity
        if (this.activeCount < this.options.max) {
            this.activeCount++;
            return await this.createBrowser();
        }

        // 3. Wait/Retry with limit
        if (retries >= 30) { // 30 seconds timeout
            throw new Error('Browser pool exhausted and timeout reached');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.acquire(retries + 1);
    }

    async release(browser: Browser): Promise<void> {
        this.activeCount--;

        if (this.pool.length < this.options.max && browser.isConnected()) {
            this.pool.push(browser);
        } else {
            await browser.close();
        }
    }

    private async createBrowser(): Promise<Browser> {
        return puppeteer.launch({
            headless: true,
            args: puppeteerArgs,
            protocolTimeout: 30000,
        });
    }

    // Optional: cleanup interval
}

export const browserPool = new SimpleBrowserPool({
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000,
});
