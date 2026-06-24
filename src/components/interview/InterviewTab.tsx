"use client";

import React, { useState } from 'react';
import { Check, Lightbulb, Code2 } from 'lucide-react';
import type { Problem, Difficulty } from '@/lib/problems';
import { ProblemWorkspace } from './ProblemWorkspace';

export interface ProblemState {
  code?: string;
  solved?: boolean;
}

/** Renders inline `code` spans inside otherwise-plain prose. */
function renderInline(text: string): React.ReactNode {
  return text.split('`').map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="rounded bg-neutral-100 px-1 py-0.5 text-[0.85em] text-emerald-700 dark:bg-neutral-800 dark:text-emerald-400"
      >
        {part}
      </code>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

const DIFF_COLORS: Record<Difficulty, string> = {
  Easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  Medium: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  Hard: 'text-red-600 dark:text-red-400 bg-red-500/10',
};
const DIFF_DOT: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  Hard: 'bg-red-500',
};

function ProblemList({
  problems,
  selectedId,
  solved,
  onSelect,
}: {
  problems: Problem[];
  selectedId: string;
  solved: Record<string, boolean>;
  onSelect: (id: string) => void;
}) {
  const solvedCount = problems.filter((p) => solved[p.id]).length;
  return (
    <div className="shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:w-60">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-900 dark:border-neutral-800 dark:text-white">
        <span>Problems</span>
        <span className="text-xs font-medium text-neutral-400">{solvedCount}/{problems.length} solved</span>
      </div>
      <ul className="max-h-[640px] overflow-y-auto">
        {problems.map((p, i) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p.id)}
              className={`flex w-full items-center gap-2.5 border-l-2 px-4 py-2.5 text-left transition-colors ${
                selectedId === p.id
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {solved[p.id] ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <span className="text-xs text-neutral-400">{i + 1}</span>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-700 dark:text-neutral-300">
                {p.title}
              </span>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DIFF_DOT[p.difficulty]}`} title={p.difficulty} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProblemDescription({ problem, className }: { problem: Problem; className?: string }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div
      className={`overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 ${className ?? ''}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{problem.title}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFF_COLORS[problem.difficulty]}`}>
          {problem.difficulty}
        </span>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {problem.tags.map((t) => (
          <span
            key={t}
            className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          >
            {t}
          </span>
        ))}
      </div>

      <p className="mb-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {renderInline(problem.prompt)}
      </p>

      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Examples</h4>
      <div className="mb-6 space-y-3">
        {problem.examples.map((ex, i) => (
          <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-800/40">
            <div className="font-mono text-xs">
              <span className="text-neutral-400">Input: </span>
              <span className="text-neutral-800 dark:text-neutral-200">{ex.input}</span>
            </div>
            <div className="font-mono text-xs">
              <span className="text-neutral-400">Output: </span>
              <span className="text-neutral-800 dark:text-neutral-200">{ex.output}</span>
            </div>
            {ex.explanation && (
              <div className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{renderInline(ex.explanation)}</div>
            )}
          </div>
        ))}
      </div>

      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <Lightbulb className="h-3.5 w-3.5" /> Hints
      </h4>
      <div className="space-y-2">
        {problem.hints.slice(0, hintsShown).map((h, i) => (
          <div
            key={i}
            className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300"
          >
            <span className="font-semibold text-amber-600 dark:text-amber-400">{i + 1}.</span> {renderInline(h)}
          </div>
        ))}
        {hintsShown < problem.hints.length && (
          <button
            onClick={() => setHintsShown((n) => n + 1)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            {hintsShown === 0 ? 'Show a hint' : `Show hint ${hintsShown + 1}`}
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <button
          onClick={() => setShowSolution((s) => !s)}
          className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          <Code2 className="h-4 w-4" />
          {showSolution ? 'Hide solution' : 'Show solution'}
        </button>
        {showSolution && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-black/40">
            <code>{problem.solution}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

export function InterviewTab({
  problems,
  moduleId,
  initial,
}: {
  problems: Problem[];
  moduleId: string;
  initial: Record<string, ProblemState>;
}) {
  const [selectedId, setSelectedId] = useState(problems[0]?.id ?? '');
  const [solved, setSolved] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const [pid, v] of Object.entries(initial)) if (v?.solved) m[pid] = true;
    return m;
  });

  const selected = problems.find((p) => p.id === selectedId) ?? problems[0];
  if (!selected) return null;

  return (
    <div className="flex min-h-[700px] flex-col gap-4 lg:flex-row">
      <ProblemList problems={problems} selectedId={selected.id} solved={solved} onSelect={setSelectedId} />
      <div className="flex min-w-0 flex-1 flex-col gap-4 xl:flex-row">
        <ProblemDescription key={`desc-${selected.id}`} problem={selected} className="xl:max-h-[760px] xl:w-[42%]" />
        <ProblemWorkspace
          key={`work-${selected.id}`}
          problem={selected}
          moduleId={moduleId}
          initialCode={initial[selected.id]?.code}
          initialSolved={solved[selected.id]}
          onSolved={(id) => setSolved((s) => ({ ...s, [id]: true }))}
          className="flex-1"
        />
      </div>
    </div>
  );
}
