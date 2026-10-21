import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { VOICES_CONFIG, getVoiceById } from './src/data/voices.ts';
import { synthesizeSpeech } from './server/ttsService.ts';
import {
  checkRateLimit,
  startProcessing,
  stopProcessing,
  getClientIp,
  MAX_TEXT_LENGTH,
  RATE_LIMIT_MAX_PER_MINUTE,
} from './server/rateLimiter.ts';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '2mb' }));

// Temporary in-memory audio store (expires after 30 mins)
interface StoredAudio {
  id: string;
  buffer: Buffer;
  mimeType: string;
  createdAt: number;
}
const audioStore = new Map<string, StoredAudio>();

// Periodic cleanup of audio older than 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of audioStore.entries()) {
    if (now - item.createdAt > 30 * 60 * 1000) {
      audioStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

// API Status
app.get('/api/status', (req: Request, res: Response) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGoogleCloud = Boolean(process.env.GOOGLE_TTS_API_KEY);
  const hasGoogle = hasGemini || hasGoogleCloud;
  const hasElevenLabs = true;

  const maleCount = VOICES_CONFIG.filter((v) => v.gender === 'male').length;
  const femaleCount = VOICES_CONFIG.filter((v) => v.gender === 'female').length;

  res.json({
    googleConfigured: hasGoogle,
    elevenLabsConfigured: hasElevenLabs,
    activeDefaultProvider: hasGoogle ? 'google' : hasElevenLabs ? 'elevenlabs' : 'none',
    maxTextLength: MAX_TEXT_LENGTH,
    rateLimitPerMinute: RATE_LIMIT_MAX_PER_MINUTE,
    totalVoices: VOICES_CONFIG.length,
    maleVoices: maleCount,
    femaleVoices: femaleCount,
  });
});

// Get Voices List (30 voices: 15 male, 15 female)
app.get('/api/voices', (req: Request, res: Response) => {
  res.json({
    voices: VOICES_CONFIG,
    total: VOICES_CONFIG.length,
  });
});

// Stream or download generated MP3
app.get('/api/audio/:id', (req: Request, res: Response) => {
  const audioId = req.params.id.replace(/\.mp3$/, '');
  const item = audioStore.get(audioId);

  if (!item) {
    res.status(404).send('فایل صوتی یافت نشد یا منقضی شده است.');
    return;
  }

  const isDownload = req.query.download === '1';
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', item.buffer.length);
  res.setHeader('Accept-Ranges', 'bytes');

  if (isDownload) {
    res.setHeader('Content-Disposition', 'attachment; filename="parsa-saberi-tts.mp3"');
  } else {
    res.setHeader('Content-Disposition', 'inline; filename="parsa-saberi-tts.mp3"');
  }

  res.send(item.buffer);
});

// Download project ZIP file
app.get('/api/download-zip', (req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'dist', 'parsa-saberi-tts.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'parsa-saberi-tts.zip');
  } else {
    res.status(404).send('فایل فشرده یافت نشد.');
  }
});

