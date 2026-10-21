import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { TextInputCard } from './components/TextInputCard.tsx';
import { VoiceSelector } from './components/VoiceSelector.tsx';
import { AudioPlayerCard } from './components/AudioPlayerCard.tsx';
import { InfoModal } from './components/InfoModal.tsx';
import { Voice, GenerateTTSResponse, ServiceStatus } from './types/tts.ts';
import { VOICES_CONFIG } from './data/voices.ts';
import { AlertCircle, CheckCircle, Sparkles, Volume2, Shield } from 'lucide-react';

export default function App() {
  const [voices, setVoices] = useState<Voice[]>(VOICES_CONFIG);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(
    VOICES_CONFIG.find((v) => v.id === 'google-charon') || VOICES_CONFIG[0]
  );
  const [text, setText] = useState<string>(
    'سلام و درود! به سامانه تبدیل متن به گفتار پارسا صابری خوش آمدید. با انتخاب صدای مورد علاقه خود، فایل صوتی با کیفیت بالا و فرمت MP3 دریافت کنید.'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [autoFallback, setAutoFallback] = useState<boolean>(true);
  const [ttsResult, setTtsResult] = useState<GenerateTTSResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  // Fetch status and voices from backend on mount
  useEffect(() => {
    fetch('/api/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setServiceStatus(data);
      })
      .catch((err) => console.warn('Status fetch error:', err));

    fetch('/api/voices')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.voices && data.voices.length > 0) {
          setVoices(data.voices);
        }
      })
      .catch((err) => console.warn('Voices fetch error:', err));
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('لطفاً ابتدا متنی را برای تبدیل به صدا وارد فرمایید.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voiceId: selectedVoice.id,
          autoFallback,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطایی در تولید فایل صوتی رخ داد.');
      }

      setTtsResult(data);

      // Smooth scroll to audio player
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } catch (err: any) {
      console.error('TTS Generation Error:', err);
      setErrorMessage(
        err.message ||
          'متأسفانه مشکلی در ارتباط با سرویس تولید صدا رخ داد. لطفاً چند لحظه بعد مجدداً تلاش کنید.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-['Vazirmatn',sans-serif] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header status={serviceStatus} onOpenInfo={() => setIsInfoOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Alert (preserves text) */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">خطا در پردازش درخواست</h4>
                <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 transition"
            >
              بستن
            </button>
          </div>
        )}

        {/* Audio Player (appears on successful synthesis) */}
        {ttsResult && (
          <AudioPlayerCard
            ttsResult={ttsResult}
            onClearAudio={() => setTtsResult(null)}
          />
        )}

        {/* Text Input Card */}
        <TextInputCard
          text={text}
          setText={setText}
          maxChars={serviceStatus?.maxTextLength || 1200}
          isGenerating={isGenerating}
          selectedVoice={selectedVoice}
          autoFallback={autoFallback}
          setAutoFallback={setAutoFallback}
          onGenerate={handleGenerate}
        />

        {/* Voice Selector Section (30 real voices) */}
        <VoiceSelector
          voices={voices}
          selectedVoice={selectedVoice}
          onSelectVoice={(voice) => setSelectedVoice(voice)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 text-slate-400 py-8 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">Parsa Saberi</span>
            <span>— سامانه اختصاصی تبدیل متن فارسی به صدای طبیعی</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>۳۰ صدای واقعی (۱۵ مرد • ۱۵ زن)</span>
            <span>•</span>
            <span>فرمت MP3 استاندارد</span>
            <span>•</span>
            <span>بدون نیاز به ثبت‌نام</span>
          </div>
        </div>
      </footer>

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        status={serviceStatus}
      />
    </div>
  );
}
