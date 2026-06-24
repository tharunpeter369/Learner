"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LoginButton from "@/components/LoginButton";
import { ThemeToggle } from "@/components/ThemeToggle";

interface TopbarProps {
  backLink?: string;
  backLabel?: string;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  isSticky?: boolean;
}

export function Topbar({ backLink, backLabel, title, actions, isSticky = false }: TopbarProps) {
  return (
    <header className={`border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#121212]/80 backdrop-blur z-50 ${isSticky ? 'sticky top-0' : ''}`}>
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Section: Logo & Back Link */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-600 dark:text-emerald-500 text-sm">
              ▲
            </div>
            Learner
          </Link>
          
          {backLink && (
            <>
              <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 hidden sm:block"></div>
              <Link 
                href={backLink}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel || "Back"}
              </Link>
            </>
          )}
        </div>

        {/* Center Section: Contextual Title */}
        {title && (
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            {title}
          </div>
        )}

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3">
          {actions}
          <ThemeToggle />
          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800"></div>
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
