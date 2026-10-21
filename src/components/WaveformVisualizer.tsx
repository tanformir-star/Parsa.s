import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  isGenerating?: boolean;
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  isGenerating = false,
  barCount = 36,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const barWidth = width / barCount;
      const gap = 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;

        if (isPlaying) {
          // Dynamic sine wave modulation
          const sin1 = Math.sin((i / barCount) * Math.PI * 4 + phase);
          const sin2 = Math.cos((i / barCount) * Math.PI * 2 - phase * 1.5);
          const rawAmp = Math.abs(sin1 * 0.6 + sin2 * 0.4);
          barHeight = Math.max(4, rawAmp * (height * 0.85));
        } else if (isGenerating) {
          // Sweeping wave during generation
          const wave = Math.sin((i / barCount) * Math.PI * 6 + phase * 2);
          barHeight = Math.max(4, Math.abs(wave) * (height * 0.65));
        } else {
          // Subtle idle resting shape
          const idleWave = Math.sin((i / barCount) * Math.PI);
          barHeight = Math.max(3, idleWave * 12);
        }

        const x = i * barWidth + gap / 2;
        const actualWidth = Math.max(2, barWidth - gap);
        const y = centerY - barHeight / 2;

        // Gradient for bars (cyan to electric blue)
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, '#2563eb');
        } else if (isGenerating) {
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(1, '#06b6d4');
        } else {
          gradient.addColorStop(0, '#334155');
          gradient.addColorStop(1, '#1e293b');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Rounded bar caps
        const radius = Math.min(actualWidth / 2, barHeight / 2);
        ctx.roundRect(x, y, actualWidth, barHeight, radius);
        ctx.fill();
      }

      phase += isPlaying ? 0.08 : isGenerating ? 0.12 : 0.02;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isGenerating, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={56}
      className="w-full h-14 rounded-lg bg-slate-950/40 border border-slate-800/40"
    />
  );
};
