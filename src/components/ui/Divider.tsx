/** Hairline rule. `gold` swaps to the gold separator; `vertical` for inline use. */
export function Divider({
  className = '',
  gold = false,
  vertical = false,
}: {
  className?: string;
  gold?: boolean;
  vertical?: boolean;
}) {
  const bg = gold ? 'var(--gold-line)' : 'var(--hairline)';
  if (vertical) {
    return <span aria-hidden className={`inline-block w-px self-stretch ${className}`} style={{ background: bg }} />;
  }
  return <hr className={`border-0 h-px w-full ${className}`} style={{ background: bg }} />;
}

/** Short gold editorial rule (the masthead underline). */
export function GoldRule({ className = '', width = 64 }: { className?: string; width?: number }) {
  return <span aria-hidden className={`block h-px ${className}`} style={{ width, background: 'var(--gold)', opacity: 0.6 }} />;
}
