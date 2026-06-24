"use client";

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

const EditorPlayground = dynamic(() => import('@/components/EditorPlayground'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-neutral-900 w-full h-full rounded-lg flex items-center justify-center text-neutral-600">Loading Editor...</div> 
});

export default function EditorWrapper({ defaultLanguage = 'javascript', moduleId }: { defaultLanguage?: string, moduleId: string }) {
  const { theme } = useTheme();
  return <EditorPlayground theme={theme} defaultLanguage={defaultLanguage} moduleId={moduleId} />;
}
