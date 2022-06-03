import {
  Editor,
  isNodeSelection,
  isTextSelection,
  posToDOMRect,
} from '@tiptap/react';
import { Editor as CoreEditor } from '@tiptap/core';
import * as Popover from '@radix-ui/react-popover';
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import isURL from 'validator/es/lib/isURL';
import { useForm } from 'react-hook-form';
import { useIsMobile } from '../../logic/useMedia';
import BlockquoteIcon from '../../components/icons/BlockquoteIcon';
import BoldIcon from '../../components/icons/BoldIcon';
import CodeIcon from '../../components/icons/CodeIcon';
import ItalicIcon from '../../components/icons/ItalicIcon';
import LinkIcon from '../../components/icons/LinkIcon';
import StrikeIcon from '../../components/icons/StrikeIcon';
import XIcon from '../../components/icons/XIcon';
import ChatInputMenuButton from './ChatInputMenuButton';

interface ChatInputMenuProps {
  editor: Editor;
}

interface ChatInputMenuToolbarProps {
  editor: CoreEditor;
  toolbarRef: React.RefObject<HTMLDivElement>;
  status: MenuState;
  setStatus: React.Dispatch<React.SetStateAction<MenuState>>;
  setLink: ({ url }: LinkEditorForm) => void;
  onNavigation: (event: KeyboardEvent<HTMLDivElement>) => void;
  isSelected: (key: string) => boolean;
  openLinkEditor: () => void;
}

interface LinkEditorForm {
  url: string;
}

type MenuState = 'closed' | 'open' | 'editing-link' | 'link-hover';

const options = ['bold', 'italic', 'strike', 'link', 'blockquote', 'code'];

