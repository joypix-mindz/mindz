import { Command } from '@affine/cmdk';
import { formatDate } from '@affine/component/page-list';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { CommandCategory } from '@toeverything/infra/command';
import clsx from 'clsx';
import { useAtom, useSetAtom } from 'jotai';
import { Suspense, useEffect, useMemo } from 'react';

import {
  cmdkQueryAtom,
  customCommandFilter,
  useCMDKCommandGroups,
} from './data';
import * as styles from './main.css';
import { CMDKModal, type CMDKModalProps } from './modal';
import type { CMDKCommand } from './types';

type NoParametersKeys<T> = {
  [K in keyof T]: T[K] extends () => any ? K : never;
}[keyof T];

type i18nKey = NoParametersKeys<ReturnType<typeof useAFFiNEI18N>>;

const categoryToI18nKey: Record<CommandCategory, i18nKey> = {
  'affine:recent': 'com.affine.cmdk.affine.category.affine.recent',
  'affine:navigation': 'com.affine.cmdk.affine.category.affine.navigation',
  'affine:creation': 'com.affine.cmdk.affine.category.affine.creation',
  'affine:general': 'com.affine.cmdk.affine.category.affine.general',
  'affine:layout': 'com.affine.cmdk.affine.category.affine.layout',
  'affine:pages': 'com.affine.cmdk.affine.category.affine.pages',
  'affine:settings': 'com.affine.cmdk.affine.category.affine.settings',
  'affine:updates': 'com.affine.cmdk.affine.category.affine.updates',
  'affine:help': 'com.affine.cmdk.affine.category.affine.help',
  'editor:edgeless': 'com.affine.cmdk.affine.category.editor.edgeless',
  'editor:insert-object':
    'com.affine.cmdk.affine.category.editor.insert-object',
  'editor:page': 'com.affine.cmdk.affine.category.editor.page',
};

const QuickSearchGroup = ({
  category,
  commands,
  onOpenChange,
}: {
  category: CommandCategory;
  commands: CMDKCommand[];
  onOpenChange?: (open: boolean) => void;
}) => {
  const t = useAFFiNEI18N();
  const i18nkey = categoryToI18nKey[category];
  const setQuery = useSetAtom(cmdkQueryAtom);
  return (
    <Command.Group key={category} heading={t[i18nkey]()}>
      {commands.map(command => {
        return (
          <Command.Item
            key={command.id}
            onSelect={() => {
              command.run();
              setQuery('');
              onOpenChange?.(false);
            }}
            value={command.value}
          >
            <div className={styles.itemIcon}>{command.icon}</div>
            <div
              data-testid="cmdk-label"
              className={styles.itemLabel}
              data-value={
                command.originalValue ? command.originalValue : undefined
              }
            >
              {command.label}
            </div>
            {command.timestamp ? (
              <div className={styles.timestamp}>
                {formatDate(new Date(command.timestamp))}
              </div>
            ) : null}
            {command.keyBinding ? (
              <CMDKKeyBinding
                keyBinding={
                  typeof command.keyBinding === 'string'
                    ? command.keyBinding
                    : command.keyBinding.binding
                }
              />
            ) : null}
          </Command.Item>
        );
      })}
    </Command.Group>
  );
};

const QuickSearchCommands = ({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void;
}) => {
  const groups = useCMDKCommandGroups();

  return groups.map(([category, commands]) => {
    return (
      <QuickSearchGroup
        key={category}
        onOpenChange={onOpenChange}
        category={category}
        commands={commands}
      />
    );
  });
};

export const CMDKContainer = ({
  className,
  onQueryChange,
  query,
  children,
  ...rest
}: React.PropsWithChildren<{
  className?: string;
  query: string;
  onQueryChange: (query: string) => void;
}>) => {
  const t = useAFFiNEI18N();
  return (
    <Command
      {...rest}
      data-testid="cmdk-quick-search"
      filter={customCommandFilter}
      className={clsx(className, styles.panelContainer)}
      // Handle KeyboardEvent conflicts with blocksuite
      onKeyDown={(e: React.KeyboardEvent) => {
        if (
          e.key === 'ArrowDown' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight'
        ) {
          e.stopPropagation();
        }
      }}
    >
      {/* todo: add page context here */}
      <Command.Input
        placeholder={t['com.affine.cmdk.placeholder']()}
        autoFocus
        {...rest}
        value={query}
        onValueChange={onQueryChange}
        className={clsx(className, styles.searchInput)}
      />
      <Command.List>{children}</Command.List>
    </Command>
  );
};

export const CMDKQuickSearchModal = (props: CMDKModalProps) => {
  const [query, setQuery] = useAtom(cmdkQueryAtom);
  useEffect(() => {
    if (props.open) {
      setQuery('');
    }
  }, [props.open, setQuery]);
  return (
    <CMDKModal {...props}>
      <CMDKContainer
        className={styles.root}
        query={query}
        onQueryChange={setQuery}
      >
        <Suspense fallback={<Command.Loading />}>
          <QuickSearchCommands onOpenChange={props.onOpenChange} />
        </Suspense>
      </CMDKContainer>
    </CMDKModal>
  );
};

const CMDKKeyBinding = ({ keyBinding }: { keyBinding: string }) => {
  const isMacOS = environment.isBrowser && environment.isMacOs;
  const fragments = useMemo(() => {
    return keyBinding.split('+').map(fragment => {
      if (fragment === '$mod') {
        return isMacOS ? '⌘' : 'Ctrl';
      }
      if (fragment === 'ArrowUp') {
        return '↑';
      }
      if (fragment === 'ArrowDown') {
        return '↓';
      }
      if (fragment === 'ArrowLeft') {
        return '←';
      }
      if (fragment === 'ArrowRight') {
        return '→';
      }
      return fragment;
    });
  }, [isMacOS, keyBinding]);

  return (
    <div className={styles.keybinding}>
      {fragments.map((fragment, index) => {
        return (
          <div key={index} className={styles.keybindingFragment}>
            {fragment}
          </div>
        );
      })}
    </div>
  );
};
