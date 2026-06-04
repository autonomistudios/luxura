import { useEffect, useRef, useState } from 'react';

/**
 * LuxCursor — Bespoke gold cursor system
 * - Small gold dot that follows mouse precisely
 * - Larger translucent ring that lags behind (lerp)
 * - Ring expands + fills on hover over interactive elements
 * - Hidden on mobile (touch devices)
 */
export default function LuxCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse   = useRef({ x: -100, y: -100 });
  const ring    = useRef({ x: -100, y: -100 });
  const raf     = useRef<number>(0);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    // Don't run on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const onEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], [onclick], .cursor-pointer, select')) {
        setHovering(true);
      }
    };

    const onLeave = () => setHovering(false);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout',  onLeave);

    const animate = () => {
      const lerp = 0.12;
      ring.current.x += (mouse.current.x - ring.current.x) * lerp;
      ring.current.y += (mouse.current.y - ring.current.y) * lerp;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x}px, ${mouse.current.y}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout',  onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Dot — snaps to exact mouse position */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ willChange: 'transform' }}
      >
        <div
          className="rounded-full bg-[#C5A253] transition-all duration-200"
          style={{
            width:  hovering ? 6  : 4,
            height: hovering ? 6  : 4,
            marginLeft: hovering ? -3 : -2,
            marginTop:  hovering ? -3 : -2,
            opacity: 1,
          }}
        />
      </div>

      {/* Ring — lags behind with lerp */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{ willChange: 'transform' }}
      >
        <div
          className="rounded-full border border-[#C5A253] transition-all duration-300"
          style={{
            width:      hovering ? 44  : 28,
            height:     hovering ? 44  : 28,
            marginLeft: hovering ? -22 : -14,
            marginTop:  hovering ? -22 : -14,
            opacity:    hovering ? 0.6 : 0.3,
            background: hovering ? 'rgba(197,162,83,0.06)' : 'transparent',
          }}
        />
      </div>
    </>
  );
}
