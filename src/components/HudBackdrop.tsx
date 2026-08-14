'use client';

import { useEffect, useRef } from 'react';

export default function HudBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


    const monoSource = document.querySelector('.mono-data') || document.body;
    const monoFamily = getComputedStyle(monoSource).fontFamily.split(',')[0].trim();
    const FONT = `11px ${monoFamily}, monospace`;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let nextLineAt = 0;

    type Line = { x: number; y: number; text: string; speed: number; alpha: number };
    const lines: Line[] = [];

    const GLYPHS = '0123456789ABCDEF';
    const hex = (len: number) =>
      Array.from({ length: len }, () => GLYPHS[Math.floor(Math.random() * 16)]).join('');
    const pad = (n: number, l = 2) => String(n).padStart(l, '0');

    const randLine = () => {
      const t = new Date();
      const ts = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
      const kinds = [
        `GET /api/markers 200 ${Math.floor(Math.random() * 900) + 20}ms`,
        `scan ${hex(8)}.${hex(4)} → ${Math.floor(Math.random() * 90) + 1} records`,
        `src ${hex(12)} · verified ${Math.random() < 0.5 ? '✓' : 'ok'}`,
        `POST /api/corrections 202 ${Math.floor(Math.random() * 300) + 10}ms`,
        `db query ${hex(6)} [${Math.floor(Math.random() * 999)} rows] ${Math.floor(Math.random() * 40)}ms`,
        `cache hit ${hex(4)} ttl=${Math.floor(Math.random() * 600) + 60}s`,
        `ingest ${hex(10)} → ${Math.floor(Math.random() * 50) + 1} entities`,
        `cron sync ${hex(6)} next +${Math.floor(Math.random() * 15) + 5}m`,
        `watchdog ${hex(4)} sector ${hex(2)} clean`,
      ];
      return `[${ts}] ${kinds[Math.floor(Math.random() * kinds.length)]} · 0x${hex(4)}`;
    };

    const spawn = (x: number, y: number): Line => ({
      x,
      y,
      text: randLine(),
      speed: 10 + Math.random() * 24,
      alpha: 0.3 + Math.random() * 0.35,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);


    const seedCount = Math.max(5, Math.round(h / 80));
    for (let i = 0; i < seedCount; i++) {
      lines.push(spawn(Math.random() * Math.max(w, 1), 16 + Math.random() * Math.max(h - 32, 1)));
    }
    nextLineAt = performance.now() + 900;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.12);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;

      for (const ln of lines) {
        ln.x -= ln.speed * dt;

        if (ln.x + ctx.measureText(ln.text).width < -20) {
          Object.assign(ln, spawn(w + 60 + Math.random() * 240, 16 + Math.random() * Math.max(h - 32, 1)));
        }
        const tsEnd = ln.text.indexOf(']') + 1;
        ctx.globalAlpha = ln.alpha;
        ctx.fillStyle = 'rgba(32, 184, 200, 0.95)';
        ctx.fillText(ln.text.slice(0, tsEnd), ln.x, ln.y);
        ctx.fillStyle = 'rgba(148, 184, 214, 0.9)';
        const tsW = ctx.measureText(ln.text.slice(0, tsEnd)).width;
        ctx.fillText(ln.text.slice(tsEnd), ln.x + tsW, ln.y);
      }
      ctx.globalAlpha = 1;


      if (now > nextLineAt && lines.length < h / 45) {
        lines.push(spawn(w + 40, 16 + Math.random() * Math.max(h - 32, 1)));
        nextLineAt = now + 800 + Math.random() * 1800;
      }

      raf = requestAnimationFrame(frame);
    };


    last = performance.now();
    frame(last);
    if (reduced) {
      cancelAnimationFrame(raf);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-10 blur-[0.5px]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
