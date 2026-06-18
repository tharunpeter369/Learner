import { syllabus } from '@/data/syllabus';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LoginButton from '@/components/LoginButton';
import LearnMode from '@/components/LearnMode';
import EditorWrapper from '@/components/EditorWrapper';

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams.tab;
  const currentTab = typeof tab === 'string' ? tab : 'syllabus';

  let currentModule = null;
  let currentPart = null;
  
  for (const part of syllabus) {
    const mod = part.modules.find(m => m.id === id);
    if (mod) {
      currentModule = mod;
      currentPart = part;
      break;
    }
  }

  if (!currentModule) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <header className="border-b border-neutral-800 p-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-emerald-500 hover:text-emerald-400 text-sm mb-2 inline-block">
            ← Back to Syllabus
          </Link>
          <h1 className="text-2xl font-bold">
            <span className="text-neutral-500 mr-3">{String(currentModule.number).padStart(2, '0')}</span>
            {currentModule.title}
          </h1>
        </div>
        <div className="flex gap-4 items-center">
           <LoginButton />
        </div>
      </header>
      
      {/* Tabs Navigation */}
      <div className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur sticky top-0 z-10 px-6">
        <nav className="flex gap-6 max-w-5xl mx-auto">
          {['syllabus', 'learn', 'practice'].map((t) => (
            <Link
              key={t}
              href={`?tab=${t}`}
              className={`py-4 px-2 border-b-2 font-medium capitalize transition-colors ${
                currentTab === t 
                  ? 'border-emerald-500 text-emerald-500' 
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {t}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 flex flex-col">
        {currentTab === 'syllabus' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Module Overview</h2>
            <p className="text-neutral-300">{currentModule.description}</p>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                  <p className="text-sm text-neutral-500 mb-1">Expected Time</p>
                  <p className="text-lg font-medium">{currentModule.timeHours} Hours</p>
               </div>
               <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                  <p className="text-sm text-neutral-500 mb-1">Target Depth</p>
                  <p className="text-lg font-medium text-emerald-400">{currentModule.depth}</p>
               </div>
            </div>
          </div>
        )}

        {currentTab === 'learn' && (
          <LearnMode moduleId={id} />
        )}

        {currentTab === 'practice' && (
          <div className="flex-1 min-h-[700px] border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
            <EditorWrapper defaultLanguage="javascript" moduleId={id} />
          </div>
        )}
      </main>
    </div>
  );
}
