import React from 'react';
import {
  X,
  Shield,
  Key,
  Layers,
  Sparkles,
  Cpu,
  Lock,
  Download,
} from 'lucide-react';
import { ServiceStatus } from '../types/tts.ts';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ServiceStatus | null;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                درباره سامانه Parsa Saberi TTS
              </h3>
              <p className="text-xs text-slate-400">
                راهنمای سیستم، حریم خصوصی و اتصال سرویس‌ها
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="mt-5 space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          {/* Section 1: Zero Login & Privacy */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>دسترسی عمومی، عدم نیاز به ثبت‌نام و امنیت داده‌ها</span>
            </h4>
            <p className="text-slate-300 leading-normal">
              این پلتفرم بدون نیاز به ثبت‌نام، شماره تماس یا ایمیل طراحی شده است. هیچ متنی از ورودی‌های کاربران در پایگاه داده ذخیره نمی‌شود و تمام فایل‌های صوتی موقت پس از ۳۰ دقیقه به صورت خودکار از حافظه سرور پاکسازی می‌شوند.
            </p>
          </div>

          {/* Section 2: Providers & Failover */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>اتصال دوگانه به Google TTS و ElevenLabs</span>
            </h4>
            <p className="text-slate-300 leading-normal">
              سیستم به دو موتور پیشرو متصل است: اولویت اول سرویس Google Speech و اولویت دوم ElevenLabs Multilingual v2 است. در صورت بروز هرگونه قطعی یا اتمام سهمیه در سرویس اول، سیستم به طور خودکار درخواست را بدون اختلال به سرویس دوم منتقل می‌کند.
            </p>
          </div>

          {/* Section 3: Status of API Secrets */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>وضعیت کلیدهای محیطی (Secrets)</span>
            </h4>
            <div className="space-y-2 mt-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-300">GEMINI_API_KEY / GOOGLE_TTS_API_KEY</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-sans font-bold ${
                    status?.googleConfigured
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {status?.googleConfigured ? 'تنظیم شده و فعال' : 'در انتظار کلید'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-300">ELEVENLABS_API_KEY</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-sans font-bold ${
                    status?.elevenLabsConfigured
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {status?.elevenLabsConfigured ? 'تنظیم شده و فعال' : 'اختیاری / جایگزین'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 font-sans">
              کلیدهای API منحصراً در سمت سرور نگهداری شده و هرگز در فرانت‌اند یا مرورگر کاربر آشکار نمی‌شوند.
            </p>
          </div>

          {/* Section 4: Real MP3 Output */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>خروجی استاندارد MP3</span>
            </h4>
            <p className="text-slate-300 leading-normal">
              خروجی‌های صوتی با کدک استاندارد MP3 (نرخ ۱۲۸ کیلوبیت بر ثانیه) اینکود شده و با نام اختصاصی <span className="text-cyan-300 font-mono">parsa-saberi-tts.mp3</span> در تمامی دستگاه‌ها و نرم‌افزارهای پخش‌کننده قابل استفاده است.
            </p>
          </div>

        </div>

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
