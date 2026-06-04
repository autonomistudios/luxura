/**
 * Atelier OS — motion engine
 * Apple spring physics + the editorial expo-out ease, expressed as reusable
 * Framer Motion configs. Import these instead of hand-tuning transitions per
 * component so motion feels coherent across the whole product.
 */
import type { Transition, Variants } from 'framer-motion';

/* — Spring presets (Apple-style) ─────────────────────────────────────────── */
export const spring = {
  snappy: { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 },
  gentle: { type: 'spring', stiffness: 220, damping: 30, mass: 1 },
  soft:   { type: 'spring', stiffness: 140, damping: 26, mass: 1 },
} satisfies Record<string, Transition>;

/* — Bezier eases (mirror tokens.css) ─────────────────────────────────────── */
export const ease = {
  editorial: [0.16, 1, 0.3, 1],
  entrance:  [0.22, 1, 0.36, 1],
  exit:      [0.7, 0, 0.84, 0],
  inout:     [0.83, 0, 0.17, 1],
} as const;

export const dur = { fast: 0.18, base: 0.32, slow: 0.6, cinematic: 1 } as const;

/* — Entrance variants ────────────────────────────────────────────────────── */
export const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.editorial } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: dur.base, ease: ease.editorial } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show:   { opacity: 1, scale: 1, transition: spring.gentle },
};

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: 'blur(8px)' },
  show:   { opacity: 1, filter: 'blur(0px)', transition: { duration: dur.slow, ease: ease.editorial } },
};

/* — Stagger container factory ────────────────────────────────────────────── */
export const stagger = (gap = 0.06, delay = 0): Variants => ({
  hidden: {},
  show:   { transition: { staggerChildren: gap, delayChildren: delay } },
});

/* — Page transition (used by the portal layout) ──────────────────────────── */
export const pageTransition = {
  initial:    { opacity: 0, filter: 'blur(8px)', y: 6 },
  animate:    { opacity: 1, filter: 'blur(0px)', y: 0 },
  exit:       { opacity: 0, filter: 'blur(6px)', y: -6 },
  transition: { duration: dur.base, ease: ease.editorial },
};
