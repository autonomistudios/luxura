import React from 'react';

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
};

/** The Didone masthead — Bodoni italic. The couture/editorial voice. */
export function Masthead({ as: Tag = 'h1', className = '', children, ...props }: HeadingProps) {
  return (
    <Tag className={`font-display italic font-medium tracking-[-0.02em] leading-[1.02] text-primary ${className}`} {...props}>
      {children}
    </Tag>
  );
}

/** Gold mono eyebrow that sits above a masthead. */
export function Kicker({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <p className={`font-mono text-[10px] tracking-[0.34em] uppercase text-gold ${className}`}>{children}</p>;
}

/** Faint mono section divider label. */
export function SectionLabel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <p className={`font-mono text-[10px] tracking-[0.42em] uppercase text-quaternary ${className}`}>{children}</p>;
}

/** Tiny mono caption / spec label. */
export function MicroLabel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <span className={`font-mono text-[8px] tracking-[0.3em] uppercase text-tertiary ${className}`}>{children}</span>;
}

/** Editorial running serif (pull quotes, lede copy on paper spreads). */
export function Editorial({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <p className={`font-serif text-[17px] leading-relaxed text-secondary ${className}`}>{children}</p>;
}
