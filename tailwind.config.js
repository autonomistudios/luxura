/** @type {import('tailwindcss').Config} */
/*
 * LuxAura — Atelier OS
 * Tailwind utilities are wired to the CSS custom properties defined in
 * src/styles/tokens.css. This makes Tailwind classes and the dual-surface
 * token system ONE source of truth: e.g. `bg-canvas`, `text-secondary`,
 * `border-hairline`, `text-gold`, `bg-gold` all resolve to var(--token) and
 * auto-reskin inside a [data-surface="paper"] container.
 *
 * Legacy consumer-era color names (background, surface, mercury, apple-*) are
 * preserved as static aliases so existing marketing pages keep their styling.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        glint: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        scan: {
          '0%': { top: '-100%' },
          '100%': { top: '100%' },
        },
        sheen: {
          '0%':   { transform: 'translateX(-120%) skewX(-20deg)' },
          '100%': { transform: 'translateX(220%) skewX(-20deg)' },
        },
        rise: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
      },
      animation: {
        glint: 'glint 4s linear infinite',
        scan: 'scan 2.5s ease-in-out infinite',
        sheen: 'sheen 0.8s cubic-bezier(0.16,1,0.3,1)',
        rise: 'rise 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-soft': 'pulse-soft 2.4s cubic-bezier(0.16,1,0.3,1) infinite',
      },
      fontFamily: {
        display: ['Bodoni Moda', 'Playfair Display', 'Georgia', 'serif'],
        serif:   ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        mega: '0.45em',
      },
      borderRadius: {
        pill: '980px',
      },
      boxShadow: {
        'glow-gold': '0 0 28px var(--gold-glow)',
        'lux-md': 'var(--shadow-md)',
        'lux-lg': 'var(--shadow-lg)',
        'lux-xl': 'var(--shadow-xl)',
      },
      colors: {
        /* ── Semantic surfaces (token-backed, dual-surface aware) ──────────── */
        canvas:       'var(--surface-canvas)',
        sunken:       'var(--surface-sunken)',
        raised:       'var(--surface-raised)',
        'raised-2':   'var(--surface-raised-2)',
        overlay:      'var(--surface-overlay)',
        inset:        'var(--surface-inset)',

        /* ── Text hierarchy ────────────────────────────────────────────────── */
        primary:      'var(--text-primary)',
        secondary:    'var(--text-secondary)',
        tertiary:     'var(--text-tertiary)',
        quaternary:   'var(--text-quaternary)',

        /* ── Hairlines ─────────────────────────────────────────────────────── */
        hairline:          'var(--hairline)',
        'hairline-strong': 'var(--hairline-strong)',
        'hairline-gold':   'var(--hairline-gold)',

        /* ── Editorial gold (the single confident accent) ──────────────────── */
        gold: {
          DEFAULT: 'var(--gold)',
          bright:  'var(--gold-bright)',
          deep:    'var(--gold-deep)',
          glow:    'var(--gold-glow)',
          wash:    'var(--gold-wash)',
          line:    'var(--gold-line)',
          /* legacy aliases (consumer-era components) */
          light:   'var(--gold-bright)',
          hover:   'var(--gold-bright)',
          dark:    'var(--gold-deep)',
        },
        accent:        'var(--accent)',
        'on-accent':   'var(--text-on-accent)',

        /* ── Status ────────────────────────────────────────────────────────── */
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
        info:    'var(--info)',

        /* ── Legacy aliases (keep consumer-era marketing pages styled) ─────── */
        background: '#FAF9F6',
        surface: '#F2EFE9',
        border: '#E5E0D8',
        text: '#1C1C1C',
        muted: '#6E6A60',
        obsidian: '#0B0B0B',
        'apple-black': '#000000',
        'apple-glass': 'rgba(28, 28, 30, 0.65)',
        'apple-glass-hover': 'rgba(44, 44, 46, 0.8)',
        'apple-border': 'rgba(255, 255, 255, 0.1)',
        'apple-border-light': 'rgba(255, 255, 255, 0.15)',
        mercury: {
          light: '#FFFFFF',
          DEFAULT: '#E5E5E5',
          dark: '#A3A3A3',
        },
        anthracite: '#F2EFE9',
      },
    },
  },
  plugins: [],
}
