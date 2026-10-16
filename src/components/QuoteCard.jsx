import { Quote } from 'lucide-react';
import GlassCard from './GlassCard';
import { quoteOfTheDay } from '../data/mock';

export default function QuoteCard({ delay = 0 }) {
  const q = quoteOfTheDay();
  return (
    <GlassCard delay={delay} className="flex h-full flex-col justify-between">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="flex items-center gap-2">
        <Quote className="h-4 w-4 text-accent" />
        <span className="eyebrow">Quote of the day</span>
      </div>
      <blockquote className="mt-4 font-display text-lg font-medium leading-snug sm:text-xl">“{q.text}”</blockquote>
      <p className="mt-3 text-sm text-muted">— {q.author}</p>
    </GlassCard>
  );
}
