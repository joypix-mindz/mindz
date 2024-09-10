import {
  type ElementOrFactory,
  Input,
  notify,
  toast,
  type ToastOptions,
  toReactNode,
  type useConfirmModal,
} from '@affine/component';
import { track } from '@affine/core/mixpanel';
import { DocsSearchService } from '@affine/core/modules/docs-search';
import type { EditorService } from '@affine/core/modules/editor';
import { resolveLinkToDoc } from '@affine/core/modules/navigation';
import type { PeekViewService } from '@affine/core/modules/peek-view';
import type { ActivePeekView } from '@affine/core/modules/peek-view/entities/peek-view';
import {
  CreationQuickSearchSession,
  DocsQuickSearchSession,
  type QuickSearchItem,
  QuickSearchService,
  RecentDocsQuickSearchSession,
} from '@affine/core/modules/quicksearch';
import { DebugLogger } from '@affine/debug';
import {
  ReferenceInlineSpecExtension,
  ReferenceNodeConfig,
} from '@blocksuite/affine-components/rich-text';
import {
  type BlockService,
  BlockViewIdentifier,
  type ExtensionType,
  StdIdentifier,
  type WidgetComponent,
} from '@blocksuite/block-std';
import { BlockServiceWatcher } from '@blocksuite/block-std';
import {
  type AffineReference,
  type DocMode,
  EmbedOptionProvider,
  ReferenceInfoSchema,
  type RootService,
} from '@blocksuite/blocks';
import {
  AffineSlashMenuWidget,
  DocModeProvider,
  EdgelessRootBlockComponent,
  EmbedLinkedDocBlockComponent,
  QuickSearchProvider,
} from '@blocksuite/blocks';
import { LinkIcon } from '@blocksuite/icons/rc';
import { AIChatBlockSchema } from '@blocksuite/presets';
import type { BlockSnapshot } from '@blocksuite/store';
import {
  type DocService,
  DocsService,
  type FrameworkProvider,
} from '@toeverything/infra';
import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';
import { z } from 'zod';

export type ReferenceReactRenderer = (
  reference: AffineReference
) => React.ReactElement;

const logger = new DebugLogger('affine::spec-patchers');

function patchSpecService<Service extends BlockService = BlockService>(
  flavour: string,
  onMounted: (service: Service) => (() => void) | void,
  onWidgetConnected?: (component: WidgetComponent) => void
) {
  class TempServiceWatcher extends BlockServiceWatcher {
    static override readonly flavour = flavour;
    override mounted() {
      super.mounted();
      const disposable = onMounted(this.blockService as any);
      const disposableGroup = this.blockService.disposables;
      if (disposable) {
        disposableGroup.add(disposable);
      }

      if (onWidgetConnected) {
        disposableGroup.add(
          this.blockService.specSlots.widgetConnected.on(({ component }) => {
            onWidgetConnected(component);
          })
        );
      }
    }
  }
  return TempServiceWatcher;
}

/**
 * Patch the block specs with custom renderers.
 */
export function patchReferenceRenderer(
  reactToLit: (element: ElementOrFactory) => TemplateResult,
  reactRenderer: ReferenceReactRenderer
): ExtensionType[] {
  const litRenderer = (reference: AffineReference) => {
    const node = reactRenderer(reference);
    return reactToLit(node);
  };

  return [
    {
      setup: di => {
        const std = di.provider().get(StdIdentifier);
        const config = new ReferenceNodeConfig(std);
        config.setCustomContent(litRenderer);

        di.override(ReferenceInlineSpecExtension.identifier, () => ({
          name: 'reference',
          schema: z
            .object({
              type: z.enum([
                // @deprecated Subpage is deprecated, use LinkedPage instead
                'Subpage',
                'LinkedPage',
              ]),
            })
            .merge(ReferenceInfoSchema)
            .optional()
            .nullable()
            .catch(undefined),
          match: delta => {
            return !!delta.attributes?.reference;
          },
          renderer: ({ delta, selected }) => {
            return html`<affine-reference
              .delta=${delta}
              .selected=${selected}
              .config=${config}
            ></affine-reference>`;
          },
          embed: true,
        }));
      },
    },
  ];
}

