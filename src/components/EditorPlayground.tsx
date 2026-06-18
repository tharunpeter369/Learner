"use client";

import React, { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Play, Loader2, Save } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function EditorPlayground({ defaultLanguage = 'javascript', moduleId }: { defaultLanguage?: string, moduleId: string }) {
  const [code, setCode] = useState('// Write your solution here\nconsole.log("Hello Architect!");\n');
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

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: defaultLanguage === 'javascript' ? 'js' : defaultLanguage,
          version: '*', // Auto-resolves latest version in Piston API
          files: [{ content: code }]
        })
      });
      const data = await response.json();
      
      if (data.run && data.run.output) {
        setOutput(data.run.output);
      } else if (data.message) {
        setOutput(`Error: ${data.message}`);
      } else {
        setOutput('Code executed, but no output was returned.');
      }
    } catch (err) {
      setOutput(`Failed to execute code.\n${err}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      <div className="flex items-center justify-between p-3 bg-neutral-900 border-b border-neutral-800">
        <div className="text-sm font-medium text-neutral-400">Piston Execution Sandbox</div>
        <div className="flex gap-2">
          <button 
            onClick={saveCode}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          <button 
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Code
          </button>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800 min-h-0">
        <div className="h-full pt-4">
          <MonacoEditor
            height="100%"
            language={defaultLanguage}
            theme="vs-dark"
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
        
        <div className="h-full bg-neutral-950 p-4 font-mono text-sm overflow-auto">
          <div className="text-neutral-500 mb-2">Output:</div>
          <pre className="whitespace-pre-wrap text-emerald-400">
            {output || 'Run your code to see output here...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
