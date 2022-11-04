import { useEditor } from '@/components/editor-provider';
import '@blocksuite/blocks';
import '@blocksuite/blocks/style';
import type { EditorContainer } from '@blocksuite/editor';
import { createEditor } from '@blocksuite/editor';
import { forwardRef, Suspense, useEffect, useRef } from 'react';
import pkg from '../../package.json';
import exampleMarkdown from './example-markdown';

// eslint-disable-next-line react/display-name
const BlockSuiteEditor = forwardRef<EditorContainer>(({}, ref) => {
  const containerElement = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerElement.current) {
      return;
    }
    const editor = createEditor();
    containerElement.current.appendChild(editor);
    if (ref) {
      if ('current' in ref) {
        ref.current = editor;
      } else {
        ref(editor);
      }
    }
    return () => {
      editor.remove();
    };
  }, [ref]);
  return <div id="editor" style={{ height: '100%' }} ref={containerElement} />;
});

export const Editor = () => {
  const editorRef = useRef<EditorContainer>(null);
  const { setEditor } = useEditor();
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    setEditor(editorRef.current);
    const { space } = editorRef.current as EditorContainer;
    const pageId = space.addBlock({
      flavour: 'affine:page',
      title: 'Welcome to the AFFiNE Alpha',
    });
    const groupId = space.addBlock({ flavour: 'affine:group' }, pageId);
    editorRef.current.clipboard.importMarkdown(exampleMarkdown, `${groupId}`);
    space.resetHistory();
  }, [setEditor]);

  useEffect(() => {
    const version = pkg.dependencies['@blocksuite/editor'].substring(1);
    console.log(`BlockSuite live demo ${version}`);
  }, []);

  return (
    <Suspense fallback={<div>Error!</div>}>
      <BlockSuiteEditor ref={editorRef} />
    </Suspense>
  );
};

declare global {
  interface HTMLElementTagNameMap {
    'editor-container': EditorContainer;
  }

  namespace JSX {
    interface IntrinsicElements {
      // TODO fix types on react
      'editor-container': EditorContainer;
    }
  }
}

export default Editor;
