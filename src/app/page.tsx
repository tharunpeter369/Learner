import Link from 'next/link';
import { paths } from '@/data/paths';
import { Lock, ArrowRight } from 'lucide-react';
import { Topbar } from '@/components/Topbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
      <Topbar isSticky={true} />

      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-6">
          Master Your <span className="text-emerald-500 dark:text-emerald-400">Craft.</span>
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-12">
          Opinionated learning paths designed to push you past senior engineer. Deep systems knowledge, architecture, and mastery. Free to read, login to practice.
        </p>
      </section>

      {/* Paths Grid */}
      <section className="max-w-[1400px] mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold mb-8 text-neutral-900 dark:text-white">Available Paths</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {paths.map((path) => (
            <div key={path.id} className="relative group">
               {path.comingSoon ? (
                 <div className="h-full p-8 rounded-2xl bg-white/50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 flex flex-col items-start opacity-70">
                   <div className="px-3 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full mb-4 flex items-center gap-2">
                     <Lock className="w-3 h-3" /> Coming Soon
                   </div>
                   <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-300 mb-3">{path.title}</h3>
                   <p className="text-neutral-500 line-clamp-2">{path.description}</p>
                 </div>
               ) : (
                 <Link href={`/path/${path.id}`} className="block h-full p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                   <div className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full mb-4 inline-block">
                     Available Now
                   </div>
                   <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{path.title}</h3>
                   <p className="text-neutral-600 dark:text-neutral-400 mb-8">{path.description}</p>
                   <div className="flex items-center text-emerald-500 font-medium group-hover:translate-x-2 transition-transform">
                     Start Path <ArrowRight className="w-4 h-4 ml-2" />
                   </div>
                 </Link>
               )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
