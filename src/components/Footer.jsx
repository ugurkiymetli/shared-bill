import React from 'react';

export default function Footer() {
  return (
    <footer className="max-w-4xl mx-auto w-full px-4 text-center text-xs text-neutral-550 dark:text-neutral-600 border-t border-neutral-200 dark:border-neutral-900 pt-6 space-y-2">
      <div className="flex items-center justify-center gap-1 font-mono text-[10px] text-neutral-500 dark:text-neutral-500">
        <span>built by ugur</span>
      </div>
      <div className="flex items-center justify-center gap-1 font-mono text-[10px] text-neutral-500 dark:text-neutral-500">

        <a
          href="https://github.com/ugurkiymetli"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="GitHub"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/ugurkiymetli"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="LinkedIn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" rx="1" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
