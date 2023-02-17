import { expect } from '@playwright/test';

import { loadPage } from './libs/load-page';
import { newPage } from './libs/page-logic';
import { test } from './libs/playwright';
loadPage();

test.describe('local first new page', () => {
  test('click btn new page', async ({ page }) => {
    const originPageId = page.url().split('/').reverse()[0];
    await newPage(page);
    const newPageId = page.url().split('/').reverse()[0];
    expect(newPageId).not.toBe(originPageId);
  });

  test('click btn bew page and find it in all pages', async ({ page }) => {
    await newPage(page);
    await page.getByPlaceholder('Title').click();
    await page.getByPlaceholder('Title').fill('this is a new page');
    await page.getByRole('link', { name: 'All pages' }).click();
    const cell = page.getByRole('cell', { name: 'this is a new page' });
    expect(cell).not.toBeUndefined();
  });
});
