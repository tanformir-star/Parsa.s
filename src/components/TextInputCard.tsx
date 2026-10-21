import React from 'react';
import {
  Sparkles,
  Trash2,
  Send,
  Loader2,
  Wand2,
  RefreshCw,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { Voice } from '../types/tts.ts';

interface TextInputCardProps {
  text: string;
  setText: (text: string) => void;
  maxChars: number;
  isGenerating: boolean;
  selectedVoice: Voice;
  autoFallback: boolean;
  setAutoFallback: (val: boolean) => void;
  onGenerate: () => void;
}

const PRESET_TEXTS = [
  {
    title: 'نریشن تبلیغاتی',
    text: 'آیا به دنبال کیفیتی متمایز و تجربه‌ای نوین در کسب‌وکار خود هستید؟ ما در کنار شما هستیم تا ایده‌های بزرگتان را به واقعیت تبدیل کنیم.',
  },
  {
    title: 'کتاب صوتی و قصه',
    text: 'خورشید آرام‌آرام در افق سرخ فام کوهستان فرو می‌نشست و نسیم خنک شامگاهی، بوی دل‌انگیز خاک باران‌خورده را در کوچه باغ‌های قدیمی می‌پراکند.',
  },
  {
    title: 'متن خبری و رسمی',
    text: 'بر اساس آخرین گزارش‌های دریافتی، توسعه زیرساخت‌های فناوری ارتباطات در سال جاری با شتاب چشمگیری روبرو بوده و دسترسی کاربران را بهبود بخشیده است.',
  },
  {
    title: 'جمله انگیزشی',
    text: 'هر روز صبح فرصتی دوباره است برای آغاز کردن، جنگیدن برای رویاها و ساختن آینده‌ای که شایسته آن هستید. از مسیر لذت ببرید.',
  },
];

export const TextInputCard: React.FC<TextInputCardProps> = ({
  text,
  setText,
  maxChars,
  isGenerating,
  selectedVoice,
  autoFallback,
  setAutoFallback,
  onGenerate,
}) => {
  const charCount = text.length;
  const isNearLimit = charCount > maxChars * 0.9;
  const isOverLimit = charCount > maxChars;
  const isEmpty = charCount === 0;

  return (
    <div className="relative rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-xl mb-8 transition-all">
      {/* Top Header of Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-cyan-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              ورود متن جهت تبدیل به صدا
            </h2>
            <p className="text-xs text-slate-400">
              متن فارسی خود را تایپ کنید یا از نمونه‌های آماده استفاده نمایید.
            </p>
          </div>
        </div>

        {/* Clear Button */}
        {text && (
          <button
            onClick={() => setText('')}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-rose-300 text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>پاک کردن متن</span>
          </button>
        )}
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex items-center gap-2 mb-3.5 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">نمونه‌های سریع:</span>
        {PRESET_TEXTS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setText(preset.text)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition"
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Textarea Input */}
      <div className="relative">
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="متن فارسی، انگلیسی یا جملات مورد نظر خود را در این بخش بنویسید..."
          className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-500 text-sm sm:text-base leading-relaxed transition-all resize-y outline-none"
          dir="rtl"
        />

        {/* Character Counter inside / bottom corner */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
          <div className="flex items-center gap-3">
            {/* Auto Fallback Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoFallback}
                onChange={(e) => setAutoFallback(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
              />
              <span className="text-slate-300 text-xs">
                جایگزینی خودکار در صورت افت سرعت یا اتمام سهمیه
              </span>
            </label>
          </div>

          <div
            className={`font-mono text-xs font-semibold ${
              isOverLimit
                ? 'text-rose-400'
                : isNearLimit
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            {charCount} / {maxChars} نویسه
          </div>
        </div>
      </div>

      {/* Action Button: Generate Voice */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <div className="text-xs text-slate-400 flex items-center gap-1.5 w-full sm:w-auto">
          <span>صدای انتخاب‌شده:</span>
          <span className="font-bold text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-md border border-cyan-800/40">
            {selectedVoice.nameFa} ({selectedVoice.gender === 'male' ? 'مرد' : 'زن'})
          </span>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating || isEmpty || isOverLimit}
          type="button"
          className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-xl ${
            isGenerating || isEmpty || isOverLimit
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-slate-950 shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>در حال تولید فایل صوتی...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 fill-current" />
              <span>تولید و دریافت فایل صوتی (MP3)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
