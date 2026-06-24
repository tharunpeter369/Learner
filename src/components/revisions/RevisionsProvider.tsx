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

interface RevRow {
  count: number;
  last_changed_at: string | null;
  last_incremented_at: string | null;
}
type RevMap = Record<string, RevRow>;

/** Increment is allowed at most once per this window; decrement only undoes an
 * increment still inside it. Mirrors the server-side rule in `bump_revision`. */
export const REVISION_WINDOW_MS = 4 * 60 * 60 * 1000;

interface RevisionsContextValue {
  user: User | null;
  getCount: (topicId: string) => number;
  getLastChanged: (topicId: string) => string | null;
  getLastIncremented: (topicId: string) => string | null;
  bump: (topicId: string, delta: number) => Promise<void>;
  signIn: () => Promise<void>;
}

const RevisionsContext = createContext<RevisionsContextValue | null>(null);

export function useRevisions(): RevisionsContextValue {
  const ctx = useContext(RevisionsContext);
  if (!ctx) throw new Error('useRevisions must be used inside <RevisionsProvider>');
  return ctx;
}

/**
 * Loads every section's revision count for one module in a single query and
 * exposes per-section read/bump helpers. Mirrors NotesProvider so the counters
 * injected next to each heading stay reactive through their portals.
 */
export function RevisionsProvider({
  moduleId,
  children,
}: {
  moduleId: string;
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [revs, setRevs] = useState<RevMap>({});

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
        .from('revisions')
        .select('topic_id, count, last_changed_at, last_incremented_at')
        .eq('uid', current.id)
        .eq('module_id', moduleId);

      if (!active || !data) return;
      const map: RevMap = {};
      for (const row of data) {
        map[row.topic_id as string] = {
          count: (row.count as number) ?? 0,
          last_changed_at: (row.last_changed_at as string | null) ?? null,
          last_incremented_at: (row.last_incremented_at as string | null) ?? null,
        };
      }
      setRevs(map);
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

  const getCount = useCallback((topicId: string) => revs[topicId]?.count ?? 0, [revs]);
  const getLastChanged = useCallback(
    (topicId: string) => revs[topicId]?.last_changed_at ?? null,
    [revs],
  );
  const getLastIncremented = useCallback(
    (topicId: string) => revs[topicId]?.last_incremented_at ?? null,
    [revs],
  );

  const signIn = useCallback(async () => {
    const next = window.location.pathname + window.location.search;
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }, [supabase]);

  const bump = useCallback(
    async (topicId: string, delta: number) => {
      if (!user) return;
      const cur = revs[topicId] ?? { count: 0, last_changed_at: null, last_incremented_at: null };
      const nowMs = Date.now();
      const incAt = cur.last_incremented_at ? new Date(cur.last_incremented_at).getTime() : null;

      // Client-side guard mirroring the server's 4-hour window rule.
      if (delta > 0) {
        if (incAt !== null && nowMs - incAt < REVISION_WINDOW_MS) return; // cooldown
      } else {
        if (incAt === null || nowMs - incAt >= REVISION_WINDOW_MS || cur.count === 0) return;
      }

      // Optimistic local update (server is authoritative and will correct it).
      const nowIso = new Date(nowMs).toISOString();
      const optimistic: RevRow =
        delta > 0
          ? { count: cur.count + 1, last_changed_at: nowIso, last_incremented_at: nowIso }
          : { count: Math.max(0, cur.count - 1), last_changed_at: nowIso, last_incremented_at: null };
      setRevs((prev) => ({ ...prev, [topicId]: optimistic }));

      const { data, error } = await supabase.rpc('bump_revision', {
        p_module_id: moduleId,
        p_topic_id: topicId,
        p_delta: delta,
      });
      if (!error && data) {
        const d = data as {
          count: number;
          last_changed_at: string | null;
          last_incremented_at: string | null;
        };
        setRevs((prev) => ({
          ...prev,
          [topicId]: {
            count: d.count,
            last_changed_at: d.last_changed_at ?? null,
            last_incremented_at: d.last_incremented_at ?? null,
          },
        }));
      }
    },
    [user, revs, moduleId, supabase],
  );

  return (
    <RevisionsContext.Provider
      value={{ user, getCount, getLastChanged, getLastIncremented, bump, signIn }}
    >
      {children}
    </RevisionsContext.Provider>
  );
}
