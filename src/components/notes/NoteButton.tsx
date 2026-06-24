"use client";

import React from 'react';
import { NotebookPen } from 'lucide-react';
import { useNotes } from './NotesProvider';

/**
 * The Notes button shown next to a heading. `id` is the note's topic
 * (`general` for the whole-module note, or `module-K` for a section).
 */
export function NoteButton({
  id,
  title,
  label = 'Notes',
}: {
  id: string;
  title: string;
  label?: string;
}) {
  const { open, hasNote } = useNotes();
  const noteExists = hasNote(id);

  return (
    <button
      type="button"
      onClick={() => open(id, title)}
      aria-label={`${label}${title ? ` for ${title}` : ''}`}
      title={label}
      className="not-prose relative inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all
        border-neutral-200 text-neutral-500 hover:border-emerald-500 hover:text-emerald-600
        dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-emerald-400"
    >
      <NotebookPen className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {noteExists && (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900"
        />
      )}
    </button>
  );
}
