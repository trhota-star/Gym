import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bike, CalendarCheck, CalendarX, Check, Clock, Flame, Loader2, MapPin, Swords, Wind, Zap } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { classes as initialClasses, classTypes, weekDays } from '../data/mock';

const typeStyle = {
  Yoga: { Icon: Wind, grad: 'from-emerald-400 to-teal-500', glow: 'bg-emerald-400/25' },
  HIIT: { Icon: Zap, grad: 'from-lime-300 to-lime-500', glow: 'bg-lime-400/25' },
  Spin: { Icon: Bike, grad: 'from-cyan-300 to-blue-500', glow: 'bg-cyan-400/25' },
  Boxing: { Icon: Swords, grad: 'from-rose-400 to-orange-500', glow: 'bg-rose-500/25' },
};

const TODAY = 'wed';

export default function Classes() {
  const { toast } = useApp();
  const [day, setDay] = useState(TODAY);
  const [type, setType] = useState('All');
  const [list, setList] = useState(initialClasses);
  const [booked, setBooked] = useState(() => new Set());
  const [pending, setPending] = useState(null);

  const visible = list.filter((c) => c.day === day && (type === 'All' || c.type === type));
  const dayLabel = weekDays.find((d) => d.key === day);

  const book = (c) => {
    if (booked.has(c.id)) {
      setBooked((b) => {
        const n = new Set(b);
        n.delete(c.id);
        return n;
      });
      setList((l) => l.map((x) => (x.id === c.id ? { ...x, spots: x.spots + 1 } : x)));
      toast({ type: 'info', title: 'Booking cancelled', message: `Your spot in ${c.title} is free for someone else.` });
      return;
    }
    if (c.spots === 0) {
      toast({ type: 'error', title: 'This class is full', message: 'You’re on the waitlist. We’ll ping you if a spot opens up, or try another time slot!' });
      return;
    }
    // Simulate a network round-trip so the button has a loading state
    setPending(c.id);
    setTimeout(() => {
      setPending(null);
      setBooked((b) => new Set(b).add(c.id));
      setList((l) => l.map((x) => (x.id === c.id ? { ...x, spots: x.spots - 1 } : x)));
      toast({ title: 'You’re booked! 🎉', message: `${c.title} · ${dayLabel.short} ${c.time} with ${c.coach}` });
    }, 650);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Class booking"
        title="This week’s schedule"
        subtitle="Yoga, HIIT, Spin and Boxing with PulseFit’s best coaches. Grab a spot before they’re gone."
        actions={
          booked.size > 0 && (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-lime-400/15 px-4 py-2.5 text-sm font-semibold text-accent">
              <CalendarCheck className="h-4 w-4" /> {booked.size} booked
            </span>
          )
        }
      />

      {/* Day selector */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {weekDays.map((d) => {
          const active = d.key === day;
          const count = list.filter((c) => c.day === d.key).length;
          return (
            <button
              key={d.key}
              onClick={() => setDay(d.key)}
              className={`relative flex min-w-[4.25rem] flex-1 flex-col items-center rounded-2xl border px-3 py-3 transition ${
                active ? 'border-transparent text-[#0B0F14]' : 'border-line/10 text-muted hover:border-line/25 hover:text-ink'
              }`}
            >
              {active && (
                <motion.span layoutId="day-pill" className="absolute inset-0 rounded-2xl bg-brand-gradient shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative text-xs font-semibold uppercase tracking-wider">{d.short}</span>
              <span className="relative font-display text-2xl font-bold">{d.date}</span>
              <span className="relative mt-0.5 flex gap-0.5">
                {Array.from({ length: count }).map((_, i) => (
                  <span key={i} className={`h-1 w-1 rounded-full ${active ? 'bg-[#0B0F14]/60' : 'bg-current opacity-60'}`} />
                ))}
              </span>
              {d.key === TODAY && !active && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-lime-400" />}
            </button>
          );
        })}
      </div>

      {/* Type filter */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {['All', ...classTypes].map((t) => {
          const Icon = typeStyle[t]?.Icon;
          return (
            <button key={t} onClick={() => setType(t)} className={`chip ${type === t ? 'chip-active' : ''}`}>
              {Icon && <Icon className="h-4 w-4" />}
              {t}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${day}-${type}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {visible.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title={`No ${type === 'All' ? '' : type + ' '}classes on ${dayLabel.short}`}
              message="Coaches need rest days too. Pick another day or class type to find a session."
              action={
                <button className="btn-ghost" onClick={() => setType('All')}>
                  Show all classes
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visible.map((c, i) => (
                <ClassCard key={c.id} c={c} index={i} booked={booked.has(c.id)} pending={pending === c.id} onBook={() => book(c)} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ClassCard({ c, index, booked, pending, onBook }) {
  const s = typeStyle[c.type];
  const full = c.spots === 0 && !booked;
  const fill = (c.capacity - c.spots) / c.capacity;
  const low = c.spots > 0 && c.spots <= 3;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.06 } }}
      whileHover={{ y: -4 }}
      className={`glass relative overflow-hidden p-5 ${booked ? 'ring-2 ring-lime-400/70' : ''}`}
    >
      <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${s.glow}`} />
      <div className="relative flex items-start gap-4">
        <div className="text-center">
          <p className="font-display text-2xl font-bold leading-none">{c.time}</p>
          <p className="mt-1 text-xs text-muted">{c.duration} min</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${s.grad} px-2.5 py-0.5 text-xs font-bold text-[#0B0F14]`}>
              <s.Icon className="h-3.5 w-3.5" /> {c.type}
            </span>
            <span className="flex" aria-label={`Intensity ${c.intensity} of 3`}>
              {[1, 2, 3].map((n) => (
                <Flame key={n} className={`h-3.5 w-3.5 ${n <= c.intensity ? 'fill-orange-500 text-orange-500' : 'text-line/20'}`} />
              ))}
            </span>
          </div>
          <h3 className="mt-2 truncate text-lg font-semibold">{c.title}</h3>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>with {c.coach}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {c.room}
            </span>
          </p>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className={full ? 'font-semibold text-rose-500' : low ? 'font-semibold text-orange-400' : 'text-muted'}>
            {full ? 'Class full' : `${c.spots} spot${c.spots === 1 ? '' : 's'} left`}
          </span>
          <span className="text-muted">
            {c.capacity - c.spots}/{c.capacity}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line/[0.08]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fill * 100}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className={`h-full rounded-full ${full ? 'bg-rose-500' : low ? 'bg-orange-400' : 'bg-brand-gradient'}`}
          />
        </div>
      </div>

      <button
        onClick={onBook}
        disabled={pending}
        className={`relative mt-5 w-full ${booked ? 'btn-ghost !border-lime-400/40' : full ? 'btn-ghost opacity-70' : 'btn-primary'}`}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Booking…
          </>
        ) : booked ? (
          <>
            <Check className="h-4 w-4 text-accent" /> Booked · tap to cancel
          </>
        ) : full ? (
          <>
            <Clock className="h-4 w-4" /> Join waitlist
          </>
        ) : (
          'Book spot'
        )}
      </button>
    </motion.article>
  );
}
