import Link from 'next/link';
import { getSyllabus, paths } from '@/data/paths';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { CheckCircle } from 'lucide-react';
import { Topbar } from '@/components/Topbar';

export default async function PathPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  const syllabus = getSyllabus(pathId);
  const pathMeta = paths.find(p => p.id === pathId);

  if (!syllabus || !pathMeta) {
    notFound();
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let progressMap: Record<string, string> = {}
  if (user) {
     const { data } = await supabase.from('progress').select('module_id, status').eq('uid', user.id)
     if (data) {
       data.forEach(p => progressMap[p.module_id] = p.status)
     }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
      <Topbar isSticky={true} backLink="/" backLabel="All Paths" />

      {/* Header */}
      <header className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 text-sm font-medium tracking-wider text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 rounded-full">
            {pathMeta.title}
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-3">
          The Syllabus
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          {pathMeta.description}
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-12 space-y-12">
        {syllabus.map((part) => (
          <section key={part.id} className="scroll-mt-12">
            <div className="mb-6">
              <h2 className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-500 uppercase mb-1">
                Part {part.numeral}
              </h2>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{part.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{part.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {part.modules.map((module) => {
                const globalId = `${pathId}-${module.id}`;
                const isCompleted = progressMap[globalId] === 'done';
                return (
                  <Link
                    key={module.id}
                    href={`/path/${pathId}/module/${module.id}`}
                    className={`group block p-4 rounded-xl border transition-all duration-300 flex flex-col h-full ${
                      isCompleted 
                        ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50' 
                        : 'bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-medium transition-colors ${isCompleted ? 'text-emerald-500/50' : 'text-neutral-400 dark:text-neutral-700 group-hover:text-emerald-500/40 dark:group-hover:text-emerald-500/30'}`}>
                          {String(module.number).padStart(2, '0')}
                        </span>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full ${
                          module.depth === 'Architect' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {module.depth}
                        </span>
                      </div>
                    </div>
                    <h4 className={`text-sm font-semibold mb-2 leading-snug transition-colors ${
                      isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                    }`}>
                      {module.title}
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3 flex-1 leading-relaxed">
                      {module.description}
                    </p>
                    <div className="pt-3 mt-auto border-t border-neutral-200 dark:border-neutral-800/50 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500 font-medium">
                        {module.timeHours} hrs
                      </span>
                      <span className="text-xs text-emerald-500 font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        View Module →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
