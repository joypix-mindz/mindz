import { test } from '@affine-test/kit/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { openHomePage } from '../libs/load-page';
import {
  closeDownloadTip,
  getBlockSuiteEditorTitle,
  newPage,
  waitEditorLoad,
} from '../libs/page-logic';

const createAndPinCollection = async (
  page: Page,
  options?: {
    collectionName?: string;
  }
) => {
  await openHomePage(page);
  await waitEditorLoad(page);
  await newPage(page);
  await getBlockSuiteEditorTitle(page).click();
  await getBlockSuiteEditorTitle(page).fill('test page');
  await page.getByTestId('all-pages').click();
  const cell = page.getByRole('cell', {
    name: 'test page',
  });
  await expect(cell).toBeVisible();
  await closeDownloadTip(page);
  await page.getByTestId('create-first-filter').click();
  await page
    .getByTestId('variable-select')
    .locator('button', { hasText: 'Created' })
    .click();
  await page.getByTestId('save-as-collection').click();
  const title = page.getByTestId('input-collection-title');
  await title.isVisible();
  await title.fill(options?.collectionName ?? 'test collection');
  await page.getByTestId('save-collection').click();
  await page.getByTestId('collection-bar-option-pin').click();
};
test('Show collections items in sidebar', async ({ page }) => {
  await createAndPinCollection(page);
  const collections = page.getByTestId('collections');
  const items = collections.getByTestId('collection-item');
  expect(await items.count()).toBe(1);
  const first = items.first();
  expect(await first.textContent()).toBe('test collection');
  await first.getByTestId('fav-collapsed-button').click();
  const collectionPage = collections.getByTestId('collection-page').nth(1);
  expect(await collectionPage.textContent()).toBe('test page');
  await collectionPage.getByTestId('collection-page-options').click();
  const deletePage = page
    .getByTestId('collection-page-option')
    .getByText('Delete');
  await deletePage.click();
  expect(await collections.getByTestId('collection-page').count()).toBe(1);
  await first.getByTestId('collection-options').click();
  const deleteCollection = page
    .getByTestId('collection-option')
    .getByText('Delete');
  await deleteCollection.click();
  expect(await items.count()).toBe(0);
});

test('pin and unpin collection', async ({ page }) => {
  const name = 'asd';
  await createAndPinCollection(page, { collectionName: name });
  const collections = page.getByTestId('collections');
  const items = collections.getByTestId('collection-item');
  expect(await items.count()).toBe(1);
  const first = items.first();
  await first.getByTestId('collection-options').click();
  const deleteCollection = page
    .getByTestId('collection-option')
    .getByText('Unpin');
  await deleteCollection.click();
  expect(await items.count()).toBe(0);
  await page.getByTestId('collection-select').click();
  const option = page.locator('[data-testid=collection-select-option]', {
    hasText: name,
  });
  await option.hover();
  await option.getByTestId('collection-select-option-pin').click();
  expect(await items.count()).toBe(1);
});

test('edit collection', async ({ page }) => {
  await createAndPinCollection(page);
  const collections = page.getByTestId('collections');
  const items = collections.getByTestId('collection-item');
  expect(await items.count()).toBe(1);
  const first = items.first();
  await first.getByTestId('collection-options').click();
  const editCollection = page
    .getByTestId('collection-option')
    .getByText('Edit Filter');
  await editCollection.click();
  const title = page.getByTestId('input-collection-title');
  await title.fill('123');
  await page.getByTestId('save-collection').click();
  expect(await first.textContent()).toBe('123');
});
