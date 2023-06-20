import markdownTemplate from '@affine/templates/AFFiNE-beta-0.5.4.md';
import { ContentParser } from '@blocksuite/blocks/content-parser';
import type { Page } from '@blocksuite/store';

declare global {
  interface Window {
    lastImportedMarkdown: string;
  }
}

const markdown = markdownTemplate as unknown as string;

const demoTitle = markdown
  .split('\n')
  .splice(0, 1)
  .join('')
  .replaceAll('#', '')
  .trim();

const demoText = markdown.split('\n').slice(1).join('\n');

export function initPage(page: Page): void {
  console.debug('initEmptyPage', page.id);
  // Add page block and surface block at root level
  const isFirstPage = page.meta.init === true;
  if (isFirstPage) {
    page.workspace.setPageMeta(page.id, {
      init: false,
    });
    _initPageWithDemoMarkdown(page);
  } else {
    _initEmptyPage(page);
  }
  page.resetHistory();
}

export function _initEmptyPage(page: Page, title?: string): void {
  const pageBlockId = page.addBlock('affine:page', {
    title: new page.Text(title ?? ''),
  });
  page.addBlock('affine:surface', {}, pageBlockId);
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  page.addBlock('affine:paragraph', {}, frameId);
}

export function _initPageWithDemoMarkdown(page: Page): void {
  console.debug('initPageWithDefaultMarkdown', page.id);
  const pageBlockId = page.addBlock('affine:page', {
    title: new page.Text(demoTitle),
  });
  page.addBlock('affine:surface', {}, pageBlockId);
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  page.addBlock('affine:paragraph', {}, frameId);
  const contentParser = new ContentParser(page);
  contentParser.importMarkdown(demoText, frameId);
  page.workspace.setPageMeta(page.id, { title: demoTitle });
}