function ChatInputMenuToolbar({
  editor,
  toolbarRef,
  status,
  setStatus,
  setLink,
  onNavigation,
  isSelected,
  openLinkEditor,
}: ChatInputMenuToolbarProps) {
  const { register, handleSubmit, formState } = useForm<LinkEditorForm>({
    mode: 'onChange',
  });
  const isMobile = useIsMobile();

  const toolbarClassNames = isMobile
    ? 'mt-2'
    : 'default-focus rounded-lg bg-white shadow-lg dark:border dark:border-black/10 w-full';

  return (
    <div
      ref={toolbarRef}
      className={toolbarClassNames}
      role="toolbar"
      tabIndex={0}
      aria-label="Text Formatting Menu"
      onKeyDown={onNavigation}
    >
      {status === 'editing-link' ? (
        <div className="flex items-center">
        <form
          className="input flex grow items-center p-0 leading-4"
          onSubmit={handleSubmit(setLink)}
        >
          <label htmlFor="url" className="sr-only">
            Enter a url
          </label>
          <input
            type="text"
            {...register('url', {
              validate: (value) => value === '' || isURL(value),
            })}
            defaultValue={editor.getAttributes('link').href || ''}
            autoFocus
            placeholder="Enter URL"
            className="input-inner flex-1 focus:outline-none"
          />
          <button
            type="submit"
            className="button ml-1 bg-transparent py-0.5 px-1.5 text-sm font-medium leading-4 text-gray-800 hover:bg-transparent hover:ring-2 disabled:bg-transparent disabled:text-gray-400"
            disabled={!formState.isValid}
          >
            Done
          </button>
        </form>
        {
          isMobile && 
          <button
            className="icon-button ml-2 h-8 w-8"
            onClick={() => setStatus('open')}
          >
            <XIcon className="h-6 w-6" />
          </button>
        }
        </div>
      ) : (
        <div className={`flex items center space-x-1 p-1 ${isMobile ? "justify-between" : ""}`}>
          <ChatInputMenuButton
            isActive={editor.isActive('bold')}
            isSelected={isSelected('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            unpressedLabel="Apply Bold"
            pressedLabel="Remove Bold"
          >
            <BoldIcon className="h-6 w-6" />
          </ChatInputMenuButton>
          <ChatInputMenuButton
            isActive={editor.isActive('italic')}
            isSelected={isSelected('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            unpressedLabel={'Apply Italic'}
            pressedLabel={'Remove Italic'}
          >
            <ItalicIcon className="h-6 w-6" />
          </ChatInputMenuButton>
          <ChatInputMenuButton
            isActive={editor.isActive('strike')}
            isSelected={isSelected('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            unpressedLabel="Apply Strikethrough"
            pressedLabel="Remove Strikethrough"
          >
            <StrikeIcon className="h-6 w-6" />
          </ChatInputMenuButton>
          <ChatInputMenuButton
            isActive={editor.isActive('link')}
            isSelected={isSelected('link')}
            onClick={openLinkEditor}
            unpressedLabel="Add Link"
            pressedLabel="Remove Link"
          >
            <span className="sr-only">Convert to Link</span>
            <LinkIcon className="h-5 w-5" />
          </ChatInputMenuButton>
          <ChatInputMenuButton
            isActive={editor.isActive('blockquote')}
            isSelected={isSelected('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            unpressedLabel="Apply Blockquote"
            pressedLabel="Remove Blockquote"
          >
            <BlockquoteIcon className="h-6 w-6" />
          </ChatInputMenuButton>
          <ChatInputMenuButton
            isActive={editor.isActive('code')}
            isSelected={isSelected('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
            unpressedLabel="Apply Code"
            pressedLabel="Remove Code"
          >
            <CodeIcon className="h-6 w-6" />
          </ChatInputMenuButton>
          <ChatInputMenuButton
              textButton
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              unpressedLabel="Remove All Formatting"
              pressedLabel="Remove All Formatting"
              >
                Clear
          </ChatInputMenuButton>
        </div>
      )}
    </div>
  );
}

export default function ChatInputMenu({ editor }: ChatInputMenuProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(-1);
  const [selectionPos, setSelectionPos] = useState<DOMRect>();
  const [status, setStatus] = useState<MenuState>('closed');

  const isMobile = useIsMobile();

  const onSelection = useCallback(
    ({ editor: currentEditor }: { editor: CoreEditor }) => {
      setSelected(-1);
      const { view } = currentEditor;
      const { doc, selection } = currentEditor.state;
      const { empty, ranges } = selection;

      // Sometime check for `empty` is not enough.
      // Doubleclick an empty paragraph returns a node size of 2.
      // So we check also for an empty text size.
      const from = Math.min(...ranges.map((range) => range.$from.pos));
      const to = Math.max(...ranges.map((range) => range.$to.pos));
      const isEmptyTextBlock =
        !doc.textBetween(from, to).length && isTextSelection(selection);

      if (!view.hasFocus() || empty || isEmptyTextBlock) {
        setStatus('closed');
        return;
      }

      if (isNodeSelection(selection)) {
        const node = view.nodeDOM(from) as HTMLElement;

        if (node) {
          setSelectionPos(node.getBoundingClientRect());
        }
      } else {
        setSelectionPos(posToDOMRect(view, from, to));
      }

      setStatus('open');
    },
    []
  );

  useEffect(() => {
    editor.on('selectionUpdate', onSelection);

    return () => {
      editor.off('selectionUpdate', onSelection);
    };
  }, [editor, onSelection]);

  const isSelected = useCallback(
    (key: string) => {
      if (selected === -1) {
        return false;
      }

      return options[selected] === key;
    },
    [selected]
  );

  const openLinkEditor = useCallback(() => {
    setStatus('editing-link');
  }, []);

  const setLink = useCallback(
    ({ url }: LinkEditorForm) => {
      if (url === '') {
        editor.chain().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().extendMarkRange('link').setLink({ href: url }).run();
      }

      setStatus('open');
    },
    [editor]
  );

  const onNavigation = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        if (status === 'open') {
          setStatus('closed');
          setSelected(-1);
          editor
            .chain()
            .setTextSelection(editor.state.selection.from)
            .focus()
            .run();
        } else {
          setStatus('open');
          toolbarRef.current?.focus();
        }
      }

      const total = options.length;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        setSelected((total + selected + 1) % total);
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        setSelected((total + selected - 1) % total);
      }
    },
    [selected, status, editor]
  );
  if (isMobile) {
    return (
      <ChatInputMenuToolbar
        editor={editor}
        toolbarRef={toolbarRef}
        status={status}
        setStatus={setStatus}
        setLink={setLink}
        onNavigation={onNavigation}
        isSelected={isSelected}
        openLinkEditor={openLinkEditor}
      />
    );
  }
  return (
    <Popover.Root open={status !== 'closed'}>
      <Popover.Anchor
        className="pointer-events-none fixed"
        style={{
          width: selectionPos?.width,
          height: selectionPos?.height,
          top: selectionPos?.top,
          left: selectionPos?.left,
        }}
      />
      <Popover.Content
        side="top"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerDownOutside={() => setStatus('closed')}
      >
        <ChatInputMenuToolbar
          editor={editor}
          toolbarRef={toolbarRef}
          status={status}
          setStatus={setStatus}
          setLink={setLink}
          onNavigation={onNavigation}
          isSelected={isSelected}
          openLinkEditor={openLinkEditor}
        />
      </Popover.Content>
    </Popover.Root>
  );
}
