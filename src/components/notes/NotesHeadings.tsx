"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NoteButton } from './NoteButton';
import { SectionRevision } from '../revisions/SectionRevision';

interface Target {
  id: string;
  title: string;
  label: string;
  el: HTMLElement;
}

function ensureMount(h: HTMLHeadingElement, gap: string): HTMLElement {
  let mount = h.querySelector<HTMLElement>(':scope > span.note-btn-mount');
  if (!mount) {
    h.setAttribute('data-note-title', (h.textContent || '').trim());
    h.classList.add('flex', 'flex-wrap', 'items-center', gap);
    mount = document.createElement('span');
    mount.className = 'note-btn-mount ml-auto inline-flex';
    h.appendChild(mount);
  }
  return mount;
}

/**
 * Enhances the Learn-tab MDX after render:
 *  - the main `<h1>`  -> a "General notes" button (topic `general`)
 *  - each `<h2 id="module-K">` -> a "Notes" button for that section
 *
 * next-mdx-remote renders these literal-HTML headings without going through the
 * `components` map, so we inject the buttons on the client via portals (React
 * context still flows through a portal, keeping the buttons reactive).
 */
export function NotesHeadings({ containerId }: { containerId: string }) {
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;

    const out: Target[] = [];

    const h1 = root.querySelector<HTMLHeadingElement>('h1');
    if (h1) {
      out.push({
        id: 'general',
        title: 'General notes',
        label: 'General notes',
        el: ensureMount(h1, 'gap-3'),
      });
    }

    const heads = Array.from(
      root.querySelectorAll<HTMLHeadingElement>('h2[id^="module-"]'),
    );
    for (const h of heads) {
      out.push({
        id: h.id,
        title: h.getAttribute('data-note-title') || (h.textContent || '').trim(),
        label: 'Notes',
        el: ensureMount(h, 'gap-2'),
      });
    }

    // Syncing React to an external system (the post-MDX DOM we portal into):
    // we must read the rendered headings, then set the mount targets once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargets(out);
  }, [containerId]);

  return (
    <>
      {targets.map((t) =>
        createPortal(
          t.id.startsWith('module-') ? (
            <span className="not-prose inline-flex items-center gap-2">
              <SectionRevision topicId={t.id} />
              <NoteButton id={t.id} title={t.title} label={t.label} />
            </span>
          ) : (
            <NoteButton id={t.id} title={t.title} label={t.label} />
          ),
          t.el,
          t.id,
        ),
      )}
    </>
  );
}
