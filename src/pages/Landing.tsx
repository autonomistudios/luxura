/**
 * LuxAura Landing — GSAP ScrollTrigger Pinned Architecture
 * Zero-gap stacked sections. Every animation tied directly to scroll.
 * clip-path wipe · pinSpacing: true · scrub timeline
 */
import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../contexts/AuthContext';

gsap.registerPlugin(ScrollTrigger);

/* ─── Tokens ───────────────────────────────────────────────── */
const T = {
  alabaster : '#FAF9F6',
  charcoal  : '#1C1C1C',
  gold      : '#D4AF37',
  void      : '#080807',
  serif     : 'Cormorant Garamond, serif',
  sans      : 'Inter, sans-serif',
};

/* ─── Nano Banana Pro Prompts ──────────────────────────────── */
const NBP = {
  hero:      'Cinematic fashion editorial · Hasselblad X2D 100C 110mm f/2 · Kodak Vision3 500T · Rembrandt split-light 1200W Profoto B1 45° camera-left · alabaster seamless backdrop · ivory column gown · extreme negative space · grain +22',
  g0:        'Phase One IQ4 150MP 80mm f/2.8 · obsidian double-breasted wool-cashmere overcoat peak lapel · Broncolor overhead 60×80cm softbox key + gridded kicker · charcoal backdrop · shadow ratio 4:1 · grain 15',
  g1:        'Sony A1 85mm f/1.4 GM · ivory raw-silk boxy blazer on form · Broncolor overhead beauty dish + V-flat bounce · seamless warm-white · saturation −12 · grain 8 · thread-count visible',
  g2:        'Leica SL3 90mm Summicron · cognac full-grain leather moto jacket · Profoto D2 1.3m octobox key · amber silk background · lifted orange channel teal shadows · grain +18',
  g3:        'Fujifilm GFX100S II 110mm f/2 · forest-green bouclé overcoat · Elinchrom ELB 500 fill + oak-canopy diffusion · desaturated greens lifted mid-tones · grain +14',
  g4:        'Canon R5 MkII 135mm f/2L · slate technical-fabric structured blazer · brutalist concrete · Profoto A10 fill + tungsten backlight · near-monochrome blue shadow cast silver highlights',
  bBefore:   'iPhone 15 Pro simulation 26mm · overhead 4100K fluorescent salon light · no correction · harsh bilateral catchlights · utility tile background · pores preserved · jpeg compression artifacts · flat unedited reference',
  bAfter:    'Nikon Z9 85mm f/1.2 S · Rembrandt 1200W Broncolor gridded 60cm beauty dish 40° left · butterfly shadow · frequency-separation skin retouching · strand-level hair sharpness specular highlights · warm ivory skin tone deep teal shadow · Vogue editorial crop',
  cta:       'Leica M11 50mm Summilux f/1.4 · creative director back-to-camera facing floor-to-ceiling studio window · city skyline soft bokeh · ambient only · Portra 400 push-process grain +25 · absolute editorial authority',
};

