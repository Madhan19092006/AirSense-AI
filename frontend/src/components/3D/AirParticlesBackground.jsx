import React, { useEffect, useRef } from 'react';

/**
 * Lightweight, high-performance ambient air particles canvas
 * Reacts subtly to cursor movement and represents clean vs polluted atmospheric air nodes.
 */
export default function AirParticlesBackground({ 
  density = 'normal', 
  interactive = true,
  opacity = 0.6,
  pollutionMode = false 
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle count scaled for performance
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 25 : density === 'high' ? 65 : 40;

    // Color palettes: Clean air (emerald/cyan) vs Polluted (amber/rose)
    const cleanColors = [
      'rgba(16, 185, 129, ', // emerald
      'rgba(6, 182, 212, ',  // cyan
      'rgba(20, 184, 166, ', // teal
    ];
    const pollutedColors = [
      'rgba(245, 158, 11, ', // amber
      'rgba(239, 68, 68, ',  // rose
      'rgba(16, 185, 129, ', // mixed clean
    ];

    const colors = pollutionMode ? pollutedColors : cleanColors;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2.2 + 0.8,
      baseAlpha: Math.random() * 0.5 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      pulseVal: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Mouse coordinates for subtle interactive reaction
    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        // Pulse alpha
        p.pulseVal += p.pulseSpeed;
        const currentAlpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.pulseVal)) * opacity;

        // Interactive mouse gentle push
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 18000 && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 134) * 0.8;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;

        // Wrap around boundaries
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw particle with soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentAlpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${p.color}0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw subtle connecting lines between nearby particles for constellation / data mesh effect
      if (!isMobile) {
        ctx.lineWidth = 0.5;
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const pi = particles[i];
            const pj = particles[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < 6400) {
              const lineAlpha = (1 - Math.sqrt(dSq) / 80) * 0.15 * opacity;
              ctx.strokeStyle = `rgba(16, 185, 129, ${lineAlpha})`;
              ctx.beginPath();
              ctx.moveTo(pi.x, pi.y);
              ctx.lineTo(pj.x, pj.y);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [density, interactive, opacity, pollutionMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
