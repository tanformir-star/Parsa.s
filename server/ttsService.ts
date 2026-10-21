import { GoogleGenAI } from '@google/genai';
import { Voice, GenerateTTSResponse } from '../src/types/tts.ts';
import { getFallbackVoice } from '../src/data/voices.ts';
import { wavOrPcmToMp3, isMp3Buffer } from './audioConverter.ts';

// Text normalizer for Persian typography and speech clarity
export function normalizePersianText(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, '\n')
    // Replace Arabic Kaf and Yeh with Persian
    .replace(/\u0643/g, 'ک')
    .replace(/\u064A/g, 'ی')
    .replace(/\u0649/g, 'ی')
    // Replace Arabic numbers with Persian/English digits if needed
    .replace(/\u0660/g, '۰')
    .replace(/\u0661/g, '۱')
    .replace(/\u0662/g, '۲')
    .replace(/\u0663/g, '۳')
    .replace(/\u0664/g, '۴')
    .replace(/\u0665/g, '۵')
    .replace(/\u0666/g, '۶')
    .replace(/\u0667/g, '۷')
    .replace(/\u0668/g, '۸')
    .replace(/\u0669/g, '۹');
}

/**
 * Call Google Cloud Text-to-Speech REST API (supports fa-IR voices directly)
 */
async function callGoogleCloudTTS(text: string, voice: Voice, apiKey: string): Promise<Buffer> {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'aistudio-build',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'fa-IR',
        name: voice.providerVoiceId,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const errorData = safeJsonParse(errorBody);
    const code = response.status;
    const msg = errorData?.error?.message || `Google Cloud TTS error ${code}`;
    throw new Error(`GOOGLE_CLOUD_ERROR:${code}:${msg}`);
  }

  const data = await response.json();
  if (!data.audioContent) {
    throw new Error('GOOGLE_CLOUD_ERROR:NO_AUDIO:سرویس خروجی صوتی تولید نکرد');
  }

  return Buffer.from(data.audioContent, 'base64');
}

/**
 * Call Gemini TTS via @google/genai SDK (supports rich multilingual voices like Charon, Puck, etc.)
 */
async function callGeminiTTS(text: string, voice: Voice, apiKey: string): Promise<Buffer> {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Allowed prebuilt voice names in Gemini TTS
  const allowedGeminiVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Zephyr', 'Orus', 'Leda', 'Callisto'];
  const voiceName = allowedGeminiVoices.includes(voice.providerVoiceId)
    ? voice.providerVoiceId
    : voice.gender === 'female'
    ? 'Kore'
    : 'Charon';

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Read the following Persian text clearly, naturally, and warmly in fluent Persian:\n\n${text}`,
            speechMetadata: {
              style: 'Natural fluent Persian speaker, clear and engaging tone',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('GEMINI_TTS_ERROR:NO_AUDIO:خروجی صوتی از مدل دریافت نشد');
  }

  const rawWavBuffer = Buffer.from(base64Audio, 'base64');
  // Convert unary WAV from Gemini TTS into genuine MP3 buffer via lamejs
  return wavOrPcmToMp3(rawWavBuffer, 24000, 1, 128);
}

/**
 * Call ElevenLabs Text-to-Speech API
 */
async function callElevenLabsTTS(text: string, voice: Voice, apiKey: string): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.providerVoiceId}?output_format=mp3_44100_128`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'aistudio-build',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const errorData = safeJsonParse(errorBody);
    const code = response.status;
    const msg = errorData?.detail?.message || errorData?.message || `ElevenLabs error ${code}`;
    throw new Error(`ELEVENLABS_ERROR:${code}:${msg}`);
  }

  const arrayBuf = await response.arrayBuffer();
  return Buffer.from(arrayBuf);
}

function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export interface TTSExecutionResult {
  mp3Buffer: Buffer;
  providerUsed: 'google' | 'elevenlabs';
  voiceUsed: Voice;
  fallbackTriggered: boolean;
  fallbackReason?: string;
}

/**
 * Central TTS engine with automatic failover system (Google <-> ElevenLabs)
 */
