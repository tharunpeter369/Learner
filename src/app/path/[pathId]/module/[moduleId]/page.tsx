import { getSyllabus } from '@/data/paths';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProgressToggle from '@/components/ProgressToggle';
import { RevisionsProvider } from '@/components/revisions/RevisionsProvider';
import LearnMode from '@/components/LearnMode';
import EditorWrapper from '@/components/EditorWrapper';
import { Topbar } from '@/components/Topbar';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getModuleContent } from '@/lib/mdx';
import { NotesProvider } from '@/components/notes/NotesProvider';
import { NotesDrawer } from '@/components/notes/NotesDrawer';
import { NotesHeadings } from '@/components/notes/NotesHeadings';
import { NoteButton } from '@/components/notes/NoteButton';
import { getProblems } from '@/lib/problems';
import { InterviewTab, type ProblemState } from '@/components/interview/InterviewTab';
import { createClient } from '@/utils/supabase/server';

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ pathId: string, moduleId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { pathId, moduleId } = await params;
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams.tab;
  const currentTab = typeof tab === 'string' ? tab : 'syllabus';

  let currentModule = null;
  let currentPart = null;
  
  const syllabus = getSyllabus(pathId);
  if (!syllabus) notFound();

  for (const part of syllabus) {
    const mod = part.modules.find(m => m.id === moduleId);
    if (mod) {
      currentModule = mod;
      currentPart = part;
      break;
    }
  }

  if (!currentModule) {
    notFound();
  }

  const globalId = `${pathId}-${moduleId}`;
  const mdxSource = await getModuleContent(pathId, moduleId);
  const syllabusMdxSource = await getModuleContent(pathId, `${moduleId}-syllabus`);

  // Prefetch this module's notes so the drawer + "has note" dots are instant.
  const initialNotes: Record<string, string> = {};
  if (currentTab === 'learn' || currentTab === 'syllabus') {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('notes')
        .select('topic_id, content')
        .eq('uid', user.id)
        .eq('module_id', globalId);
      if (data) {
        for (const row of data) initialNotes[row.topic_id as string] = (row.content as string | null) ?? '';
      }
    }
  }

  // Interview-tab problems + the user's saved solutions/solved-state.
  const problems = getProblems(pathId, moduleId);
  const initialProblemState: Record<string, ProblemState> = {};
  if (currentTab === 'interview' && problems) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Prefer selecting `solved`; fall back if the column isn't added yet.
      let rows = (
        await supabase
          .from('saved_code')
          .select('problem_id, code, solved')
          .eq('uid', user.id)
          .eq('module_id', globalId)
      ).data as { problem_id: string; code: string | null; solved?: boolean }[] | null;
      if (!rows) {
        rows = (
          await supabase
            .from('saved_code')
            .select('problem_id, code')
            .eq('uid', user.id)
            .eq('module_id', globalId)
        ).data as { problem_id: string; code: string | null; solved?: boolean }[] | null;
      }
      if (rows) {
        for (const row of rows) {
          initialProblemState[row.problem_id] = {
            code: row.code ?? undefined,
            solved: row.solved ?? false,
          };
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors">
      <Topbar 
        isSticky={true}
        backLink={`/path/${pathId}`} 
        backLabel="Syllabus" 
        title={
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 dark:text-neutral-500 font-mono text-sm">{String(currentModule.number).padStart(2, '0')}</span>
            <span className="font-semibold text-neutral-900 dark:text-white truncate max-wxs md:max-w-md">{currentModule.title}</span>
          </div>
        }
        actions={<ProgressToggle moduleId={globalId} />}
      />
      
      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/50 backdrop-blur sticky top-0 z-10 px-6">
        <nav className="flex gap-6 max-w-[1400px] mx-auto">
          {['syllabus', 'learn', 'practice', 'interview'].map((t) => (
            <Link
              key={t}
              href={`?tab=${t}`}
              className={`py-4 px-2 border-b-2 font-medium capitalize transition-colors ${
                currentTab === t 
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-500' 
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {t}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 flex flex-col">
        {currentTab === 'syllabus' && (
          <NotesProvider moduleId={globalId} initialNotes={initialNotes}>
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Module Overview</h2>
              <NoteButton id="general" title="General notes" label="General notes" />
            </div>
            <p className="text-neutral-600 dark:text-neutral-300">{currentModule.description}</p>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-1">Expected Time</p>
                  <p className="text-lg font-medium text-neutral-900 dark:text-white">{currentModule.timeHours} Hours</p>
               </div>
               <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-1">Target Depth</p>
                  <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">{currentModule.depth}</p>
               </div>
            </div>

            {syllabusMdxSource && (
              <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 prose prose-neutral dark:prose-invert prose-emerald max-w-none">
                <MDXRemote source={syllabusMdxSource} />
              </div>
            )}
          </div>
          <NotesDrawer />
          </NotesProvider>
        )}

        {currentTab === 'learn' && (
          <NotesProvider moduleId={globalId} initialNotes={initialNotes}>
            <RevisionsProvider moduleId={globalId}>
              <LearnMode moduleId={globalId}>
                {mdxSource ? (
                   <div id="learn-content" className="prose prose-neutral dark:prose-invert prose-emerald max-w-none bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-8 rounded-xl">
                     <MDXRemote source={mdxSource} />
                   </div>
                ) : (
                   <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-xl text-center text-neutral-500">
                     Content for this module has not been written yet. Create `src/content/{pathId}/{moduleId}.mdx` to see it here!
                   </div>
                )}
              </LearnMode>
              {mdxSource && <NotesHeadings containerId="learn-content" />}
              <NotesDrawer />
            </RevisionsProvider>
          </NotesProvider>
        )}

        {currentTab === 'practice' && (
          <div className="flex-1 min-h-[700px] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden flex flex-col">
            <EditorWrapper defaultLanguage="javascript" moduleId={globalId} />
          </div>
        )}

        {currentTab === 'interview' && (
          problems ? (
            <InterviewTab problems={problems} moduleId={globalId} initial={initialProblemState} />
          ) : (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-xl text-center text-neutral-500">
              Interview problems for this module haven&apos;t been added yet.
            </div>
          )
        )}
      </main>
    </div>
  );
}
