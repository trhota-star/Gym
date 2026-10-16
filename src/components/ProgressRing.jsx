import { useId } from 'react';
import { motion } from 'framer-motion';

/**
 * Circular progress ring that fills on mount / when scrolled into view.
 * `progress` is 0..1. Children render in the center.
 */
export default function ProgressRing({
  progress,
  size = 120,
  stroke = 10,
  from = '#C6FF3D',
  to = '#22D3EE',
  children,
  duration = 1.6,
  delay = 0.1,
  animateOnView = true,
  ease = [0.16, 1, 0.3, 1],
  className = '',
}) {
  const id = useId().replace(/:/g, '');
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const target = c * (1 - clamped);

  const anim = { strokeDashoffset: target };
  const motionProps = animateOnView
    ? { initial: { strokeDashoffset: c }, whileInView: anim, viewport: { once: true } }
    : { initial: false, animate: anim };

  return (
    <div className={`relative inline-grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-line/[0.08]" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          filter={`url(#glow-${id})`}
          transition={{ duration, delay, ease }}
          {...motionProps}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
