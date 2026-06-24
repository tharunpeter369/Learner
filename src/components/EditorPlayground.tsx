"use client";

import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Play, Loader2, Save } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { runCodeInBrowser } from '@/lib/codeRunner';

export default function EditorPlayground({ defaultLanguage = 'javascript', moduleId, theme = 'dark' }: { defaultLanguage?: string, moduleId: string, theme?: string }) {
  const [code, setCode] = useState('// Write your code here...\nconsole.log("Hello Architect!");\n');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const supabase = createClient();

  // Load saved code on mount
  useEffect(() => {
    async function loadCode() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('saved_code')
        .select('code')
        .eq('uid', user.id)
        .eq('module_id', moduleId)
        .eq('problem_id', 'default')
        .single();
        
      if (data && data.code) {
         setCode(data.code);
      }
    }
    loadCode();
  }, [moduleId, supabase]);

  const saveCode = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in to save code.");
        return;
      }
      
      const { data: existing } = await supabase
        .from('saved_code')
        .select('id')
        .eq('uid', user.id)
        .eq('module_id', moduleId)
        .eq('problem_id', 'default')
        .single();

      if (existing) {
        await supabase.from('saved_code').update({ code }).eq('id', existing.id);
      } else {
        await supabase.from('saved_code').insert({ 
          uid: user.id, 
          module_id: moduleId, 
          problem_id: 'default', 
          code, 
          language: defaultLanguage 
        });
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const runnerRef = useRef<{ cancel: () => void } | null>(null);

  // Cancel any running sandbox if the editor unmounts (e.g. tab switch).
  useEffect(() => () => runnerRef.current?.cancel(), []);

  const runCode = () => {
    runnerRef.current?.cancel();
    setOutput('');
    setIsRunning(true);
    let produced = false;

    runnerRef.current = runCodeInBrowser({
      code,
      language: defaultLanguage,
      onOutput: (text) => {
        produced = true;
        setOutput((prev) => prev + text + '\n');
      },
      onError: (msg) => {
        produced = true;
        setOutput((prev) => prev + msg + '\n');
      },
      onDone: (info) => {
        setIsRunning(false);
        if (info?.timedOut) {
          setOutput((prev) => prev + '\n⏱ Stopped after 5s — check for an infinite loop.');
        } else if (!produced) {
          setOutput('Code ran with no console output.');
        }
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-[#1e1e1e] border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">practice.js</span>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={saveCode}
             disabled={isSaving}
             className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-300 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Save
           </button>
           <button
             onClick={runCode}
             disabled={isRunning}
             className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
           >
             {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
             {isRunning ? 'Running' : 'Run'}
           </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div className="flex-1 border-r border-neutral-200 dark:border-neutral-800 min-h-[400px]">
          <MonacoEditor
            height="100%"
            language={defaultLanguage}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              padding: { top: 16 }
            }}
          />
        </div>
        {/* Output Panel */}
        <div className="w-full lg:w-1/3 bg-neutral-50 dark:bg-[#1e1e1e] border-t lg:border-t-0 border-neutral-200 dark:border-neutral-800 flex flex-col">
          <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-100 dark:bg-[#1e1e1e]">
            Console Output
          </div>
          <div className="p-4 flex-1 overflow-y-auto font-mono text-sm text-neutral-800 dark:text-neutral-300 whitespace-pre-wrap">
            {output || <span className="text-neutral-500 dark:text-neutral-600 italic">No output yet. Click 'Run' to execute your code.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
