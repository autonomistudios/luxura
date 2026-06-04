import React from 'react';

type Elevation = 'flat' | 'raised' | 'overlay';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  /** gold-locked active treatment (selection / focus-of-attention) */
  active?: boolean;
  /** hover-lift + cursor for clickable cards */
  interactive?: boolean;
  /** frosted vibrancy material (Apple glass) */
  material?: boolean;
  as?: React.ElementType;
}

/**
 * Atelier OS — Surface (the card / panel primitive).
 * Token-backed, so it renders correctly on dark chrome AND inside a
 * [data-surface="paper"] editorial spread with no per-instance overrides.
 */
export function Surface({
  elevation = 'raised',
  active = false,
  interactive = false,
  material = false,
  as: Tag = 'div',
  className = '',
  style,
  children,
  ...rest
}: SurfaceProps) {
  const elev: Record<Elevation, string> = {
    flat: 'bg-transparent',
    raised: 'bg-raised border border-hairline',
    overlay: 'bg-overlay border border-hairline',
  };

  const cls = [
    'rounded-2xl transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]',
    elev[elevation],
    interactive ? 'cursor-pointer hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-[var(--shadow-lg)]' : '',
    active ? '!border-hairline-gold shadow-[0_0_0_1px_var(--gold-wash),0_18px_50px_rgba(0,0,0,.5),0_0_40px_var(--gold-glow)]' : '',
    className,
  ].join(' ');

  const matStyle = material
    ? { background: 'var(--material-panel)', backdropFilter: 'var(--material-blur-lg)', WebkitBackdropFilter: 'var(--material-blur-lg)', ...style }
    : style;

  return (
    <Tag className={cls} style={matStyle} {...rest}>
      {children}
    </Tag>
  );
}
