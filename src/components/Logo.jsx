import { Activity } from 'lucide-react';

export default function Logo({ size = 'md', onClick }) {
  const big = size === 'lg';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2.5 focus:outline-none"
      aria-label="PulseFit home"
    >
      <span
        className={`relative grid place-items-center rounded-xl bg-brand-gradient shadow-glow transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105 ${
          big ? 'h-11 w-11' : 'h-9 w-9'
        }`}
      >
        <Activity className={big ? 'h-6 w-6' : 'h-5 w-5'} color="#0B0F14" strokeWidth={2.75} />
      </span>
      <span
        className={`text-gradient animate-shimmer font-display font-bold tracking-tight ${big ? 'text-3xl' : 'text-[1.4rem]'}`}
      >
        PulseFit
      </span>
    </button>
  );
}
