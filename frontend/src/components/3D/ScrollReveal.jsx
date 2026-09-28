import React, { useEffect, useRef, useState } from 'react';

/**
 * Lightweight scroll reveal animation container
 * Fades, slides, and subtly scales elements when they enter the viewport using IntersectionObserver.
 */
export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
  direction = 'up' // 'up' | 'down' | 'left' | 'right' | 'none'
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: Math.min(threshold, 0.1), rootMargin: '0px 0px -20px 0px' }
    );

    const currentTarget = domRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    // Safety fallback: ensure content is revealed even if observer is delayed
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [threshold]);

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0) scale(1)';
    switch (direction) {
      case 'up':
      case 'from-bottom':
        return 'translate3d(0, 24px, 0) scale(0.98)';
      case 'down':
      case 'from-top':
        return 'translate3d(0, -24px, 0) scale(0.98)';
      case 'left':
      case 'from-left':
        return 'translate3d(-24px, 0, 0) scale(0.98)';
      case 'right':
      case 'from-right':
        return 'translate3d(24px, 0, 0) scale(0.98)';
      default:
        return 'scale(0.98)';
    }
  };

  return (
    <div
      ref={domRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
      className={className}
    >
      {children}
    </div>
  );
}
