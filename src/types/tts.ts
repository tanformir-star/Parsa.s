export type VoiceGender = 'male' | 'female';
export type VoiceProvider = 'google' | 'elevenlabs';
export type VoiceEngine = 'gemini-tts' | 'google-cloud-tts' | 'elevenlabs';

export interface Voice {
  id: string;
  nameFa: string;
  nameEn: string;
  gender: VoiceGender;
  provider: VoiceProvider;
  engine: VoiceEngine;
  providerVoiceId: string;
  language: string;
  styleFa: string;
  sampleText: string;
  tags: string[];
  qualityBadge: string;
  isRecommended?: boolean;
}

export interface GenerateTTSRequest {
  text: string;
  voiceId: string;
  speed?: number;
  pitch?: number;
  autoFallback?: boolean;
}

export interface GenerateTTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  format: 'mp3';
  providerUsed: VoiceProvider;
  voiceUsed: Voice;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  durationSeconds?: number;
  sizeBytes?: number;
  characterCount: number;
  error?: string;
  errorCode?: 'QUOTA_EXCEEDED' | 'AUTH_ERROR' | 'INVALID_REQUEST' | 'RATE_LIMIT' | 'SERVICE_UNAVAILABLE' | 'UNKNOWN';
}

export interface ServiceStatus {
  googleConfigured: boolean;
  elevenLabsConfigured: boolean;
  activeDefaultProvider: VoiceProvider;
  maxTextLength: number;
  rateLimitPerMinute: number;
  totalVoices: number;
  maleVoices: number;
  femaleVoices: number;
}
