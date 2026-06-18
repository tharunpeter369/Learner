"use client";

import dynamic from 'next/dynamic';

const EditorPlayground = dynamic(() => import('@/components/EditorPlayground'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-neutral-900 w-full h-full rounded-lg flex items-center justify-center text-neutral-600">Loading Editor...</div> 
});

export default function EditorWrapper(props: { defaultLanguage?: string, moduleId: string }) {
  return <EditorPlayground {...props} />;
}
