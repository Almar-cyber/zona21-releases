import { useEffect, useRef, useState } from 'react';

export default function GalaxyBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const starCount = 240;
    const stars = Array.from({ length: starCount }, () => {
      const size = Math.random() < 0.08 ? 1.8 : 1.1;
      return {
        x: Math.random(),
        y: Math.random(),
        r: size * (0.4 + Math.random() * 0.8),
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 1.2,
        a: 0.25 + Math.random() * 0.75
      };
    });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      // Only continue animation if visible
      if (!isVisible) {
        return;
      }

      const time = t / 1000;

      ctx.clearRect(0, 0, w, h);

      const base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, '#060010');
      base.addColorStop(0.6, '#070017');
      base.addColorStop(1, '#04000C');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.62;
      const cy = h * 0.38;
      const nebula = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.85);
      nebula.addColorStop(0, 'rgba(130, 80, 255, 0.12)');
      nebula.addColorStop(0.35, 'rgba(80, 200, 255, 0.05)');
      nebula.addColorStop(0.7, 'rgba(255, 80, 180, 0.03)');
      nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, w, h);

      const cx2 = w * 0.28;
      const cy2 = h * 0.72;
      const nebula2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, Math.max(w, h) * 0.75);
      nebula2.addColorStop(0, 'rgba(70, 120, 255, 0.07)');
      nebula2.addColorStop(0.5, 'rgba(30, 140, 255, 0.03)');
      nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const s of stars) {
        const x = s.x * w;
        const y = s.y * h;
        const tw = 0.55 + 0.45 * Math.sin(time * s.speed + s.phase);
        const alpha = s.a * tw;

        ctx.fillStyle = `rgba(240, 240, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (s.r > 1.2) {
          ctx.strokeStyle = `rgba(180, 190, 255, ${alpha * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, s.r + 1.8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();

      raf = window.requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement ?? canvas);

    // IntersectionObserver to pause animation when not visible
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);

        // Restart animation when visible
        if (entry.isIntersecting && raf === 0) {
          raf = window.requestAnimationFrame(draw);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    resize();
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [isVisible]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className || ''}`} aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(900px 600px at 65% 35%, rgba(140, 90, 255, 0.08), rgba(0,0,0,0) 60%), radial-gradient(700px 520px at 30% 70%, rgba(60, 170, 255, 0.05), rgba(0,0,0,0) 62%)',
          mixBlendMode: 'multiply'
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1200px 800px at 50% 50%, rgba(255,255,255,0.03), rgba(0,0,0,0) 65%)',
          mixBlendMode: 'multiply'
        }}
      />
    </div>
  );
}
