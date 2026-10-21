import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileAudio,
} from 'lucide-react';
import { GenerateTTSResponse } from '../types/tts.ts';
import { WaveformVisualizer } from './WaveformVisualizer.tsx';

interface AudioPlayerCardProps {
  ttsResult: GenerateTTSResponse;
  onClearAudio: () => void;
}

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  ttsResult,
  onClearAudio,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    // When a new result arrives, reset playback and automatically start playing
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [ttsResult]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const downloadUrl = ttsResult.audioUrl
    ? `${ttsResult.audioUrl}?download=1`
    : ttsResult.audioBase64 || '#';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-cyan-500/30 p-5 sm:p-6 shadow-2xl shadow-cyan-950/20 mb-8 transition-all">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-1/4 w-72 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={ttsResult.audioUrl || ttsResult.audioBase64}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Top bar: voice metadata & fallback info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-900/40">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-base">
                صدای {ttsResult.voiceUsed.nameFa}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-medium">
                فرمت نهایی MP3
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>سرویس: {ttsResult.providerUsed === 'google' ? 'Google Speech' : 'ElevenLabs'}</span>
              <span>•</span>
              <span>{formatFileSize(ttsResult.sizeBytes)}</span>
              <span>•</span>
              <span>{ttsResult.characterCount} کاراکتر</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تولید موفق</span>
          </div>
        </div>
      </div>

      {/* Failover notice if secondary provider took over */}
      {ttsResult.fallbackTriggered && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">جایگزینی خودکار سرویس: </span>
            {ttsResult.fallbackReason || 'به دلیل محدودیت موقت سهمیه سرویس اولیه، پردازش با سرویس دوم انجام پذیرفت.'}
          </div>
        </div>
      )}

      {/* Waveform graphic */}
      <div className="mt-5 mb-4">
        <WaveformVisualizer isPlaying={isPlaying} />
      </div>

      {/* Progress slider & times */}
      <div className="space-y-1.5">
        <div className="relative group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            dir="ltr"
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono" dir="ltr">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || ttsResult.durationSeconds || 0)}</span>
        </div>
      </div>

      {/* Main audio controls & download button */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Playback buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
          <button
            onClick={togglePlay}
            type="button"
            className="w-13 h-13 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'توقف' : 'پخش'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current text-slate-950" />
            ) : (
              <Play className="w-6 h-6 fill-current text-slate-950 mr-0.5" />
            )}
          </button>

          <button
            onClick={handleReplay}
            type="button"
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-sm"
            title="پخش مجدد از ابتدا"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Volume controls */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <button
              onClick={toggleMute}
              type="button"
              className="text-slate-400 hover:text-cyan-400 transition"
              title={isMuted ? 'وصل صدا' : 'قطع صدا'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              dir="ltr"
            />
          </div>
        </div>

        {/* Download Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <a
            href={downloadUrl}
            download="parsa-saberi-tts.mp3"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-teal-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل MP3</span>
          </a>

          <button
            onClick={onClearAudio}
            type="button"
            className="px-3.5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
