import React, { forwardRef } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'forge' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Atelier OS — Button.
 * `forge` is the signature gold display-italic CTA (with the light sheen sweep).
 * `primary` is the compact gold action; secondary/ghost/danger are restrained.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    fullWidth = false,
    className = '',
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const base =
    'group relative inline-flex items-center justify-center font-medium select-none overflow-hidden ' +
    'transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] active:scale-[0.985] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-glow)] ' +
    'disabled:opacity-40 disabled:pointer-events-none';

  const pad: Record<Size, string> = {
    sm: 'px-3.5 py-2 gap-1.5 rounded-lg',
    md: 'px-5 py-2.5 gap-2 rounded-xl',
    lg: 'px-6 py-3 gap-2.5 rounded-xl',
  };

  const typeface =
    variant === 'forge'
      ? 'font-display italic normal-case'
      : 'font-mono uppercase tracking-[0.2em]';

  const textSize =
    variant === 'forge' ? 'text-[15px]' : size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-[12px]' : 'text-[11px]';

  const variants: Record<Variant, string> = {
    primary:   'bg-gold text-on-accent hover:bg-gold-bright shadow-[0_6px_24px_var(--gold-glow)]',
    forge:     'text-on-accent hover:-translate-y-0.5 shadow-[0_8px_28px_var(--gold-glow)]',
    secondary: 'border border-hairline text-secondary hover:text-primary hover:border-hairline-strong bg-transparent',
    ghost:     'text-tertiary hover:text-primary bg-transparent',
    danger:    'border border-hairline-strong text-danger hover:bg-[var(--danger-wash)]',
  };

  const forgeStyle =
    variant === 'forge'
      ? { background: 'linear-gradient(180deg,var(--gold-bright) 0%,var(--gold) 55%,var(--gold-deep) 100%)' }
      : undefined;

  const hasSheen = variant === 'forge' || variant === 'primary';

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={forgeStyle}
      className={`${base} ${pad[size]} ${typeface} ${textSize} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {hasSheen && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 -left-1/3 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-[left] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:left-[130%]"
          style={{ transform: 'skewX(-20deg)' }}
        />
      )}
      {loading ? <Spinner size={size === 'lg' ? 15 : 13} /> : icon}
      {children && <span className="relative">{children}</span>}
      {iconRight && !loading && iconRight}
    </button>
  );
});
