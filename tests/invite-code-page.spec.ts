import { expect } from '@playwright/test';
import { test } from './libs/playwright';
import { loadPage } from './libs/load-page';

loadPage();

// ps aux | grep 8080
test.describe('invite code page', () => {
  test('the link has expired', async ({ page }) => {
    await page.goto('http://localhost:8080//invite/abc');
    await page.waitForTimeout(1000);
    expect(page.getByText('The link has expired')).not.toBeUndefined();
  });
});