/* ─── Garment data ─────────────────────────────────────────── */
// rawImg = what the user uploads (product shot / flat-lay / hanger)
// img    = what LuxAura renders (editorial output)
const GARMENTS = [
  {
    name: 'The Obsidian Coat', cat: 'Tailored Outerwear', feel: 'Understated authority.',
    bg: '#0E0E0E', light: true, accent: '#6B6762',
    rawImg:  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80&auto=format&fit=crop',
    rawLabel: 'Garment upload · flat-lay',
    img:     'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1000&q=90&auto=format',
    imgPos: 'center 20%', css: 'saturate(0.75) contrast(1.15) brightness(0.82)',
  },
  {
    name: 'The Ivory Blazer', cat: 'Structured Suiting', feel: 'Pristine. Effortless.',
    bg: '#ECEAE3', light: false, accent: '#6E6A60',
    rawImg:  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80&auto=format&fit=crop',
    rawLabel: 'Garment upload · hanger',
    img:     'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1000&q=90&auto=format',
    imgPos: 'center 15%', css: 'saturate(0.6) contrast(1.05) brightness(1.08)',
  },
  {
    name: 'The Cognac Moto', cat: 'Leather Outerwear', feel: 'Raw edge, refined.',
    bg: '#2E1608', light: true, accent: '#C4822A',
    rawImg:  'https://images.unsplash.com/photo-1611042553365-9b101441c135?w=400&q=80&auto=format&fit=crop',
    rawLabel: 'Garment upload · mannequin',
    img:     'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1000&q=90&auto=format',
    imgPos: 'center 20%', css: 'saturate(1.1) contrast(1.12) brightness(0.75)',
  },
  {
    name: 'The Forest Bouclé', cat: 'Textured Outerwear', feel: 'Nature, structured.',
    bg: '#131E12', light: true, accent: '#5E8A58',
    rawImg:  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80&auto=format&fit=crop',
    rawLabel: 'Garment upload · flat-lay',
    img:     'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1000&q=90&auto=format',
    imgPos: 'center top', css: 'saturate(0.85) contrast(1.1) brightness(0.82)',
  },
  {
    name: 'The Slate Technical', cat: 'Contemporary Suiting', feel: 'Power without announcement.',
    bg: '#1A1D22', light: true, accent: '#7A8EA0',
    rawImg:  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80&auto=format&fit=crop',
    rawLabel: 'Garment upload · product photo',
    img:     'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=90&auto=format',
    imgPos: 'center 25%', css: 'saturate(0.45) contrast(1.18) brightness(0.84)',
  },
];

/* ─── Fixed nav ────────────────────────────────────────────── */
function Nav() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.8 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.6rem clamp(2rem,6vw,7rem)',
        background: scrolled ? 'rgba(8,8,7,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        transition: 'background 0.7s ease, backdrop-filter 0.7s ease',
      }}
    >
      <span style={{ fontFamily: T.serif, fontSize: 14, letterSpacing: '0.4em', color: T.alabaster }}>
        LUXAURA
      </span>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <button onClick={() => navigate('/pricing')} style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.38)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Pricing
        </button>
        <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: T.gold, background: 'none', border: `0.5px solid ${T.gold}50`, padding: '0.7rem 1.6rem', cursor: 'pointer' }}>
          {user ? 'Studio →' : 'Enter'}
        </button>
      </div>
    </motion.nav>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN LANDING
   All GSAP timelines live in one useLayoutEffect on the root ref.
   Structure: Hero → Designer → Beautician → CTA
   Each section is exactly 100vh, pinned by ScrollTrigger.
