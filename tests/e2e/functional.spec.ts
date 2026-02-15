import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Core Functional Flows', () => {
    test('should upload and process a PDF file successfully', async ({ page }) => {
        // 1. Navigate to Merge PDF tool
        await page.goto('/en/merge-pdf');

        // 2. Locate the file input
        // Note: Dropzone usually hides the input, so we use setInputFiles on the hidden input or verify the dropzone exists
        const fileInput = page.locator('input[type="file"]');

        // 3. Upload the dummy PDF
        await fileInput.setInputFiles(path.join(__dirname, '../fixtures/dummy.pdf'));

        // 4. Verification: Look for the file in the "Files" list
        // Assuming the UI shows the filename after upload
        await expect(page.locator('text=dummy.pdf')).toBeVisible();

        // 5. Click "Merge PDF" (or standard action button)
        const actionButton = page.locator('button:has-text("Merge PDF")');
        // Wait for button to be enabled (upload might take a moment to process thumbnail)
        await expect(actionButton).toBeEnabled();
        await actionButton.click();

        // 6. Assert Success
        // Usually shows a "Download" button or a Success toast
        // We look for a Download button that appears after processing
        const downloadButton = page.locator('a:has-text("Download")');
        await expect(downloadButton).toBeVisible({ timeout: 10000 });
    });
});
