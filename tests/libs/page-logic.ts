import type { Page } from '@playwright/test';

export async function waitMarkdownImported(page: Page) {
  return page.evaluate(
    () =>
      new Promise(resolve => {
        document.addEventListener('markdown:imported', resolve);
      })
  );
}

export async function newPage(page: Page) {
  // fixme(himself65): if too fast, the page will crash
  await page.getByTestId('new-page-button').click({
    delay: 100,
  });
  await page.waitForSelector('v-line');
}

export function getBlockSuiteEditorTitle(page: Page) {
  return page.locator('v-line').nth(0);
}

export async function clickPageMoreActions(page: Page) {
  return page
    .getByTestId('editor-header-items')
    .getByTestId('editor-option-menu')
    .click();
}