// Generate TTS
app.post('/api/tts', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { text, voiceId, autoFallback = true } = req.body;

  // 1. Check rate limit & concurrency lock
  const rateLimitCheck = checkRateLimit(ip);
  if (!rateLimitCheck.allowed) {
    res.status(429).json({
      success: false,
      errorCode: 'RATE_LIMIT',
      error: rateLimitCheck.error,
    });
    return;
  }

  // 2. Validate input
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({
      success: false,
      errorCode: 'INVALID_REQUEST',
      error: 'لطفاً متن مورد نظر خود را برای تبدیل به صدا وارد کنید.',
    });
    return;
  }

  if (text.length > MAX_TEXT_LENGTH) {
    res.status(400).json({
      success: false,
      errorCode: 'INVALID_REQUEST',
      error: `طول متن (${text.length} نویسه) از حداکثر سقف مجاز (${MAX_TEXT_LENGTH} نویسه) بیشتر است.`,
    });
    return;
  }

  const voice = getVoiceById(voiceId);
  if (!voice) {
    res.status(400).json({
      success: false,
      errorCode: 'INVALID_REQUEST',
      error: 'صدای انتخاب‌شده معتبر نیست. لطفاً یک صدا از لیست انتخاب کنید.',
    });
    return;
  }

  // Check if at least one API key is configured
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGoogle = Boolean(process.env.GOOGLE_TTS_API_KEY) || hasGemini;
  const hasEleven = true;

  if (!hasGoogle && !hasEleven) {
    res.status(503).json({
      success: false,
      errorCode: 'AUTH_ERROR',
      error: 'هیچ کلید API (گوگل یا ElevenLabs) بر روی سرور تنظیم نشده است. لطفاً کلیدهای لازم را در بخش Secrets وارد فرمایید.',
    });
    return;
  }

  startProcessing(ip);

  try {
    const result = await synthesizeSpeech(text, voice, Boolean(autoFallback));

    // Save to temporary store
    const audioId = crypto.randomUUID();
    audioStore.set(audioId, {
      id: audioId,
      buffer: result.mp3Buffer,
      mimeType: 'audio/mpeg',
      createdAt: Date.now(),
    });

    // Approximate duration in seconds (based on 128kbps = 16000 bytes/sec)
    const approxDurationSec = Math.round((result.mp3Buffer.length / 16000) * 10) / 10;

    res.json({
      success: true,
      audioUrl: `/api/audio/${audioId}.mp3`,
      audioBase64: `data:audio/mpeg;base64,${result.mp3Buffer.toString('base64')}`,
      format: 'mp3',
      providerUsed: result.providerUsed,
      voiceUsed: result.voiceUsed,
      fallbackTriggered: result.fallbackTriggered,
      fallbackReason: result.fallbackReason,
      durationSeconds: approxDurationSec,
      sizeBytes: result.mp3Buffer.length,
      characterCount: text.length,
    });
  } catch (err: any) {
    console.error('[TTS Generation Error]:', err);
    let errorCode: string = 'UNKNOWN';
    let errorMessage = err.message || 'خطایی در تولید فایل صوتی رخ داد.';

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      errorCode = 'QUOTA_EXCEEDED';
      errorMessage = 'سهمیه سرویس تولید گفتار موقتاً به پایان رسیده است. لطفاً دقایقی دیگر مجدداً تلاش فرمایید.';
    } else if (errorMessage.includes('AUTH_ERROR') || errorMessage.includes('401') || errorMessage.includes('403')) {
      errorCode = 'AUTH_ERROR';
      errorMessage = 'احراز هویت با سرویس با مشکل مواجه شد. لطفاً از فعال بودن کلیدها در تنظیمات مطمئن شوید.';
    } else if (errorMessage.includes('BOTH_FAILED')) {
      errorCode = 'SERVICE_UNAVAILABLE';
      errorMessage = 'سرویس‌های اصلی و پشتیبان هر دو موقتاً در دسترس نیستند. لطفاً کمی بعد امتحان کنید.';
    }

    res.status(500).json({
      success: false,
      errorCode,
      error: errorMessage,
    });
  } finally {
    stopProcessing(ip);
  }
});

// Fast sample preview endpoint for voice card preview button
app.post('/api/tts/sample', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { voiceId } = req.body;

  const rateLimitCheck = checkRateLimit(ip);
  if (!rateLimitCheck.allowed) {
    res.status(429).json({ success: false, error: rateLimitCheck.error });
    return;
  }

  const voice = getVoiceById(voiceId);
  if (!voice) {
    res.status(400).json({ success: false, error: 'صدای انتخاب‌شده معتبر نیست.' });
    return;
  }

  startProcessing(ip);
  try {
    const result = await synthesizeSpeech(voice.sampleText, voice, true);
    const audioId = crypto.randomUUID();
    audioStore.set(audioId, {
      id: audioId,
      buffer: result.mp3Buffer,
      mimeType: 'audio/mpeg',
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      audioUrl: `/api/audio/${audioId}.mp3`,
      audioBase64: `data:audio/mpeg;base64,${result.mp3Buffer.toString('base64')}`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'خطا در تولید نمونه صدا.',
    });
  } finally {
    stopProcessing(ip);
  }
});

// Vite Middleware for Development / Static serving for production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (hasDist) {
    console.log('[Parsa Saberi Server] Serving production build from dist/');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Parsa Saberi Server] Serving dev mode via Vite middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Parsa Saberi TTS Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
