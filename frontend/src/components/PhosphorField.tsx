'use client';

import { useEffect, useRef } from 'react';

// Generative background art: a fluid abstract phosphor field rendered on a 2D
// canvas. Slow drifting wave interference plus faint travelling motes evoke an
// oscilloscope lab at rest. It intensifies (energy) while a projection forms.
export default function PhosphorField({ energy = 0 }: { energy?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const energyRef = useRef(energy);
  energyRef.current = energy;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const motes = Array.from({ length: 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00035,
      ph: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const drawWaves = (t: number, e: number) => {
      const lines = 5;
      for (let i = 0; i < lines; i++) {
        const amp = (10 + i * 7) * (1 + e * 1.4);
        const yBase = h * (0.22 + i * 0.14);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y =
            yBase +
            Math.sin(x * 0.006 + t * 0.0006 + i) * amp +
            Math.sin(x * 0.013 - t * 0.0009 + i * 1.7) * amp * 0.4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(102, 255, 194, ${0.04 + e * 0.06 + i * 0.004})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const render = (t: number) => {
      const e = energyRef.current;
      ctx.clearRect(0, 0, w, h);

      // soft central bloom
      const cx = w * 0.5;
      const cy = h * 0.42;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
      g.addColorStop(0, `rgba(102, 255, 194, ${0.05 + e * 0.08})`);
      g.addColorStop(1, 'rgba(102, 255, 194, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      drawWaves(t, e);

      for (const m of motes) {
        m.x += m.vx * (1 + e * 2);
        m.y += m.vy * (1 + e * 2);
        if (m.x < 0) m.x = 1;
        if (m.x > 1) m.x = 0;
        if (m.y < 0) m.y = 1;
        if (m.y > 1) m.y = 0;
        const tw = 0.5 + 0.5 * Math.sin(t * 0.002 + m.ph);
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(102, 255, 194, ${(0.1 + tw * 0.22) * (0.6 + e)})`;
        ctx.fill();
      }

      if (!reduce) raf = requestAnimationFrame(render);
    };

    if (reduce) {
      render(0);
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
