/** Atelier OS — a gold-capped progress ring. */
export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block shrink-0 animate-spin rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        border: '2px solid var(--hairline)',
        borderTopColor: 'var(--gold)',
      }}
    />
  );
}
