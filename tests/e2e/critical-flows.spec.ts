import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('PDF Toolskit Critical Flows', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the home page or a specific tool page
        await page.goto('/en');
    });

    test('should be able to navigate to Merge PDF', async ({ page }) => {
        await page.click('text=Merge PDF');
        await expect(page).toHaveURL(/\/en\/merge-pdf/);
        await expect(page.locator('h1')).toContainText('Merge PDF');
    });

    test('should be able to navigate to Split PDF', async ({ page }) => {
        await page.click('text=Split PDF');
        await expect(page).toHaveURL(/\/en\/split-pdf/);
        await expect(page.locator('h1')).toContainText('Split PDF');
    });

    test('should show unauthorized for premium tools when not logged in', async ({ page }) => {
        // OCR PDF is usually a pro tool
        await page.goto('/en/ocr-pdf');

        // Check if FileUpload is present but restricted or if there's a pro badge
        // Note: Actual behavior depends on implementation_checklist Phase 14/15
        await expect(page.locator('text=Pro')).toBeVisible();
    });

    test('should have a functional Header and Footer', async ({ page }) => {
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('footer')).toBeVisible();

        // Check logo
        await expect(page.locator('text=PDFToolskit')).toBeVisible();
    });
});
