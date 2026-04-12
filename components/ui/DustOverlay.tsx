'use client';

import { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: number;
}

// ===== ほこりオーバーレイ =====
// カーソルを動かすと砂ぼこりが舞い上がる演出（2Dキャンバス）
export const DustOverlay = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);

  const spawnParticles = useCallback((cx: number, cy: number, speed: number) => {
    const count = Math.min(Math.floor(speed * 2), 40);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const force = 0.3 + Math.random() * speed * 0.1;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * force + (Math.random() - 0.5) * 0.3,
        vy: -Math.abs(Math.sin(angle) * force) - Math.random() * 0.8,
        size: 0.3 + Math.random() * 0.7,
        alpha: 0.2 + Math.random() * 0.35,
        decay: 0.003 + Math.random() * 0.006,
        color: 130 + Math.floor(Math.random() * 55),
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ほこりレイヤー用のオフスクリーンキャンバス（一度だけ描画）
    const dustCanvas = document.createElement('canvas');
    dustCanvasRef.current = dustCanvas;

    const initDust = (w: number, h: number) => {
      dustCanvas.width = w;
      dustCanvas.height = h;
      const dctx = dustCanvas.getContext('2d');
      if (!dctx) return;

      // 極小の砂粒を大量にピクセル単位で打つ（1px単位の細かい砂）
      const imgData = dctx.createImageData(w, h);
      const d = imgData.data;
      // 画面の約40%のピクセルに砂粒を配置
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() > 0.40) continue;
        const brightness = 115 + Math.floor(Math.random() * 55);
        d[i] = brightness;
        d[i + 1] = brightness - 10;
        d[i + 2] = brightness - 22;
        d[i + 3] = 4 + Math.floor(Math.random() * 14); // alpha: 4〜17 (とても薄い)
      }
      dctx.putImageData(imgData, 0, 0);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDust(canvas.width, canvas.height);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = t.clientX;
      mouseRef.current.y = t.clientY;
    };

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const ddx = mx - mouseRef.current.prevX;
      const ddy = my - mouseRef.current.prevY;
      const speed = Math.sqrt(ddx * ddx + ddy * ddy);

      ctx.clearRect(0, 0, w, h);

      // ほこりレイヤーをそのまま描画
      if (dustCanvasRef.current) {
        ctx.drawImage(dustCanvasRef.current, 0, 0);
      }

      // カーソル周辺のほこりを消す（destination-outで円形に切り抜く）
      if (mx >= 0 && my >= 0 && dustCanvasRef.current) {
        const dctx = dustCanvasRef.current.getContext('2d');
        if (dctx) {
          const radius = 35 + speed * 0.4;
          dctx.save();
          dctx.globalCompositeOperation = 'destination-out';
          const grad = dctx.createRadialGradient(mx, my, 0, mx, my, radius);
          grad.addColorStop(0, 'rgba(0,0,0,0.15)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          dctx.fillStyle = grad;
          dctx.beginPath();
          dctx.arc(mx, my, radius, 0, Math.PI * 2);
          dctx.fill();
          dctx.restore();
        }

        // パーティクル発生
        if (speed > 3) {
          spawnParticles(mx, my, speed);
        }
      }

      // 舞い上がるパーティクル描画
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.015;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.color - 12}, ${p.color - 25}, ${p.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 25,
      }}
    />
  );
};
