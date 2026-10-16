import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, Clock, Dumbbell, Flame, Loader2, Minus, Pause, Play, Plus, RotateCcw, SkipForward, Trophy } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';
import AnimatedCounter from '../components/AnimatedCounter';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

const idleRest = { total: 0, remaining: 0, phase: 'idle' }; // phase: idle | running | paused | finished

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function celebrate() {
  const colors = ['#C6FF3D', '#22D3EE', '#5CF2A0', '#ffffff', '#A855F7'];
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors, scalar: 1.1 });
  const end = Date.now() + 1600;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

const countSets = (workout) => {
  const all = (workout?.exercises ?? []).flatMap((e) => e.sets);
  return { total: all.length, done: all.filter((s) => s.completed).length };
};

export default function LiveWorkout() {
  const { toast, navigate, refreshUser } = useApp();
  const [workout, setWorkout] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [rest, setRest] = useState(idleRest);
  const [now, setNow] = useState(Date.now());
  const [frozenElapsed, setFrozenElapsed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(null);
  const [showComplete, setShowComplete] = useState(false);
  const celebrated = useRef(false);
  const workoutRef = useRef(null);
  const setChains = useRef(new Map()); // setId -> promise, keeps saves for one set in order
  workoutRef.current = workout;

  const load = useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      let { workout: w } = await api('/api/workouts');
      if (w && w.status === 'planned' && w.exercises.length > 0) {
        ({ workout: w } = await api('/api/workouts', { method: 'PATCH', body: { workoutId: w.id, action: 'start' } }));
      }
      setWorkout(w);
      const finished = w?.status === 'completed';
      celebrated.current = finished; // never replay confetti for an already-finished workout
      setFrozenElapsed(finished ? (w.durationMinutes ?? 0) * 60 : null);
      setNow(Date.now());
      setLoadState('ready');
    } catch (err) {
      setError(err);
      setLoadState('error');
      toast({ type: 'error', title: 'Couldn’t load your workout', message: err.message, duration: 6000 });
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const exercises = workout?.exercises ?? [];
  const { total: totalSets, done: completedSets } = countSets(workout);
  const complete = totalSets > 0 && completedSets === totalSets;
  const finished = workout?.status === 'completed';
  const currentExercise = exercises.find((e) => e.sets.some((s) => !s.completed));
  const startedAt = workout?.startedAt ? new Date(workout.startedAt).getTime() : null;
  const elapsed = frozenElapsed ?? (startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0);

  // Workout stopwatch (based on the saved start time, so it survives a refresh)
  useEffect(() => {
    if (!workout || frozenElapsed !== null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [workout, frozenElapsed]);

  // Rest countdown
  useEffect(() => {
    if (rest.phase !== 'running') return;
    const id = setInterval(() => {
      setRest((r) => {
        // A tick can land after a skip/reset; never resurrect a stopped timer
        if (r.phase !== 'running') return r;
        return r.remaining <= 1 ? { ...r, remaining: 0, phase: 'finished' } : { ...r, remaining: r.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [rest.phase]);

  useEffect(() => {
    if (rest.phase !== 'finished') return;
    navigator.vibrate?.([120, 60, 120]);
    toast({ type: 'info', title: 'Rest’s over. Let’s go!', message: currentExercise ? `Next up: ${currentExercise.name}` : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest.phase]);

  // Stop any falling confetti when leaving the page
  useEffect(() => () => confetti.reset(), []);

  const finish = useCallback(async () => {
    const secs = elapsed;
    setFrozenElapsed(secs);
    setRest(idleRest);
    setSaving(true);
    try {
      // Let every set save land first, then check the workout really is complete
      await Promise.allSettled([...setChains.current.values()]);
      const latest = countSets(workoutRef.current);
      if (latest.total === 0 || latest.done < latest.total) {
        celebrated.current = false;
        setFrozenElapsed(null);
        return;
      }
      const res = await api('/api/workouts', {
        method: 'PATCH',
        body: { workoutId: workoutRef.current.id, action: 'finish', durationMinutes: Math.max(1, Math.round(secs / 60)) },
      });
      setWorkout(res.workout);
      setFrozenElapsed((res.workout.durationMinutes ?? 0) * 60 || secs);
      setStreak(res.streak);
      refreshUser();
      celebrate();
      setTimeout(() => setShowComplete(true), 500);
    } catch (err) {
      setFrozenElapsed(null);
      toast({ type: 'error', title: 'Couldn’t save your workout', message: `${err.message} Tap “Save & finish” to try again.`, duration: 6000 });
    } finally {
      setSaving(false);
    }
  }, [elapsed, refreshUser, toast]);

  // Save and celebrate once when every set is ticked
  useEffect(() => {
    if (complete && !finished && !celebrated.current) {
      celebrated.current = true;
      finish();
    }
  }, [complete, finished, finish]);

  const patchSet = (setId, completed) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, completed } : s)) })),
    }));

  const toggleSet = (exercise, set) => {
    if (finished || saving) return;
    const next = !set.completed;
    patchSet(set.id, next); // optimistic: the tick shows instantly
    if (next && completedSets + 1 < totalSets && exercise.restSeconds > 0) {
      setRest({ total: exercise.restSeconds, remaining: exercise.restSeconds, phase: 'running' });
    }
    const prev = setChains.current.get(set.id) ?? Promise.resolve();
    const p = prev
      .then(() => api('/api/sets', { method: 'PATCH', body: { setId: set.id, completed: next } }))
      .catch((err) => {
        patchSet(set.id, !next);
        toast({ type: 'error', title: 'Couldn’t save that set', message: err.message });
      })
      .finally(() => {
        if (setChains.current.get(set.id) === p) setChains.current.delete(set.id);
      });
    setChains.current.set(set.id, p);
  };

  const adjust = (delta) =>
    setRest((r) => {
      const remaining = Math.max(0, r.remaining + delta);
      return { total: Math.max(r.total, remaining), remaining, phase: remaining ? (r.phase === 'paused' ? 'paused' : 'running') : 'idle' };
    });

  const reset = async () => {
    if (!workout || saving) return;
    try {
      await Promise.allSettled([...setChains.current.values()]);
      const { workout: w } = await api('/api/workouts', { method: 'PATCH', body: { workoutId: workout.id, action: 'reset' } });
      setWorkout(w);
      setRest(idleRest);
      setFrozenElapsed(null);
      setNow(Date.now());
      setShowComplete(false);
      celebrated.current = false;
      toast({ type: 'info', title: finished ? 'Fresh round started' : 'Workout reset', message: 'All sets cleared. Let’s go again!' });
    } catch (err) {
      toast({ type: 'error', title: 'Couldn’t reset the workout', message: err.message });
    }
  };

  if (loadState === 'error') return <ErrorState error={error} onRetry={load} />;
  if (loadState === 'loading') return <WorkoutSkeleton />;
  if (!workout || exercises.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No workout yet today"
        message="Pick one from the Library! Add a few exercises to today’s workout and they’ll be waiting for you here."
        action={
          <button className="btn-primary" onClick={() => navigate('library')}>
            <Plus className="h-4 w-4" /> Open the Library
          </button>
        }
      />
    );
  }

  const resting = rest.phase === 'running' || rest.phase === 'paused';
  const ringProgress = resting ? rest.remaining / rest.total : complete ? 1 : 0;

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {!finished && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${finished ? 'bg-lime-400' : 'bg-rose-500'}`} />
          </span>
          <span className={`eyebrow ${finished ? '' : '!text-rose-500'}`}>{finished ? 'Completed today' : 'Live workout'}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold sm:text-4xl">{workout.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-accent" />
              <span className="font-display text-lg font-semibold tabular-nums text-ink">{fmt(elapsed)}</span>
            </span>
            <button
              onClick={reset}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-line/[0.06] hover:text-ink disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" /> {finished ? 'Do it again' : 'Reset'}
            </button>
          </div>
        </div>
        {/* Overall progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-muted">
              {completedSets} of {totalSets} sets
            </span>
            <span className="font-semibold">{Math.round((completedSets / totalSets) * 100)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line/[0.08]">
            <motion.div
              className="h-full rounded-full bg-brand-gradient shadow-glow"
              animate={{ width: `${(completedSets / totalSets) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Timer */}
        <GlassCard hover={false} className="lg:sticky lg:top-10 lg:self-start">
          <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${resting ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
          </div>
          <p className="eyebrow text-center">
            {resting ? 'Rest timer' : finished ? 'Workout complete' : saving ? 'Saving your workout…' : 'Ready when you are'}
          </p>
          <div className="relative mt-4 flex justify-center">
            <ProgressRing
              progress={ringProgress}
              size={260}
              stroke={16}
              animateOnView={false}
              duration={resting ? 1 : 0.6}
              delay={0}
              ease="linear"
              from={resting ? '#22D3EE' : '#C6FF3D'}
              to={resting ? '#C6FF3D' : '#22D3EE'}
              className="max-w-full"
            >
              <div>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={resting ? rest.remaining : complete ? 'done' : 'idle'}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="font-display text-6xl font-bold tabular-nums"
                  >
                    {resting ? fmt(rest.remaining) : complete ? '🏆' : 'GO'}
                  </motion.p>
                </AnimatePresence>
                <p className="mt-1 text-sm text-muted">
                  {resting ? (rest.phase === 'paused' ? 'Paused' : 'Breathe. Hydrate.') : complete ? 'All sets done' : 'Tick a set to start rest'}
                </p>
              </div>
            </ProgressRing>
          </div>

          <div className="relative mt-6 flex items-center justify-center gap-3">
            <RoundBtn label="Remove 15 seconds" onClick={() => adjust(-15)} disabled={!resting}>
              <Minus className="h-5 w-5" />
            </RoundBtn>
            <button
              onClick={() =>
                resting
                  ? setRest((r) => ({ ...r, phase: r.phase === 'running' ? 'paused' : 'running' }))
                  : setRest({ total: currentExercise?.restSeconds || 60, remaining: currentExercise?.restSeconds || 60, phase: 'running' })
              }
              disabled={complete}
              className="btn-primary h-16 w-16 !rounded-full !p-0"
              aria-label={rest.phase === 'running' ? 'Pause rest timer' : 'Start rest timer'}
            >
              {rest.phase === 'running' ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-1 h-7 w-7 fill-current" />}
            </button>
            <RoundBtn label="Add 15 seconds" onClick={() => adjust(15)} disabled={!resting}>
              <Plus className="h-5 w-5" />
            </RoundBtn>
            <RoundBtn label="Skip rest" onClick={() => setRest(idleRest)} disabled={!resting}>
              <SkipForward className="h-5 w-5" />
            </RoundBtn>
          </div>

          {complete && !finished && (
            <button onClick={finish} disabled={saving} className="btn-primary relative mt-6 w-full">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trophy className="h-5 w-5" />}
              {saving ? 'Saving…' : 'Save & finish'}
            </button>
          )}

          {currentExercise && (
            <div className="relative mt-6 rounded-2xl bg-line/[0.04] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted">Up next</p>
              <p className="mt-1 font-display text-lg font-semibold">{currentExercise.name}</p>
              <p className="text-sm text-muted">
                {currentExercise.sets.length} × {currentExercise.reps} · {currentExercise.restSeconds}s rest
              </p>
            </div>
          )}
        </GlassCard>

        {/* Exercises */}
        <div className="space-y-3">
          {exercises.map((ex, exIdx) => {
            const allDone = ex.sets.every((s) => s.completed);
            const active = currentExercise?.workoutExerciseId === ex.workoutExerciseId;
            return (
              <GlassCard
                key={ex.workoutExerciseId}
                delay={exIdx * 0.06}
                hover={false}
                className={`transition-shadow ${active ? 'ring-2 ring-lime-400/60 shadow-glow' : ''} ${allDone ? 'opacity-80' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display font-bold transition ${
                        allDone ? 'bg-brand-gradient text-[#0B0F14]' : 'bg-line/[0.06] text-accent'
                      }`}
                    >
                      {allDone ? <Check className="h-5 w-5" strokeWidth={3} /> : exIdx + 1}
                    </span>
                    <div>
                      <h3 className={`font-semibold ${allDone ? 'text-muted line-through decoration-2' : ''}`}>{ex.name}</h3>
                      <p className="text-sm text-muted">
                        {ex.sets.length} × {ex.reps} · {ex.equipment} · {ex.restSeconds}s rest
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ex.sets.map((set) => (
                    <motion.button
                      key={set.id}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => toggleSet(ex, set)}
                      disabled={finished}
                      aria-pressed={set.completed}
                      aria-label={`Set ${set.setNumber} of ${ex.name}`}
                      className={`relative flex h-12 min-w-[4.5rem] flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition disabled:cursor-default sm:flex-none ${
                        set.completed
                          ? 'border-transparent bg-brand-gradient text-[#0B0F14] shadow-glow'
                          : 'border-line/10 bg-line/[0.03] text-muted hover:border-lime-400/50 hover:text-ink'
                      }`}
                    >
                      <AnimatePresence initial={false}>
                        {set.completed && (
                          <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      Set {set.setNumber}
                    </motion.button>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Completion modal: portalled so the page wrapper's transform can't offset `fixed` */}
      {createPortal(
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowComplete(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="glass relative w-full max-w-md overflow-hidden p-8 text-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="complete-title"
            >
              <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-lime-400/30 blur-3xl" />
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.15, stiffness: 200 }}
                className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-gradient shadow-glow"
              >
                <Trophy className="h-10 w-10 text-[#0B0F14]" />
              </motion.div>
              <h2 id="complete-title" className="relative mt-6 text-3xl font-bold">Workout crushed!</h2>
              <p className="relative mt-2 text-muted">
                {streak > 1
                  ? `That’s ${streak} days in a row. Your streak is on fire 🔥`
                  : 'Saved to your history. Come back tomorrow to start a streak 🔥'}
              </p>
              <div className="relative mt-6 grid grid-cols-3 gap-2">
                <Summary Icon={Clock} value={fmt(elapsed)} label="Duration" />
                <Summary Icon={Dumbbell} value={<AnimatedCounter value={totalSets} />} label="Sets" />
                <Summary Icon={Flame} value={<AnimatedCounter value={workout.calories} />} label="kcal" />
              </div>
              <div className="relative mt-8 flex flex-col gap-2 sm:flex-row">
                <button onClick={() => navigate('dashboard')} className="btn-primary flex-1">
                  See my dashboard
                </button>
                <button onClick={reset} className="btn-ghost flex-1">
                  <RotateCcw className="h-4 w-4" /> Do it again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}

function RoundBtn({ children, label, ...rest }) {
  return (
    <button
      aria-label={label}
      title={label}
      className="grid h-12 w-12 place-items-center rounded-full border border-line/10 bg-line/[0.04] text-ink transition hover:-translate-y-0.5 hover:border-line/25 disabled:pointer-events-none disabled:opacity-35"
      {...rest}
    >
      {children}
    </button>
  );
}

function Summary({ Icon, value, label }) {
  return (
    <div className="rounded-2xl bg-line/[0.05] py-3">
      <Icon className="mx-auto h-4 w-4 text-accent" />
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function WorkoutSkeleton() {
  return (
    <div role="status" aria-label="Loading your workout">
      <Skeleton className="mb-3 h-3 w-28" />
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <SkeletonCard className="flex flex-col items-center">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-6 h-56 w-56 rounded-full" />
          <Skeleton className="mt-6 h-14 w-56 rounded-full" />
        </SkeletonCard>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i}>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div>
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="mt-2 h-4 w-32" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {[0, 1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-12 w-[4.5rem] rounded-xl" />
                ))}
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}
