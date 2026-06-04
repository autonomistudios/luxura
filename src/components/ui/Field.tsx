import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/* Shared field chrome — Apple-clean inset, gold focus ring. */
const fieldBase =
  'w-full bg-inset border border-hairline rounded-xl text-primary font-sans font-light text-[13px] ' +
  'placeholder:text-quaternary transition-all duration-200 ease-[cubic-bezier(.16,1,.3,1)] ' +
  'hover:border-hairline-strong focus:outline-none focus:border-hairline-gold focus:ring-[3px] focus:ring-gold-wash';

export function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`block font-mono text-[9px] tracking-[0.24em] uppercase text-tertiary mb-2 ${className}`}>
      {children}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${fieldBase} px-3.5 py-2.5 ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...props }, ref) {
    return <textarea ref={ref} className={`${fieldBase} px-3.5 py-2.5 resize-none leading-relaxed ${className}`} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...props }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={`${fieldBase} appearance-none cursor-pointer pl-3.5 pr-10 py-2.5 ${className}`} {...props}>
          {children}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
      </div>
    );
  },
);

/** Label + control + optional hint, vertically stacked. */
export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="mt-1.5 font-mono text-[9px] tracking-[0.12em] uppercase text-quaternary">{hint}</p>}
    </div>
  );
}