══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate    = useNavigate();
  const rootRef     = useRef<HTMLDivElement>(null);

  /* ── Section refs ── */
  const heroRef       = useRef<HTMLDivElement>(null);
  const designerRef   = useRef<HTMLDivElement>(null);
  const beautyRef     = useRef<HTMLDivElement>(null);
  const ctaRef        = useRef<HTMLDivElement>(null);

  /* ── Designer: bg + text + image per-garment refs ── */
  const designerBgRef   = useRef<HTMLDivElement>(null);
  const garmentImgs     = useRef<(HTMLDivElement | null)[]>([]);
  const garmentTexts    = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Beautician: editorial reveal ── */
  const bAfterRef       = useRef<HTMLDivElement>(null);
  const bLine2Ref       = useRef<HTMLDivElement>(null);
  const bProgressRef    = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      /* ─────────────────────────────────────────────────
         HERO  ·  pinned 200vh
         Content scrubs out over second half of pin.
      ───────────────────────────────────────────────── */
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=200vh',
          pin: true,
          pinSpacing: true,
          scrub: 0.8,
        },
      });
      heroTl
        .to('#hero-copy', { opacity: 0, y: -40, ease: 'power2.in' }, 0.5)
        .to('#hero-img',  { scale: 1.08, ease: 'none' }, 0);

      /* ─────────────────────────────────────────────────
         DESIGNER  ·  pinned 600vh (5 garments × 120vh)
         Timeline drives: bg color · image crossfade · text swap
      ───────────────────────────────────────────────── */
      const numG   = GARMENTS.length;          // 5
      const gStep  = 1 / numG;                 // 0.2 per garment

      const designerTl = gsap.timeline({
        scrollTrigger: {
          trigger: designerRef.current,
          start: 'top top',
          end: '+=1500vh',
          pin: true,
          pinSpacing: true,
          scrub: 2,
          snap: {
            snapTo: 1 / (numG - 1),
            duration: { min: 0.4, max: 1.0 },
            delay: 0.15,
            ease: 'power2.inOut',
          },
        },
      });

      // Start state: garment 0 visible, rest hidden
      gsap.set(garmentImgs.current.slice(1),  { opacity: 0 });
      gsap.set(garmentTexts.current.slice(1), { opacity: 0, y: 24 });

      GARMENTS.forEach((g, i) => {
        const pos = i * gStep; // 0, 0.2, 0.4, 0.6, 0.8

        // Background color swap at each garment boundary
        if (i > 0) {
          designerTl.to(
            designerBgRef.current,
            { backgroundColor: g.bg, duration: gStep * 0.4, ease: 'power1.inOut' },
            pos - gStep * 0.2
          );
        }

        // Fade out previous garment image + text
        if (i > 0) {
          designerTl.to(
            garmentImgs.current[i - 1],
            { opacity: 0, scale: 0.94, duration: gStep * 0.35, ease: 'power2.in' },
            pos - gStep * 0.3
          );
          designerTl.to(
            garmentTexts.current[i - 1],
            { opacity: 0, y: -20, duration: gStep * 0.25, ease: 'power2.in' },
            pos - gStep * 0.3
          );
        }

        // Fade in current garment image + text
        if (i > 0) {
          designerTl.fromTo(
            garmentImgs.current[i],
            { opacity: 0, scale: 1.04 },
            { opacity: 1, scale: 1, duration: gStep * 0.5, ease: 'power2.out' },
            pos
          );
          designerTl.fromTo(
            garmentTexts.current[i],
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: gStep * 0.4, ease: 'power2.out' },
            pos + 0.01
          );
        }
      });

      /* ─────────────────────────────────────────────────
         BEAUTICIAN · Paris Editorial Reveal · 600vh
         Scan line sweeps editorial in. Copy arrives at end.
      ───────────────────────────────────────────────── */
      const beautyTl = gsap.timeline({
        scrollTrigger: {
          trigger: beautyRef.current,
          start: 'top top',
          end: '+=600vh',
          pin: true,
          pinSpacing: true,
          scrub: 1,
        },
      });

      // Editorial image: blown-out → cinematic via scan line
      gsap.set(bAfterRef.current, { filter: 'blur(36px) saturate(0) brightness(2.0)' });
      beautyTl.fromTo(
        bAfterRef.current,
        { clipPath: 'inset(0% 100% 0% 0%)', filter: 'blur(36px) saturate(0) brightness(2.0)' },
        { clipPath: 'inset(0% 0% 0% 0%)',   filter: 'blur(0px) saturate(1.12) brightness(0.85)',
          duration: 0.60, ease: 'power2.inOut' },
        0.05
      );

      // Scan line sweeps with the reveal
      beautyTl.fromTo(bLine2Ref.current,
        { left: '-2px', opacity: 1 },
        { left: '100%', duration: 0.60, ease: 'power2.inOut' },
        0.05
      );
      beautyTl.to(bLine2Ref.current, { opacity: 0, duration: 0.03 }, 0.65);

      // Progress bar fills with scan
      beautyTl.fromTo(bProgressRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.60, ease: 'power2.inOut' },
        0.05
      );

      // Narrative copy arrives after reveal
      beautyTl.fromTo('#beauty-copy',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' },
        0.75
      );

      /* ─────────────────────────────────────────────────
         CTA entrance  ·  not pinned
      ───────────────────────────────────────────────── */
      gsap.fromTo(
        '#cta-content',
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

    }, rootRef);

    return () => ctx.revert();
  }, []);

  /* ── Shared inline styles ── */
  const fill: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

  return (
    <div ref={rootRef} style={{ background: T.void, overflowX: 'hidden' }}>
      <Nav />

      {/* ══ HERO ════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{ height: '100vh', position: 'relative', overflow: 'hidden', background: T.void }}
      >
        {/* Parallax bg image */}
        <div id="hero-img" style={{ ...fill, overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1800&q=80&auto=format"
            alt={NBP.hero}
            style={{ ...fill, filter: 'saturate(0.5) brightness(0.35)', transformOrigin: 'center center' }}
          />
        </div>
        {/* Gold ambient bloom */}
        <div style={{ ...fill, background: `radial-gradient(ellipse 55% 45% at 50% 60%, ${T.gold}0D, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Hero copy */}
        <div
          id="hero-copy"
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '0 clamp(1.5rem,8vw,10rem)',
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.4 }}
            style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.44em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.3)', marginBottom: '1.6rem' }}
          >
            The AI Fashion Engine · LuxAura Studio
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 36, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: T.serif,
              fontSize: 'clamp(5rem,14vw,15rem)',
              letterSpacing: '-0.025em', lineHeight: 0.87,
              color: T.alabaster, maxWidth: '11ch',
            }}
          >
            Dressed in<br />
            <em style={{ color: T.gold }}>confidence.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 1.3 }}
            style={{ fontFamily: T.sans, fontSize: 12, letterSpacing: '0.07em', color: 'rgba(250,249,246,0.38)', maxWidth: 360, lineHeight: 1.95, marginTop: '2.5rem' }}
          >
            One phone shot. Every editorial lighting scenario.<br />
            Not a filter — a complete reconstruction.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.9 }}
            style={{ display: 'flex', gap: '1rem', marginTop: '3.5rem', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <button onClick={() => navigate('/login')} style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', background: T.gold, color: T.void, border: 'none', padding: '1.1rem 2.8rem', cursor: 'pointer', fontWeight: 500 }}>
              Enter the Atelier
            </button>
            <button onClick={() => navigate('/pricing')} style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', background: 'none', color: 'rgba(250,249,246,0.36)', border: '0.5px solid rgba(250,249,246,0.16)', padding: '1.1rem 2.8rem', cursor: 'pointer' }}>
              View Pricing
            </button>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            style={{ position: 'absolute', bottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}
          >
            <p style={{ fontFamily: T.sans, fontSize: 7, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.15)' }}>Scroll</p>
            <motion.div
              animate={{ scaleY: [1, 1.9, 1], opacity: [0.25, 0.8, 0.25] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 1, height: 36, background: `linear-gradient(to bottom, ${T.gold}, transparent)` }}
            />
          </motion.div>
        </div>
      </section>

      {/* ══ DESIGNER ════════════════════════════════════════ */}
      <section
        ref={designerRef}
        style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}
      >
        {/* Animated background — GSAP drives backgroundColor */}
        <div
          ref={designerBgRef}
          style={{ ...fill, backgroundColor: GARMENTS[0].bg, transition: 'none' }}
        />

        {/* Garment images — stacked, crossfaded by GSAP */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '100%', overflow: 'hidden' }}>
          {GARMENTS.map((g, i) => (
            <div
              key={i}
              ref={el => { garmentImgs.current[i] = el; }}
              style={{ ...fill, willChange: 'opacity, transform' }}
            >
              {/* ── Editorial output (full panel) ── */}
              <img src={g.img} alt={g.name} style={{ ...fill, filter: g.css, objectPosition: g.imgPos || 'center center' }} />
              {/* Gradient bleed into text area */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(14,14,14,0.85) 0%, rgba(14,14,14,0.2) 40%, transparent 65%)' }} />

              {/* ── SOURCE → OUTPUT proof strip ── */}
              <div style={{
                position: 'absolute', bottom: '2.8rem', right: '2.4rem',
                display: 'flex', alignItems: 'flex-end', gap: '0.9rem',
                zIndex: 10,
              }}>
                {/* Raw upload thumbnail */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 88, height: 110,
                    border: '0.5px solid rgba(250,249,246,0.18)',
                    overflow: 'hidden',
                    background: '#0a0a0a',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}>
                    <img
                      src={g.rawImg}
                      alt="source upload"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.3) brightness(0.9) contrast(1.05)' }}
                    />
                    {/* Slight vignette on raw photo to look unedited */}
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />
                  </div>
                  {/* SOURCE label */}
                  <p style={{
                    position: 'absolute', bottom: '-1.3rem', left: 0, right: 0,
                    fontFamily: T.sans, fontSize: 6, letterSpacing: '0.3em',
                    textTransform: 'uppercase', textAlign: 'center',
                    color: 'rgba(250,249,246,0.25)',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                  }}>
                    {g.rawLabel}
                  </p>
                </div>

                {/* Arrow connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', paddingBottom: '1.8rem' }}>
                  <div style={{ width: 32, height: 0.5, background: `linear-gradient(to right, rgba(212,175,55,0.4), ${T.gold})` }} />
                  <span style={{ fontFamily: T.sans, fontSize: 9, color: T.gold, lineHeight: 1, marginTop: '-0.2rem' }}>›</span>
                  <p style={{ fontFamily: T.sans, fontSize: 5.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: `${T.gold}70`, marginTop: '0.15rem' }}>LuxAura</p>
                </div>

                {/* Output badge (corner of the editorial) */}
                <div style={{
                  width: 88, height: 110,
                  border: `0.5px solid ${T.gold}55`,
                  overflow: 'hidden',
                  background: '#0a0a0a',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 24px ${T.gold}18`,
                  position: 'relative',
                }}>
                  <img
                    src={g.img}
                    alt="LuxAura output"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: g.imgPos || 'center', filter: g.css }}
                  />
                  {/* Gold pulse dot */}
                  <motion.div
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', width: 4, height: 4, borderRadius: '50%', background: T.gold }}
                  />
                </div>
              </div>

              {/* Output label top-right */}
              <div style={{
                position: 'absolute', top: '2.2rem', right: '2.2rem',
                background: `${T.gold}12`, backdropFilter: 'blur(16px)',
                border: `0.5px solid ${T.gold}40`,
                padding: '0.5rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                zIndex: 10,
              }}>
                <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: 4, height: 4, borderRadius: '50%', background: T.gold }} />
                <span style={{ fontFamily: T.sans, fontSize: 6.5, letterSpacing: '0.3em', textTransform: 'uppercase', color: T.gold }}>LuxAura Output</span>
              </div>
            </div>
          ))}
        </div>

        {/* Ghost large index number */}
        <div style={{
          position: 'absolute', bottom: '-2rem', right: '3rem',
          fontFamily: T.serif, fontSize: '22vw', lineHeight: 1,
          color: 'rgba(255,255,255,0.03)', userSelect: 'none', pointerEvents: 'none',
        }}>
          {String(GARMENTS.findIndex((_, i) => i === 0) + 1).padStart(2, '0')}
        </div>

        {/* Text panels — stacked, crossfaded by GSAP */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '48%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 clamp(2rem,8vw,8rem)' }}>
          {GARMENTS.map((g, i) => (
            <div
              key={i}
              ref={el => { garmentTexts.current[i] = el; }}
              style={{ position: 'absolute', left: 'clamp(2rem,8vw,8rem)', right: '2rem', willChange: 'opacity, transform' }}
            >
              <p style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.42em', textTransform: 'uppercase', color: g.light ? 'rgba(250,249,246,0.3)' : 'rgba(28,28,28,0.3)', marginBottom: '1.5rem' }}>
                Upload your garment · LuxAura renders the shoot
              </p>
              <h2 style={{ fontFamily: T.serif, fontSize: 'clamp(3rem,5.5vw,6.5rem)', lineHeight: 0.9, letterSpacing: '-0.02em', color: g.light ? T.alabaster : T.charcoal }}>
                {g.name}
              </h2>
              <div style={{ width: 28, height: 1, background: T.gold, margin: '2rem 0' }} />
              <p style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: g.accent, marginBottom: '1.25rem' }}>
                {g.cat}
              </p>
              <p style={{ fontFamily: T.serif, fontSize: 'clamp(1.2rem,2vw,2rem)', fontStyle: 'italic', color: g.light ? 'rgba(250,249,246,0.5)' : 'rgba(28,28,28,0.45)' }}>
                "{g.feel}"
              </p>
              {/* Garment index */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '3rem', alignItems: 'center' }}>
                {GARMENTS.map((_, j) => (
                  <div key={j} style={{ width: j === i ? 24 : 5, height: 1, background: j === i ? T.gold : (g.light ? 'rgba(250,249,246,0.2)' : 'rgba(28,28,28,0.2)'), borderRadius: 2, transition: 'none' }} />
                ))}
                <span style={{ fontFamily: T.sans, fontSize: 7, letterSpacing: '0.3em', marginLeft: '0.5rem', color: g.light ? 'rgba(250,249,246,0.28)' : 'rgba(28,28,28,0.3)' }}>
                  {String(i + 1).padStart(2, '0')} / {String(GARMENTS.length).padStart(2, '0')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ BEAUTICIAN — Raw Upload → Editorial Reveal ═══════════ */}
      <section
        ref={beautyRef}
        style={{ height: '100vh', position: 'relative', overflow: 'hidden', background: T.void }}
      >
        {/* ── BEFORE: raw phone photo (always visible beneath the reveal) ── */}
        <div style={{ ...fill, background: '#0d0c0b' }}>
          <img
            src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1800&q=75&auto=format"
            alt="raw phone upload"
            style={{
              ...fill,
              filter: 'saturate(0.15) contrast(0.9) brightness(0.72)',
              objectPosition: 'center 18%',
            }}
          />
          {/* Simulated phone-shot degradation: harsh vignette + noise overlay */}
          <div style={{ ...fill, background: 'radial-gradient(ellipse 70% 80% at 50% 40%, transparent 30%, rgba(0,0,0,0.62) 100%)' }} />
          {/* "Before" label */}
          <div style={{
            position: 'absolute', top: '2.2rem', left: '2.2rem',
            background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            padding: '0.5rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.55rem',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontFamily: T.sans, fontSize: 7, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Phone upload · unedited</span>
          </div>
        </div>

        {/* ── AFTER: LuxAura editorial output — GSAP clip-path reveal ── */}
        <div
          ref={bAfterRef}
          style={{ ...fill, clipPath: 'inset(0% 100% 0% 0%)', willChange: 'clip-path, filter' }}
        >
          <img
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1800&q=80&auto=format"
            alt={NBP.bAfter}
            style={{ ...fill, filter: 'saturate(1.1) contrast(1.06) brightness(0.85)', objectPosition: 'center 20%' }}
          />
          <div style={{ ...fill, background: 'linear-gradient(to top, rgba(8,8,7,0.78) 0%, rgba(8,8,7,0.12) 45%, transparent 70%)' }} />
          {/* LuxAura output badge */}
          <div style={{ position: 'absolute', top: '2.2rem', right: '2.2rem', background: `${T.gold}15`, backdropFilter: 'blur(16px)', border: `0.5px solid ${T.gold}55`, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: T.gold }} />
            <span style={{ fontFamily: T.sans, fontSize: 7, letterSpacing: '0.3em', textTransform: 'uppercase', color: T.gold }}>LuxAura Output · Paris</span>
          </div>
        </div>

        {/* Scan line sweeps with the reveal */}
        <div
          ref={bLine2Ref}
          style={{
            position: 'absolute', top: 0, bottom: 0, left: '-2px',
            width: 2, zIndex: 16, pointerEvents: 'none',
            background: `linear-gradient(to bottom, transparent 0%, #fff 12%, ${T.gold} 50%, #fff 88%, transparent 100%)`,
            boxShadow: `0 0 32px #ffffff80, 0 0 80px ${T.gold}70, 0 0 160px ${T.gold}30`,
            willChange: 'left, opacity',
          }}
        />

        {/* Module label */}
        <div style={{ position: 'absolute', top: '2.2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <p style={{ fontFamily: T.sans, fontSize: 7, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.18)', textAlign: 'center', whiteSpace: 'nowrap' }}>
            Module 03 — The Beautician
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'rgba(212,175,55,0.12)', zIndex: 25 }}>
          <div
            ref={bProgressRef}
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '100%', transformOrigin: 'left center', transform: 'scaleX(0)',
              background: `linear-gradient(to right, ${T.gold}80, ${T.gold}, ${T.gold}80)`,
              boxShadow: `0 0 12px ${T.gold}60`,
            }}
          />
        </div>

        {/* Narrative copy */}
        <div
          id="beauty-copy"
          style={{
            position: 'absolute', bottom: '3.5rem',
            left: '50%', transform: 'translateX(-50%)',
            width: 'min(620px, 90vw)', textAlign: 'center',
            opacity: 0, zIndex: 20,
          }}
        >
          <h2 style={{ fontFamily: T.serif, fontSize: 'clamp(2.8rem,5.5vw,6.5rem)', lineHeight: 0.9, letterSpacing: '-0.02em', color: T.alabaster }}>
            One phone shot.<br />
            <em style={{ color: T.gold }}>Every editorial<br />in existence.</em>
          </h2>
          <div style={{ width: 28, height: 1, background: T.gold, margin: '1.8rem auto' }} />
          <p style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: '0.06em', lineHeight: 1.95, color: 'rgba(250,249,246,0.36)' }}>
            Upload your garment, your look, your hairstyle — anything.
            LuxAura places it into a full editorial photoshoot.
            Paris. Studio. Runway. Your call.
          </p>
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        style={{ height: '100vh', position: 'relative', overflow: 'hidden', background: T.void, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
      >
        <img
          src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=70&auto=format"
          alt={NBP.cta}
          style={{ ...fill, filter: 'saturate(0.35) brightness(0.18)', objectPosition: 'center 30%' }}
        />
        <div style={{ ...fill, background: `radial-gradient(ellipse 55% 45% at 50% 50%, ${T.gold}09, transparent 65%)`, pointerEvents: 'none' }} />

        <div id="cta-content" style={{ position: 'relative', zIndex: 1, padding: '0 clamp(2rem,8vw,8rem)', opacity: 0 }}>
          <p style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.28)', marginBottom: '1.5rem' }}>The Atelier Is Open</p>
          <h2 style={{ fontFamily: T.serif, fontSize: 'clamp(4rem,11vw,13rem)', lineHeight: 0.88, letterSpacing: '-0.025em', color: T.alabaster, maxWidth: '13ch', margin: '0 auto' }}>
            Your vision<br /><em style={{ color: T.gold }}>deserves<br />this.</em>
          </h2>
          <p style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: '0.06em', lineHeight: 1.9, color: 'rgba(250,249,246,0.35)', maxWidth: 380, margin: '2.5rem auto 0' }}>
            Designers. Stylists. Creative directors.<br />Your camera phone just became a production studio.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', background: T.gold, color: T.void, border: 'none', padding: '1.2rem 3rem', cursor: 'pointer', fontWeight: 500 }}>
              Enter the Atelier
            </button>
            <button onClick={() => navigate('/pricing')} style={{ fontFamily: T.sans, fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', background: 'none', color: 'rgba(250,249,246,0.36)', border: '0.5px solid rgba(250,249,246,0.15)', padding: '1.2rem 3rem', cursor: 'pointer' }}>
              View Tiers
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.4rem clamp(2rem,6vw,6rem)', borderTop: '0.5px solid rgba(250,249,246,0.05)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: T.sans, fontSize: 7, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.15)' }}>LuxAura Creation Studio — {new Date().getFullYear()}</span>
          <span style={{ fontFamily: T.sans, fontSize: 7, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.1)' }}>Powered by Vertex AI</span>
        </div>
      </section>
    </div>
  );
}