export async function synthesizeSpeech(
  text: string,
  targetVoice: Voice,
  allowFallback = true
): Promise<TTSExecutionResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const googleTtsKey = process.env.GOOGLE_TTS_API_KEY || geminiKey;
  const defaultElevenKey = 'sk_6601bd19d021d3f665897f634a74bb4fb8b9adf6ea470363';
  const elevenKey = (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.startsWith('sk_'))
    ? process.env.ELEVENLABS_API_KEY
    : defaultElevenKey;

  const normalized = normalizePersianText(text);
  if (!normalized) {
    throw new Error('INVALID_REQUEST:متن ورودی نمی‌تواند خالی باشد.');
  }

  const primaryProvider = targetVoice.provider;
  let primaryError: any = null;

  // 1. Attempt Primary Provider
  if (primaryProvider === 'google') {
    if (googleTtsKey || geminiKey) {
      try {
        let buffer: Buffer;
        if (targetVoice.engine === 'google-cloud-tts') {
          try {
            buffer = await callGoogleCloudTTS(normalized, targetVoice, googleTtsKey!);
          } catch (cloudErr) {
            // If cloud TTS fails, try Gemini TTS as immediate internal fallback
            if (geminiKey) {
              buffer = await callGeminiTTS(normalized, targetVoice, geminiKey);
            } else {
              throw cloudErr;
            }
          }
        } else {
          // gemini-tts
          buffer = await callGeminiTTS(normalized, targetVoice, (geminiKey || googleTtsKey)!);
        }

        // Ensure real MP3 buffer
        const finalMp3 = isMp3Buffer(buffer) ? buffer : wavOrPcmToMp3(buffer, 24000, 1, 128);
        return {
          mp3Buffer: finalMp3,
          providerUsed: 'google',
          voiceUsed: targetVoice,
          fallbackTriggered: false,
        };
      } catch (err: any) {
        primaryError = err;
        console.warn(`[TTS] Google TTS failed: ${err.message}. Checking failover to ElevenLabs...`);
      }
    } else {
      primaryError = new Error('AUTH_ERROR:کلید API گوگل تنظیم نشده است.');
    }

    // 2. Fallback to ElevenLabs if allowed and configured
    if (allowFallback && elevenKey) {
      try {
        const fallbackVoice = getFallbackVoice(targetVoice, 'elevenlabs');
        console.log(`[TTS Failover] Attempting ElevenLabs fallback voice: ${fallbackVoice.nameFa}`);
        const buffer = await callElevenLabsTTS(normalized, fallbackVoice, elevenKey);
        const finalMp3 = isMp3Buffer(buffer) ? buffer : wavOrPcmToMp3(buffer, 44100, 1, 128);
        return {
          mp3Buffer: finalMp3,
          providerUsed: 'elevenlabs',
          voiceUsed: fallbackVoice,
          fallbackTriggered: true,
          fallbackReason: `سرویس گوگل با خطا مواجه شد (${formatErrorMessage(primaryError)}). درخواست به سرویس ElevenLabs منتقل شد.`,
        };
      } catch (fbErr: any) {
        console.error(`[TTS Failover Error] ElevenLabs also failed:`, fbErr);
        throw new Error(`BOTH_FAILED:سرویس اصلی (گوگل) و سرویس جایگزین (ElevenLabs) هر دو با خطا مواجه شدند. خطای اولیه: ${formatErrorMessage(primaryError)}`);
      }
    } else {
      throw primaryError;
    }
  } else {
    // Primary is ElevenLabs
    if (elevenKey) {
      try {
        const buffer = await callElevenLabsTTS(normalized, targetVoice, elevenKey);
        const finalMp3 = isMp3Buffer(buffer) ? buffer : wavOrPcmToMp3(buffer, 44100, 1, 128);
        return {
          mp3Buffer: finalMp3,
          providerUsed: 'elevenlabs',
          voiceUsed: targetVoice,
          fallbackTriggered: false,
        };
      } catch (err: any) {
        primaryError = err;
        console.warn(`[TTS] ElevenLabs failed: ${err.message}. Checking failover to Google...`);
      }
    } else {
      primaryError = new Error('AUTH_ERROR:کلید API سرویس ElevenLabs تنظیم نشده است.');
    }

    // Fallback to Google
    if (allowFallback && (googleTtsKey || geminiKey)) {
      try {
        const fallbackVoice = getFallbackVoice(targetVoice, 'google');
        console.log(`[TTS Failover] Attempting Google fallback voice: ${fallbackVoice.nameFa}`);
        let buffer: Buffer;
        if (fallbackVoice.engine === 'google-cloud-tts' && googleTtsKey) {
          buffer = await callGoogleCloudTTS(normalized, fallbackVoice, googleTtsKey);
        } else {
          buffer = await callGeminiTTS(normalized, fallbackVoice, (geminiKey || googleTtsKey)!);
        }
        const finalMp3 = isMp3Buffer(buffer) ? buffer : wavOrPcmToMp3(buffer, 24000, 1, 128);
        return {
          mp3Buffer: finalMp3,
          providerUsed: 'google',
          voiceUsed: fallbackVoice,
          fallbackTriggered: true,
          fallbackReason: `سرویس ElevenLabs با خطا مواجه شد (${formatErrorMessage(primaryError)}). درخواست به سرویس گوگل منتقل شد.`,
        };
      } catch (fbErr: any) {
        console.error(`[TTS Failover Error] Google fallback also failed:`, fbErr);
        throw new Error(`BOTH_FAILED:سرویس اصلی و سرویس جایگزین هر دو با خطا مواجه شدند.`);
      }
    } else {
      throw primaryError;
    }
  }
}

function formatErrorMessage(err: any): string {
  if (!err) return 'خطای نامشخص';
  const msg = err.message || String(err);
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'سهمیه سرویس به پایان رسیده است';
  }
  if (msg.includes('401') || msg.includes('403') || msg.includes('AUTH_ERROR')) {
    return 'خطای احراز هویت کلید API';
  }
  return msg;
}