export function patchNotificationService({
  closeConfirmModal,
  openConfirmModal,
}: ReturnType<typeof useConfirmModal>) {
  return patchSpecService<RootService>('affine:page', service => {
    service.notificationService = {
      confirm: async ({ title, message, confirmText, cancelText, abort }) => {
        return new Promise<boolean>(resolve => {
          openConfirmModal({
            title: toReactNode(title),
            description: toReactNode(message),
            confirmText,
            confirmButtonOptions: {
              variant: 'primary',
            },
            cancelText,
            onConfirm: () => {
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          });
          abort?.addEventListener('abort', () => {
            resolve(false);
            closeConfirmModal();
          });
        });
      },
      prompt: async ({
        title,
        message,
        confirmText,
        placeholder,
        cancelText,
        autofill,
        abort,
      }) => {
        return new Promise<string | null>(resolve => {
          let value = autofill || '';
          const description = (
            <div>
              <span style={{ marginBottom: 12 }}>{toReactNode(message)}</span>
              <Input
                placeholder={placeholder}
                defaultValue={value}
                onChange={e => (value = e)}
                ref={input => input?.select()}
              />
            </div>
          );
          openConfirmModal({
            title: toReactNode(title),
            description: description,
            confirmText: confirmText ?? 'Confirm',
            confirmButtonOptions: {
              variant: 'primary',
            },
            cancelText: cancelText ?? 'Cancel',
            onConfirm: () => {
              resolve(value);
            },
            onCancel: () => {
              resolve(null);
            },
          });
          abort?.addEventListener('abort', () => {
            resolve(null);
            closeConfirmModal();
          });
        });
      },
      toast: (message: string, options: ToastOptions) => {
        return toast(message, options);
      },
      notify: notification => {
        const accentToNotify = {
          error: notify.error,
          success: notify.success,
          warning: notify.warning,
          info: notify,
        };

        const fn = accentToNotify[notification.accent || 'info'];
        if (!fn) {
          throw new Error('Invalid notification accent');
        }

        const toastId = fn(
          {
            title: toReactNode(notification.title),
            message: toReactNode(notification.message),
            action: notification.action?.onClick
              ? {
                  label: toReactNode(notification.action?.label),
                  onClick: notification.action.onClick,
                }
              : undefined,
            onDismiss: notification.onClose,
          },
          {
            duration: notification.duration || 0,
            onDismiss: notification.onClose,
            onAutoClose: notification.onClose,
          }
        );

        notification.abort?.addEventListener('abort', () => {
          notify.dismiss(toastId);
        });
      },
    };
  });
}

export function patchPeekViewService(service: PeekViewService) {
  return patchSpecService<RootService>('affine:page', pageService => {
    pageService.peekViewService = {
      peek: (target: ActivePeekView['target'], template?: TemplateResult) => {
        logger.debug('center peek', target, template);
        return service.peekView.open(target, template);
      },
    };
  });
}

export function patchDocModeService(
  docService: DocService,
  docsService: DocsService,
  editorService: EditorService
): ExtensionType {
  const DEFAULT_MODE = 'page';
  class AffineDocModeService implements DocModeProvider {
    setEditorMode = (mode: DocMode) => {
      editorService.editor.setMode(mode);
    };
    getEditorMode = () => {
      return editorService.editor.mode$.value;
    };
    setPrimaryMode = (mode: DocMode, id?: string) => {
      if (id) {
        docsService.list.setPrimaryMode(id, mode);
      } else {
        docService.doc.setPrimaryMode(mode);
      }
    };
    getPrimaryMode = (id?: string) => {
      const mode = id
        ? docsService.list.getPrimaryMode(id)
        : docService.doc.getPrimaryMode();
      return (mode || DEFAULT_MODE) as DocMode;
    };
    togglePrimaryMode = (id?: string) => {
      const mode = id
        ? docsService.list.togglePrimaryMode(id)
        : docService.doc.togglePrimaryMode();
      return (mode || DEFAULT_MODE) as DocMode;
    };
    onPrimaryModeChange = (handler: (mode: DocMode) => void, id?: string) => {
      // eslint-disable-next-line rxjs/finnish
      const mode$ = id
        ? docsService.list.primaryMode$(id)
        : docService.doc.primaryMode$;
      const sub = mode$.subscribe(m => handler((m || DEFAULT_MODE) as DocMode));
      return {
        dispose: sub.unsubscribe,
      };
    };
  }

  const docModeExtension: ExtensionType = {
    setup: di => [di.override(DocModeProvider, AffineDocModeService)],
  };

  return docModeExtension;
}

export function patchQuickSearchService(framework: FrameworkProvider) {
  const QuickSearchExtension: ExtensionType = {
    setup: di => {
      di.addImpl(QuickSearchProvider, () => ({
        async searchDoc(options) {
          let searchResult:
            | { docId: string; isNewDoc?: boolean }
            | { userInput: string }
            | null = null;
          if (options.skipSelection) {
            const query = options.userInput;
            if (!query) {
              logger.error('No user input provided');
            } else {
              const resolvedDoc = resolveLinkToDoc(query);
              if (resolvedDoc) {
                searchResult = {
                  docId: resolvedDoc.docId,
                };
              } else if (
                query.startsWith('http://') ||
                query.startsWith('https://')
              ) {
                searchResult = {
                  userInput: query,
                };
              } else {
                const searchedDoc = (
                  await framework.get(DocsSearchService).search(query)
                ).at(0);
                if (searchedDoc) {
                  searchResult = {
                    docId: searchedDoc.docId,
                  };
                }
              }
            }
          } else {
            searchResult = await new Promise(resolve =>
              framework.get(QuickSearchService).quickSearch.show(
                [
                  framework.get(RecentDocsQuickSearchSession),
                  framework.get(DocsQuickSearchSession),
                  framework.get(CreationQuickSearchSession),
                  (query: string) => {
                    if (
                      (query.startsWith('http://') ||
                        query.startsWith('https://')) &&
                      resolveLinkToDoc(query) === null
                    ) {
                      return [
                        {
                          id: 'link',
                          source: 'link',
                          icon: LinkIcon,
                          label: {
                            key: 'com.affine.cmdk.affine.insert-link',
                          },
                          payload: { url: query },
                        } as QuickSearchItem<'link', { url: string }>,
                      ];
                    }
                    return [];
                  },
                ],
                result => {
                  if (result === null) {
                    resolve(null);
                    return;
                  }
                  if (
                    result.source === 'docs' ||
                    result.source === 'recent-doc'
                  ) {
                    resolve({
                      docId: result.payload.docId,
                    });
                  } else if (result.source === 'link') {
                    resolve({
                      userInput: result.payload.url,
                    });
                  } else if (result.source === 'creation') {
                    const docsService = framework.get(DocsService);
                    const mode =
                      result.id === 'creation:create-edgeless'
                        ? 'edgeless'
                        : 'page';
                    const newDoc = docsService.createDoc({
                      primaryMode: mode,
                      title: result.payload.title,
                    });
                    resolve({
                      docId: newDoc.id,
                      isNewDoc: true,
                    });
                  }
                },
                {
                  defaultQuery: options.userInput,
                  label: {
                    key: 'com.affine.cmdk.insert-links',
                  },
                  placeholder: {
                    key: 'com.affine.cmdk.docs.placeholder',
                  },
                }
              )
            );
          }

          return searchResult;
        },
      }));
    },
  };
  const SlashMenuQuickSearchExtension = patchSpecService<RootService>(
    'affine:page',
    () => {},
    (component: WidgetComponent) => {
      if (component instanceof AffineSlashMenuWidget) {
        component.config.items.forEach(item => {
          if (
            'action' in item &&
            (item.name === 'Linked Doc' || item.name === 'Link')
          ) {
            const oldAction = item.action;
            item.action = async ({ model, rootComponent }) => {
              const { host, std } = rootComponent;
              const quickSearchService =
                component.std.getOptional(QuickSearchProvider);

              if (!quickSearchService)
                return oldAction({ model, rootComponent });

              const result = await quickSearchService.searchDoc({});
              if (result === null) return;

              if ('docId' in result) {
                const linkedDoc = std.collection.getDoc(result.docId);
                if (!linkedDoc) return;

                host.doc.addSiblingBlocks(model, [
                  {
                    flavour: 'affine:embed-linked-doc',
                    pageId: linkedDoc.id,
                  },
                ]);
                if (result.isNewDoc) {
                  track.doc.editor.slashMenu.createDoc({ control: 'linkDoc' });
                  track.doc.editor.slashMenu.linkDoc({ control: 'createDoc' });
                }
                track.doc.editor.slashMenu.linkDoc({ control: 'linkDoc' });
              } else if ('userInput' in result) {
                const embedOptions = std
                  .get(EmbedOptionProvider)
                  .getEmbedBlockOptions(result.userInput);
                if (!embedOptions) return;

                host.doc.addSiblingBlocks(model, [
                  {
                    flavour: embedOptions.flavour,
                    url: result.userInput,
                  },
                ]);
              }
            };
          }
        });
      }
    }
  );
  return [QuickSearchExtension, SlashMenuQuickSearchExtension];
}

export function patchEdgelessClipboard() {
  class EdgelessClipboardWatcher extends BlockServiceWatcher {
    static override readonly flavour = 'affine:page';

    override mounted() {
      super.mounted();
      this.blockService.disposables.add(
        this.blockService.specSlots.viewConnected.on(view => {
          const { component } = view;
          if (component instanceof EdgelessRootBlockComponent) {
            const AIChatBlockFlavour = AIChatBlockSchema.model.flavour;
            const createFunc = (block: BlockSnapshot) => {
              const {
                xywh,
                scale,
                messages,
                sessionId,
                rootDocId,
                rootWorkspaceId,
              } = block.props;
              const blockId = component.service.addBlock(
                AIChatBlockFlavour,
                {
                  xywh,
                  scale,
                  messages,
                  sessionId,
                  rootDocId,
                  rootWorkspaceId,
                },
                component.surface.model.id
              );
              return blockId;
            };
            component.clipboardController.registerBlock(
              AIChatBlockFlavour,
              createFunc
            );
          }
        })
      );
    }
  }

  return EdgelessClipboardWatcher;
}

@customElement('affine-linked-doc-ref-block')
// @ts-expect-error ignore private warning for overriding _load
export class LinkedDocBlockComponent extends EmbedLinkedDocBlockComponent {
  override async _load() {
    this.isBannerEmpty = true;
  }
}

export function patchForSharedPage() {
  const extension: ExtensionType = {
    setup: di => {
      di.override(
        BlockViewIdentifier('affine:embed-linked-doc'),
        () => literal`affine-linked-doc-ref-block`
      );
      di.override(
        BlockViewIdentifier('affine:embed-synced-doc'),
        () => literal`affine-linked-doc-ref-block`
      );
    },
  };
  return extension;
}
