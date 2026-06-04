import React from 'react';
import { Calculator, FileText, Settings, Sun, Moon, Home } from 'lucide-react';

export default function Header({ apartmentName, activeTab, onTabChange, theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 px-4 py-3.5">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 shadow-md">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-outfit m-0 leading-none uppercase">
              {apartmentName}
            </h1>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider uppercase mt-1">
              Fatura Bölüşüm Paneli
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Navigation Tabs */}
          <nav className="flex-grow sm:flex-grow-0 flex bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800/80">
            <button
              id="tab-calculate"
              onClick={() => onTabChange('calculate')}
              className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'calculate'
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Hesapla
            </button>
            <button
              id="tab-archive"
              onClick={() => onTabChange('archive')}
              className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'archive'
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Arşiv
            </button>
            <button
              id="tab-settings"
              onClick={() => onTabChange('settings')}
              className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings'
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Ayarlar
            </button>
          </nav>

          {/* Dark / Light Toggle */}
          <button
            id="theme-toggle"
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"
            title={theme === 'dark' ? 'Aydınlık Tema' : 'Karanlık Tema'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
