"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  X,
  Check,
  Loader2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading2,
  Quote,
  NotebookPen,
} from 'lucide-react';

function GithubMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}
import { useNotes } from './NotesProvider';

type SaveStatus = 'idle' | 'saving' | 'saved';

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // Keep editor selection while clicking a toolbar button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
      }`}
    >
      {children}
    </button>
  );
}

export function NotesDrawer() {
  const { activeTopic, close, getNote, saveNote, user, signIn } = useNotes();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const isOpen = activeTopic !== null;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs so the editor's onUpdate (created once) always sees the latest values.
  const topicRef = useRef(activeTopic);
  const userRef = useRef(user);
  const saveRef = useRef(saveNote);
  useEffect(() => {
    topicRef.current = activeTopic;
  }, [activeTopic]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    saveRef.current = saveNote;
  }, [saveNote]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write your notes for this section…' }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-sm prose-neutral dark:prose-invert max-w-none min-h-[55vh] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const topic = topicRef.current;
      if (!topic || !userRef.current) return;
      setStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await saveRef.current(topic.id, editor.getHTML());
        setStatus('saved');
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setStatus('idle'), 1500);
      }, 800);
    },
  });

  // Load the section's saved note when the drawer opens / switches sections.
  useEffect(() => {
    if (!editor || !activeTopic) return;
    editor.commands.setContent(getNote(activeTopic.id) || '', { emitUpdate: false });
    setStatus('idle');
    const t = setTimeout(() => editor.commands.focus('end'), 60);
    return () => clearTimeout(t);
    // getNote is stable per notes snapshot; intentionally keyed on the topic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic, editor]);

  const handleClose = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (editor && activeTopic && user) {
      await saveNote(activeTopic.id, editor.getHTML());
    }
    close();
  }, [editor, activeTopic, user, saveNote, close]);

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void handleClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, handleClose]);

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Section notes"
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-neutral-900 sm:w-[460px] sm:border-l sm:border-neutral-200 dark:sm:border-neutral-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Notes
            </p>
            <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-white">
              {activeTopic?.title || 'Section'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              {status === 'saving' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </>
              )}
              {status === 'saved' && (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Saved
                </>
              )}
            </span>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close notes"
              className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {user && editor ? (
          <>
            <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
              <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code className="h-4 w-4" />
              </ToolbarButton>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <EditorContent editor={editor} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <NotebookPen className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                Sign in to take notes
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Your notes save to your account and sync across devices.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void signIn()}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <GithubMark /> Sign in with GitHub
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
