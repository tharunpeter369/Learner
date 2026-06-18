"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Save, Loader2, Clock } from 'lucide-react';

export default function LearnMode({ moduleId }: { moduleId: string }) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadNotes() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('notes')
        .select('content')
        .eq('uid', user.id)
        .eq('module_id', moduleId)
        .eq('topic_id', 'general')
        .single();
        
      if (data && data.content) {
         setNotes(data.content);
      }
    }
    loadNotes();
  }, [moduleId, supabase]);

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in to save notes.");
        return;
      }
      
      const { data: existing } = await supabase
        .from('notes')
        .select('id')
        .eq('uid', user.id)
        .eq('module_id', moduleId)
        .eq('topic_id', 'general')
        .single();

      if (existing) {
        await supabase.from('notes').update({ content: notes }).eq('id', existing.id);
      } else {
        await supabase.from('notes').insert({ 
          uid: user.id, 
          module_id: moduleId, 
          topic_id: 'general', 
          content: notes
        });
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (timeLeft === null || timeLeft === 0) return;
    const timer = setInterval(() => setTimeLeft(prev => (prev ? prev - 1 : 0)), 1000);
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
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Concept Overview</h2>
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400">
          <p className="mb-4">This section will contain the detailed concept explanations, real-world examples, and interview Q&A for this module.</p>
          <p className="text-sm border-l-2 border-emerald-500 pl-4 py-1 italic">
             "Write the 'architect framing' and 'trade-off' sections yourself... link to authoritative sources for the basics."
          </p>
        </div>
      </section>

      {/* Architect Framing Drill */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Architect Framing Drill
        </h2>
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <p className="text-neutral-300 font-medium mb-6 text-lg">
            "Explain out loud: What is the primary trade-off being made in this module's architecture, and under what conditions does it break?"
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
               <div className="text-4xl font-mono text-emerald-400">{formatTime(timeLeft)}</div>
               <button 
                 onClick={() => { setTimeLeft(0); setShowAnswer(true); }}
                 className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm"
               >
                 Done Speaking
               </button>
            </div>
          )}

          {(timeLeft === 0 || showAnswer) && (
            <div className="mt-6 p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-lg">
               <h4 className="font-medium text-emerald-400 mb-2">Model Answer Focus Areas:</h4>
               <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1">
                 <li>Did you mention scalability limits?</li>
                 <li>Did you identify the single point of failure?</li>
                 <li>Did you end with "...and the trade-off is..."?</li>
               </ul>
            </div>
          )}
        </div>
      </section>

      {/* Personal Notes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Personal Notes</h2>
          <button 
            onClick={saveNotes}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Notes
          </button>
        </div>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down your thoughts, resources, or &quot;aha!&quot; moments here..."
          className="w-full h-64 p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans resize-y"
        />
      </section>
    </div>
  );
}
