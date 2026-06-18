import Link from 'next/link';
import { syllabus } from '@/data/syllabus';
import LoginButton from '@/components/LoginButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-800">
        <div className="flex justify-between items-start mb-6">
          <div className="inline-block px-3 py-1 text-sm font-medium tracking-wider text-emerald-400 uppercase bg-emerald-400/10 rounded-full">
            Personal Engineering Codex
          </div>
          <LoginButton />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          The Architect's Path
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed">
          A Senior Frontend · Fullstack · Desktop Mastery Syllabus. Move from senior engineer—someone who builds what is asked—to architect—someone who decides how systems are built and can defend every choice.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {syllabus.map((part) => (
          <section key={part.id} className="scroll-mt-12">
            <div className="mb-8">
              <h2 className="text-sm font-semibold tracking-widest text-emerald-500 uppercase mb-2">
                Part {part.numeral}
              </h2>
              <h3 className="text-2xl font-bold text-white mb-3">{part.title}</h3>
              <p className="text-neutral-400">{part.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {part.modules.map((mod) => (
                <Link
                  href={`/module/${mod.id}`}
                  key={mod.id}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800/50 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-light text-neutral-700 group-hover:text-emerald-500/30 transition-colors">
                        {String(mod.number).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          mod.depth === 'Architect' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {mod.depth}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-lg font-medium text-neutral-100 mb-2 group-hover:text-emerald-400 transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-sm text-neutral-400 line-clamp-2">
                      {mod.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-800/50 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 font-medium">
                      {mod.timeHours} hrs
                    </span>
                    <span className="text-xs text-emerald-500 font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      View Module →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
