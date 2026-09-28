import React, { useState, useRef } from 'react';

/**
 * Interactive 3D tilt container for cards
 * Provides subtle perspective tilt, elevation, and dynamic radial lighting on mouse movement.
 */
export default function Card3DTilt({ 
  children, 
  className = '', 
  maxTilt = 7, 
  glowColor = 'rgba(16, 185, 129, 0.15)',
  scale = 1.02
}) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px) scale3d(${scale}, ${scale}, ${scale})`
    );

    setGlowPos({
      x: ((x / rect.width) * 100).toFixed(1),
      y: ((y / rect.height) * 100).toFixed(1),
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)');
    setGlowPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* Dynamic Cursor Light Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 z-10"
        style={{
          opacity: glowPos.opacity,
          background: `radial-gradient(400px circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
}
