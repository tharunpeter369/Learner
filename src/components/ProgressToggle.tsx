"use client"
import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'
import { CheckCircle, Circle } from 'lucide-react'

export default function ProgressToggle({ moduleId }: { moduleId: string }) {
  const supabase = createClient()
  const [status, setStatus] = useState<'unstarted' | 'in_progress' | 'done'>('unstarted')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('progress')
        .select('status')
        .eq('uid', user.id)
        .eq('module_id', moduleId)
        .single()

      if (data) {
        setStatus(data.status as any)
      }
      setLoading(false)
    }
    loadProgress()
  }, [moduleId, supabase])

  const toggleStatus = async () => {
    if (!user) {
      alert("Please sign in to track progress.")
      return
    }
    
    const newStatus = status === 'done' ? 'unstarted' : 'done'
    setStatus(newStatus) // optimistic update

    const { data: existing } = await supabase
        .from('progress')
        .select('id')
        .eq('uid', user.id)
        .eq('module_id', moduleId)
        .single()
        
    if (existing) {
       await supabase.from('progress').update({ status: newStatus }).eq('id', existing.id)
    } else {
       await supabase.from('progress').insert({ uid: user.id, module_id: moduleId, status: newStatus })
    }
  }

  if (loading) return <div className="w-32 h-9 bg-neutral-900 animate-pulse rounded-lg"></div>

  return (
    <button
      onClick={toggleStatus}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        status === 'done' 
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
          : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {status === 'done' ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
      {status === 'done' ? 'Completed' : 'Mark Complete'}
    </button>
  )
}
