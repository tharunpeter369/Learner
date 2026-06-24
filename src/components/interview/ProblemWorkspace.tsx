"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Play, FlaskConical, Loader2, Save, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { runCodeInBrowser } from '@/lib/codeRunner';
import type { Problem } from '@/lib/problems';
import type { User } from '@supabase/supabase-js';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
      Loading editor…
    </div>
  ),
});

const SENTINEL = '__ALL_TESTS_PASSED__';

const ASSERT_PREAMBLE = `
function assert(cond, msg){ if(!cond) throw new Error('Assertion failed: ' + (msg || '')); console.log('  ✓ ' + (msg || 'passed')); }
function assertEqual(actual, expected, msg){
  var a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error((msg || 'values') + ' — expected ' + b + ', got ' + a);
  console.log('  ✓ ' + (msg || 'equal'));
}
`;

type TestState = 'idle' | 'running' | 'pass' | 'fail';

export function ProblemWorkspace({
  problem,
  moduleId,
  initialCode,
  initialSolved,
  onSolved,
  className,
}: {
  problem: Problem;
  moduleId: string;
  initialCode?: string;
  initialSolved?: boolean;
  onSolved?: (problemId: string) => void;
  className?: string;
}) {
  const { theme } = useTheme();
  const [supabase] = useState(() => createClient());
  const language = problem.language ?? 'javascript';
  const [code, setCode] = useState(initialCode || problem.starterCode);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [testState, setTestState] = useState<TestState>('idle');
  const [solved, setSolved] = useState(!!initialSolved);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [user, setUser] = useState<User | null>(null);

  const runnerRef = useRef<{ cancel: () => void } | null>(null);
  const firstRender = useRef(true);
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => () => runnerRef.current?.cancel(), []);

  // Track auth so we only show "Saved" when something actually persists.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [supabase]);

  const saveToDb = useCallback(
    async (codeVal: string, solvedVal: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('saved_code')
        .select('id')
        .eq('uid', user.id)
        .eq('module_id', moduleId)
        .eq('problem_id', problem.id)
        .maybeSingle();

      let rowId = existing?.id as string | undefined;
      const base = { code: codeVal, language };
      if (rowId) {
        await supabase.from('saved_code').update(base).eq('id', rowId);
      } else {
        const { data: inserted } = await supabase
          .from('saved_code')
          .insert({ uid: user.id, module_id: moduleId, problem_id: problem.id, ...base })
          .select('id')
          .maybeSingle();
        rowId = inserted?.id as string | undefined;
      }
      // Persist solved separately so a missing `solved` column never blocks code-save.
      if (rowId && solvedVal) {
        await supabase.from('saved_code').update({ solved: true }).eq('id', rowId);
      }
    },
    [supabase, moduleId, problem.id],
  );

  // Debounced autosave of the editor contents — only when signed in, since
  // nothing persists otherwise (so we never show a misleading "Saved").
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!userRef.current) return;
    setSaveState('saving');
    const t = setTimeout(async () => {
      await saveToDb(code, solved);
      setSaveState('saved');
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const runCode = () => {
    runnerRef.current?.cancel();
    setTestState('idle');
    setOutput('');
    setRunning(true);
    let produced = false;
    runnerRef.current = runCodeInBrowser({
      code,
      language,
      onOutput: (text) => {
        produced = true;
        setOutput((prev) => prev + text + '\n');
      },
      onError: (msg) => {
        produced = true;
        setOutput((prev) => prev + msg + '\n');
      },
      onDone: (info) => {
        setRunning(false);
        if (info?.timedOut) setOutput((prev) => prev + '\n⏱ Stopped after 5s — check for an infinite loop.');
        else if (!produced) setOutput('Ran with no console output.');
      },
    });
  };

  const runTests = () => {
    runnerRef.current?.cancel();
    setTestState('running');
    setOutput('');
    setRunning(true);
    const lines: string[] = [];
    let passed = false;
    const combined =
      code +
      '\n;\n' +
      ASSERT_PREAMBLE +
      '\n(async () => {\n' +
      problem.tests +
      '\n  console.log("' +
      SENTINEL +
      '");\n})().catch((e) => console.error(e && e.message ? e.message : String(e)));';

    runnerRef.current = runCodeInBrowser({
      code: combined,
      language,
      onOutput: (text) => {
        if (text.includes(SENTINEL)) {
          passed = true;
          return; // hide the sentinel from the console
        }
        lines.push(text);
        setOutput(lines.join('\n'));
      },
      onError: (msg) => {
        lines.push(msg);
        setOutput(lines.join('\n'));
      },
      onDone: () => {
        setRunning(false);
        if (passed) {
          setTestState('pass');
          if (!solved) {
            setSolved(true);
            onSolved?.(problem.id);
          }
          void saveToDb(code, true);
        } else {
          setTestState('fail');
        }
      },
    });
  };

  return (
    <div className={`flex min-h-[460px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#1e1e1e] ${className ?? ''}`}>
      {/* toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <span className="flex items-center gap-1.5 text-xs text-neutral-400">
          {saveState === 'saving' && (<><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>)}
          {saveState === 'saved' && (<><Check className="h-3 w-3 text-emerald-500" /> Saved</>)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={runCode}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run
          </button>
          <button
            onClick={runTests}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
          >
            {running && testState === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            Run Tests
          </button>
        </div>
      </div>

      {/* editor */}
      <div className="min-h-[280px] flex-1">
        <MonacoEditor
          height="100%"
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Menlo, monospace',
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />
      </div>

      {/* result banner */}
      {testState === 'pass' && (
        <div className="flex items-center gap-2 border-t border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4" /> Accepted — all tests passed
        </div>
      )}
      {testState === 'fail' && (
        <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400">
          ✕ Some tests failed — see the output below
        </div>
      )}

      {/* console */}
      <div className="h-40 shrink-0 overflow-y-auto border-t border-neutral-200 bg-neutral-50 p-3 font-mono text-xs whitespace-pre-wrap text-neutral-800 dark:border-neutral-800 dark:bg-[#181818] dark:text-neutral-300">
        {output || (
          <span className="italic text-neutral-400 dark:text-neutral-600">
            Console output appears here. Click <span className="font-semibold">Run</span> to execute, or{' '}
            <span className="font-semibold">Run Tests</span> to grade your solution.
          </span>
        )}
      </div>
    </div>
  );
}
