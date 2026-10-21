import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Voice } from '../types/tts.ts';
import { VoiceCard } from './VoiceCard.tsx';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: Voice;
  onSelectVoice: (voice: Voice) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'male' | 'female'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<'all' | 'google' | 'elevenlabs'>('all');

  // Preview sample playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const maleCount = voices.filter((v) => v.gender === 'male').length;
  const femaleCount = voices.filter((v) => v.gender === 'female').length;

  // Filter voices based on tabs, search and provider
  const filteredVoices = voices.filter((voice) => {
    if (activeTab === 'male' && voice.gender !== 'male') return false;
    if (activeTab === 'female' && voice.gender !== 'female') return false;
    if (providerFilter !== 'all' && voice.provider !== providerFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = voice.nameFa.toLowerCase().includes(q) || voice.nameEn.toLowerCase().includes(q);
      const matchStyle = voice.styleFa.toLowerCase().includes(q);
      const matchTags = voice.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchStyle || matchTags;
    }
    return true;
  });

  const handleToggleSample = async (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already playing this voice, stop it
    if (playingVoiceId === voice.id) {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop current sample
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
    }

    setLoadingVoiceId(voice.id);

    try {
      // Call server endpoint to get sample
      const res = await fetch('/api/tts/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId: voice.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در دریافت نمونه صدا');
      }

      const audio = new Audio(data.audioUrl || data.audioBase64);
      sampleAudioRef.current = audio;

      audio.onended = () => {
        setPlayingVoiceId(null);
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
      };

      await audio.play();
      setPlayingVoiceId(voice.id);
    } catch (err: any) {
      console.warn('Sample playback failed:', err.message);
      // Fallback: If Web Speech Synthesis is supported in the browser, play fallback preview
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(voice.sampleText);
        utter.lang = 'fa-IR';
        utter.onend = () => setPlayingVoiceId(null);
        utter.onerror = () => setPlayingVoiceId(null);
        window.speechSynthesis.speak(utter);
        setPlayingVoiceId(voice.id);
      }
    } finally {
      setLoadingVoiceId(null);
    }
  };

  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>انتخاب صدا از بین ۳۰ گزینه واقعی</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                ۳۰ صدا (۱۵ مرد • ۱۵ زن)
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            صدای دلخواه خود را بر اساس جنسیت، لحن و سبک گفتار انتخاب فرمایید.
          </p>
        </div>

        {/* Search & Provider Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجوی نام یا لحن صدا..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 text-slate-200 placeholder-slate-500 transition-all outline-none"
            />
          </div>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 focus:border-cyan-400 outline-none"
          >
            <option value="all">همه سرویس‌ها</option>
            <option value="google">Google Speech</option>
            <option value="elevenlabs">ElevenLabs</option>
          </select>
        </div>
      </div>

      {/* Category Tabs: Male 15, Female 15, All 30 */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6 max-w-xl">
        <button
          onClick={() => setActiveTab('all')}
          type="button"
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          همه صداها ({voices.length})
        </button>

        <button
          onClick={() => setActiveTab('male')}
          type="button"
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'male'
              ? 'bg-gradient-to-r from-sky-600 to-blue-500 text-white shadow-md shadow-blue-950/40'
              : 'text-slate-400 hover:text-sky-300'
          }`}
        >
          <span>صداهای مردانه</span>
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
            {maleCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('female')}
          type="button"
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'female'
              ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-950/40'
              : 'text-slate-400 hover:text-pink-300'
          }`}
        >
          <span>صداهای زنانه</span>
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
            {femaleCount}
          </span>
        </button>
      </div>

      {/* Grid of Voice Cards */}
      {filteredVoices.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <p className="text-slate-400 text-sm">هیچ صدایی با این مشخصات یافت نشد.</p>
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
              setProviderFilter('all');
            }}
            className="mt-3 text-xs text-cyan-400 underline font-medium hover:text-cyan-300"
          >
            پاک کردن فیلترها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {filteredVoices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              isSelected={selectedVoice.id === voice.id}
              isPlayingSample={playingVoiceId === voice.id}
              isLoadingSample={loadingVoiceId === voice.id}
              onSelect={onSelectVoice}
              onToggleSample={handleToggleSample}
            />
          ))}
        </div>
      )}
    </section>
  );
};
