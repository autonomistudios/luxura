---
description: LuxAura B2B design system — exact tokens, component patterns, and Quiet Luxury dark aesthetic rules. Use whenever building or modifying any UI component.
---

# LuxAura Design System — Sovereign Dark

## Color Tokens (exact hex)
```
bg-base:        #050505   — main page background (near-black, NOT #000000)
bg-surface:     #0B0B0E   — card backgrounds
bg-elevated:    #111116   — card gradient top (use with #0B0B0E for linear-gradient)
bg-deep:        #060608   — sidebar
bg-topbar:      #07070A   — top navigation bar
bg-input:       rgba(255,255,255,0.03)

border-default: rgba(255,255,255,0.06)
border-hover:   rgba(255,255,255,0.15)
border-active:  rgba(184,149,42,0.40)

gold-primary:   #B8952A
gold-bright:    #D4AF37
gold-hover:     #C9A84C
gold-subtle-bg: rgba(184,149,42,0.08)
gold-glow:      rgba(184,149,42,0.25)

text-primary:   #FFFFFF
text-secondary: rgba(255,255,255,0.70)
text-muted:     rgba(255,255,255,0.40)
text-dim:       rgba(255,255,255,0.25)
text-ghost:     rgba(255,255,255,0.15)

success:  #10B981  (emerald)
warning:  #F59E0B  (amber)
error:    #EF4444  (rose)
info:     #6366F1  (indigo)
```

## Typography
```
H1 page title:    font-serif italic, 40–48px, tracking -0.02em, Playfair Display
H2 section:       font-serif italic, 28–32px, Playfair Display
H3 card title:    Inter 16px weight 500
Body:             Inter 13–14px weight 400, line-height 1.6
Hero numbers:     font-serif italic, 48–72px, Playfair Display
Label (mono):     Space Mono 9–10px, tracking 0.40–0.45em, UPPERCASE
Data:             Space Mono 11–12px
Micro label:      Space Mono 7–8px, tracking 0.35em, UPPERCASE
```

## Card Pattern
```tsx
// Standard card
<div style={{
  background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 4,
}}>

// Card on hover (via state)
boxShadow: '0 0 20px rgba(184,149,42,0.07)'
borderColor: 'rgba(184,149,42,0.25)'

// Card selected/active
border: '1px solid rgba(184,149,42,0.40)'
boxShadow: '0 0 0 1px rgba(184,149,42,0.15), 0 4px 24px rgba(184,149,42,0.08)'
```

## Button Patterns
```tsx
// Primary — gold fill
className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#B8952A] hover:bg-[#C9A84C] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold transition-all"
style={{ boxShadow: '0 0 20px rgba(184,149,42,0.25)' }}

// Secondary — outline
className="px-5 py-2.5 rounded border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white text-[10px] font-mono tracking-[0.2em] uppercase transition-all"

// Forge CTA — Playfair italic
className="flex items-center gap-2.5 py-3.5 rounded font-serif italic text-black text-[14px] transition-all"
style={{ background: '#B8952A', boxShadow: '0 0 24px rgba(184,149,42,0.35)' }}
```

## Status Badge Patterns
```tsx
// DNA LOCKED (gold)
style={{ background: 'rgba(184,149,42,0.10)', border: '1px solid rgba(184,149,42,0.25)', color: '#B8952A' }}
// ENROLLING (amber pulse)
style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}
// DRIFT DETECTED (rose)
style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
// READY / COMPLIANT (emerald)
style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}

// All badges: Space Mono 7px tracking-[0.3em] UPPERCASE, radius 2px, padding 3px 8px
```

## Atmospheric Effects
```tsx
// Full-page hero glow (behind page content)
<div className="absolute inset-0 pointer-events-none" style={{
  background: 'radial-gradient(ellipse at 50% 0%, rgba(184,149,42,0.06) 0%, transparent 55%)'
}} />

// Corner accent
style={{ background: 'radial-gradient(circle at 100% 0%, rgba(184,149,42,0.04) 0%, transparent 60%)' }}

// Generation active radial (behind forge grid)
style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(184,149,42,0.07) 0%, transparent 65%)' }}
```

## Section Label Pattern
```tsx
<p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25 mb-2">
  SECTION NAME
</p>
```

## Layout Shell (every portal page)
- Sidebar: 200px fixed, bg #060608, border-right rgba(255,255,255,0.06)
- Top bar: 56px fixed, bg #07070A, backdrop-blur
- Main content: flex-1, overflow-y-auto, bg #050507
- Content padding: p-8 (32px) standard, p-12 for cinematic pages

## Navigation Active State
```tsx
// Active nav item
className="border-l-2 border-[#B8952A] bg-gradient-to-r from-[#B8952A]/12 to-transparent text-white"
// Inactive nav item
className="border-l-2 border-transparent text-white/35 hover:text-white hover:bg-white/[0.02]"
```

## SVG Arc Ring (quota displays)
```tsx
// 240-degree sweep, 4:5 start/end angles
// Track: rgba(255,255,255,0.04), stroke 10–12px
// Fill: #B8952A, stroke 10–12px, end cap glow via filter drop-shadow
// Center: Playfair italic number + Space Mono 7px label
// Outer rings: 2 faint concentric gold halos
```

## Rules
1. NEVER use pure #000000 or pure #ffffff — use #050505 and rgba(255,255,255,X)
2. Gold (#B8952A) is used for: active states, CTAs, data highlights, status indicators
3. All labels are Space Mono UPPERCASE with wide tracking
4. All page headings are Playfair Display italic
5. No box-shadow except gold glow states
6. Border radius is always 4px (ROUND_FOUR)
7. Framer Motion for all transitions — no CSS animations except simple hover states
