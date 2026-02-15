
import { test, expect } from '@playwright/test';

test('has title and starts free', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/PDFToolskit/);

    // Check for the Go Pro button (or equivalent)
    const goProButton = page.getByRole('button', { name: /Go Pro/i });
    await expect(goProButton).toBeVisible();
});

test('navigation to pricing works', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Pricing');
    await expect(page).toHaveURL(/.*pricing/);
    await expect(page.getByText(/Choose Your Plan/i)).toBeVisible();
});
