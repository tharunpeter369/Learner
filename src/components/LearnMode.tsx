"use client";

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LearnMode({
  children,
}: {
  moduleId: string;
  children: React.ReactNode;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (timeLeft === null || timeLeft === 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => (prev ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-12">
      {/* Concept Scaffold */}
      <section className="space-y-4">{children}</section>

      {/* Architect Framing Drill */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          Architect Framing Drill
        </h2>
        <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <p className="text-neutral-600 dark:text-neutral-300 font-medium mb-6 text-lg">
            &quot;Explain out loud: What is the primary trade-off being made in this module&apos;s architecture, and under what conditions does it break?&quot;
          </p>

          {timeLeft === null && !showAnswer && (
            <button
              onClick={() => setTimeLeft(180)}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Start 3-Minute Drill
            </button>
          )}

          {timeLeft !== null && timeLeft > 0 && !showAnswer && (
            <div className="flex items-center gap-6">
              <div className="text-4xl font-mono text-emerald-600 dark:text-emerald-400">{formatTime(timeLeft)}</div>
              <button
                onClick={() => { setTimeLeft(0); setShowAnswer(true); }}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg transition-colors text-sm"
              >
                Done Speaking
              </button>
            </div>
          )}

          {(timeLeft === 0 || showAnswer) && (
            <div className="mt-6 p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-lg">
              <h4 className="font-medium text-emerald-700 dark:text-emerald-400 mb-2">Model Answer Focus Areas:</h4>
              <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                <li>Did you mention scalability limits?</li>
                <li>Did you identify the single point of failure?</li>
                <li>Did you end with &quot;...and the trade-off is...&quot;?</li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
