import { expect, type Page } from '@playwright/test';
import { test } from './libs/playwright.js';
import { loadPage } from './libs/load-page.js';
import { withCtrlOrMeta } from './libs/keyboard.js';
import { newPage } from './libs/page-logic.js';
loadPage();

const openQuickSearchByShortcut = async (page: Page) =>
  await withCtrlOrMeta(page, () => page.keyboard.press('k', { delay: 50 }));

async function assertTitleTexts(page: Page, texts: string, isSearch?: boolean) {
  if (isSearch) {
    const actual = await page.evaluate(() => {
      const titleElement = <HTMLTextAreaElement>(
        document.querySelector('.affine-default-page-block-title')
      );
      return titleElement.value;
    });
    expect(actual).toEqual(texts);
  } else {
    const actual = await page.title();
    expect(actual).toEqual(texts);
  }
}
async function assertResultList(page: Page, texts: string[]) {
  const actual = await page.locator('[cmdk-item]').allInnerTexts();
  expect(actual).toEqual(texts);
}

test.describe('Open quick search', () => {
  test('Click slider bar button', async ({ page }) => {
    await newPage(page);
    const quickSearchButton = page.locator(
      '[data-testid=sliderBar-quickSearchButton]'
    );
    await quickSearchButton.click();
    const quickSearch = page.locator('[data-testid=quickSearch]');
    await expect(quickSearch).toBeVisible();
  });

  test('Click arrowDown icon after title', async ({ page }) => {
    await newPage(page);
    const quickSearchButton = page.locator(
      '[data-testid=header-quickSearchButton]'
    );
    await quickSearchButton.click();
    const quickSearch = page.locator('[data-testid=quickSearch]');
    await expect(quickSearch).toBeVisible();
  });

  test('Press the shortcut key cmd+k', async ({ page }) => {
    await newPage(page);
    await openQuickSearchByShortcut(page);
    const quickSearch = page.locator('[data-testid=quickSearch]');
    await expect(quickSearch).toBeVisible();
  });
});

test.describe('Add new page in quick search', () => {
  test('Create a new page without keyword', async ({ page }) => {
    await newPage(page);
    await openQuickSearchByShortcut(page);
    const addNewPage = page.locator('[data-testid=quickSearch-addNewPage]');
    await addNewPage.click();
    await page.waitForTimeout(300);
    await assertTitleTexts(page, 'Untitled');
  });

  test('Create a new page with keyword', async ({ page }) => {
    await newPage(page);
    await openQuickSearchByShortcut(page);
    await page.keyboard.insertText('test123456');
    const addNewPage = page.locator('[data-testid=quickSearch-addNewPage]');
    await addNewPage.click();
    await page.waitForTimeout(300);
    await assertTitleTexts(page, 'test123456');
  });
});

test.describe('Search and select', () => {
  test('Create a new page and search this page', async ({ page }) => {
    await newPage(page);
    await openQuickSearchByShortcut(page);
    await page.keyboard.insertText('test123456');
    const addNewPage = page.locator('[data-testid=quickSearch-addNewPage]');
    await addNewPage.click();
    await page.waitForTimeout(300);
    await assertTitleTexts(page, 'test123456');
    await openQuickSearchByShortcut(page);
    await page.keyboard.insertText('test123456');
    await assertResultList(page, ['test123456']);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await assertTitleTexts(page, 'test123456', true);
  });
});
test.describe('Disable search on 404 page', () => {
  test('Navigate to the 404 page and try to open quick search', async ({
    page,
  }) => {
    await page.goto('http://localhost:8080/404');
    const notFoundTip = page.locator('[data-testid=notFound]');
    await expect(notFoundTip).toBeVisible();
    await openQuickSearchByShortcut(page);
    const quickSearch = page.locator('[data-testid=quickSearch]');
    await expect(quickSearch).toBeVisible({ visible: false });
  });
});
test.describe('Open quick search on the published page', () => {
  test('Open quick search on local page', async ({ page }) => {
    await newPage(page);
    await openQuickSearchByShortcut(page);
    const publishedSearchResults = page.locator('[publishedSearchResults]');
    await expect(publishedSearchResults).toBeVisible({ visible: false });
  });
});
