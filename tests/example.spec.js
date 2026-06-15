import { test, expect } from '@playwright/test';

test('open koperasi system', async ({ page }) => {
    await page.goto('http://localhost/Koperasi_combine_29_4_26');

    // check page loaded
    await expect(page).toHaveTitle(/Koperasi/i);
});