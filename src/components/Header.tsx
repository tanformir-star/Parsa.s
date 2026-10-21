import React from 'react';
import { Volume2, Sparkles, ShieldCheck, Info, Download } from 'lucide-react';
import { ServiceStatus } from '../types/tts.ts';

interface HeaderProps {
  status: ServiceStatus | null;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenInfo }) => {
  return (
    <header className="relative border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand & Main Titles */}
          <div className="flex items-center gap-3.5 text-right w-full sm:w-auto">
            <div className="relative group flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/40">
                <Volume2 className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span className="bg-gradient-to-l from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                    Parsa Saberi
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium hidden xs:inline-block">
                    TTS Studio
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                تبدیل متن به صدای طبیعی • ۳۰ صدای فارسی و بین‌المللی با فرمت MP3
              </p>
            </div>
          </div>

          {/* Status indicators & info */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-end w-full sm:w-auto">
            
            {/* Free / No Login Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>دسترسی آزاد و رایگان (بدون ثبت‌نام)</span>
            </div>

            {/* Service Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="font-medium">
                {status ? 'سرویس آماده تولید صدا' : 'در حال اتصال به سرور...'}
              </span>
            </div>

            {/* Direct Project ZIP Download */}
            <a
              href="/api/download-zip"
              download="parsa-saberi-tts.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-semibold transition-all shadow-sm"
              title="دانلود سورس‌کد کامل پروژه به صورت فایل ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود سورس ZIP</span>
            </a>

            {/* Info / Secrets Modal Trigger */}
            <button
              onClick={onOpenInfo}
              type="button"
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition-all shadow-sm"
              title="اطلاعات سیستم و حریم خصوصی"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
