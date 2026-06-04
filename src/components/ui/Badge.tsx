import React from 'react';

type Tone = 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const tones: Record<Tone, { color: string; bg: string; border: string }> = {
  gold:    { color: 'var(--gold)',           bg: 'var(--gold-wash)',    border: 'var(--hairline-gold)' },
  success: { color: 'var(--success)',        bg: 'var(--success-wash)', border: 'var(--success-wash)' },
  warning: { color: 'var(--warning)',        bg: 'var(--warning-wash)', border: 'var(--warning-wash)' },
  danger:  { color: 'var(--danger)',         bg: 'var(--danger-wash)',  border: 'var(--danger-wash)' },
  info:    { color: 'var(--info)',           bg: 'var(--info-wash)',    border: 'var(--info-wash)' },
  neutral: { color: 'var(--text-tertiary)',  bg: 'var(--surface-inset)',border: 'var(--hairline)' },
};

/**
 * Atelier OS — status pill. Mono micro-caps, optional pulsing dot.
 * e.g. <Badge tone="gold" dot>DNA Locked</Badge>
 */
export function Badge({
  tone = 'neutral',
  dot = false,
  children,
  className = '',
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill font-mono text-[8px] tracking-[0.26em] uppercase px-2.5 py-1 leading-none ${className}`}
      style={{ color: t.color, background: t.bg, border: `1px solid ${t.border}` }}
    >
      {dot && (
        <span
          className="w-1 h-1 rounded-full animate-pulse-soft"
          style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
        />
      )}
      {children}
    </span>
  );
}
