import React from 'react';
import {
  Check,
  Play,
  Pause,
  Loader2,
  Volume2,
  User,
  Sparkles,
} from 'lucide-react';
import { Voice } from '../types/tts.ts';

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  isPlayingSample: boolean;
  isLoadingSample: boolean;
  onSelect: (voice: Voice) => void;
  onToggleSample: (voice: Voice, e: React.MouseEvent) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected,
  isPlayingSample,
  isLoadingSample,
  onSelect,
  onToggleSample,
}) => {
  const isMale = voice.gender === 'male';

  return (
    <div
      onClick={() => onSelect(voice)}
      className={`group relative rounded-2xl p-4 cursor-pointer transition-all duration-200 select-none border text-right ${
        isSelected
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-cyan-400/90 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-400/30'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700/80 shadow-md shadow-black/20'
      }`}
    >
      {/* Top badges: Recommended & Gender */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Gender Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              isMale
                ? 'bg-sky-500/10 border-sky-500/25 text-sky-300'
                : 'bg-pink-500/10 border-pink-500/25 text-pink-300'
            }`}
          >
            <User className="w-3 h-3" />
            <span>{isMale ? 'صدای مرد' : 'صدای زن'}</span>
          </span>

          {/* Engine/Provider Tag */}
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {voice.provider === 'google' ? 'Google TTS' : 'ElevenLabs'}
          </span>
        </div>

        {/* Selected Checkmark or Selection Circle */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-400/40'
              : 'border border-slate-700 group-hover:border-slate-500'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      {/* Voice Title & Subtitle */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-base group-hover:text-cyan-300 transition-colors">
            {voice.nameFa}
          </h3>
          {voice.isRecommended && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-400/15 border border-amber-400/30 text-amber-300 font-medium">
              <Sparkles className="w-2.5 h-2.5" />
              پیشنهادی
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {voice.styleFa}
        </p>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1 flex-wrap mb-3.5 pt-1">
        {voice.tags.slice(0, 3).map((tag, idx) => (
          <span
            key={idx}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-950/60 text-slate-400 border border-slate-800"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer: Listen Sample Button */}
      <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          {voice.language}
        </span>

        <button
          onClick={(e) => onToggleSample(voice, e)}
          type="button"
          disabled={isLoadingSample}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isPlayingSample
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          }`}
        >
          {isLoadingSample ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : isPlayingSample ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isPlayingSample ? 'توقف نمونه' : 'شنیدن نمونه'}</span>
        </button>
      </div>
    </div>
  );
};
