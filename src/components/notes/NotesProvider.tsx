"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

type NotesMap = Record<string, string>;

interface ActiveTopic {
  id: string;
  title: string;
}

interface NotesContextValue {
  moduleId: string;
  user: User | null;
  activeTopic: ActiveTopic | null;
  hasNote: (topicId: string) => boolean;
  getNote: (topicId: string) => string;
  open: (topicId: string, title: string) => void;
  close: () => void;
  saveNote: (topicId: string, content: string) => Promise<void>;
  signIn: () => Promise<void>;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used inside <NotesProvider>');
  return ctx;
}

/** True when the stored HTML has no visible text (so we don't flag empty notes). */
const isEmptyHtml = (html: string): boolean =>
  html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length === 0;

export function NotesProvider({
  moduleId,
  initialNotes = {},
  children,
}: {
  moduleId: string;
  initialNotes?: NotesMap;
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<NotesMap>(initialNotes);
  const [activeTopic, setActiveTopic] = useState<ActiveTopic | null>(null);

  // Load this module's notes once (and keep the signed-in user in sync).
  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUser(current);
      if (!current) return;

      const { data } = await supabase
        .from('notes')
        .select('topic_id, content')
        .eq('uid', current.id)
        .eq('module_id', moduleId);

      if (!active || !data) return;
      const map: NotesMap = {};
      for (const row of data) {
        map[row.topic_id as string] = (row.content as string | null) ?? '';
      }
      setNotes(map);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [moduleId, supabase]);

  const hasNote = useCallback(
    (topicId: string) => {
      const content = notes[topicId];
      return typeof content === 'string' && !isEmptyHtml(content);
    },
    [notes],
  );

  const getNote = useCallback((topicId: string) => notes[topicId] ?? '', [notes]);

  const open = useCallback((topicId: string, title: string) => {
    setActiveTopic({ id: topicId, title });
  }, []);

  const close = useCallback(() => setActiveTopic(null), []);

  const signIn = useCallback(async () => {
    // Return the user to the page they're on after the GitHub round-trip.
    const next = window.location.pathname + window.location.search;
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }, [supabase]);

  const saveNote = useCallback(
    async (topicId: string, content: string) => {
      // Optimistic local update so the "has note" dot reacts instantly.
      setNotes((prev) => ({ ...prev, [topicId]: content }));
      if (!user) return;

      const { data: existing } = await supabase
        .from('notes')
        .select('id')
        .eq('uid', user.id)
        .eq('module_id', moduleId)
        .eq('topic_id', topicId)
        .maybeSingle();

      if (existing) {
        await supabase.from('notes').update({ content }).eq('id', existing.id);
      } else {
        await supabase
          .from('notes')
          .insert({ uid: user.id, module_id: moduleId, topic_id: topicId, content });
      }
    },
    [user, moduleId, supabase],
  );

  return (
    <NotesContext.Provider
      value={{ moduleId, user, activeTopic, hasNote, getNote, open, close, saveNote, signIn }}
    >
      {children}
    </NotesContext.Provider>
  );
}
