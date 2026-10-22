import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowRight, Check, Dumbbell, Flame, Heart, Plus, Search, SearchX, Shield, Timer, Zap } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

const groupIcons = { Chest: Shield, Back: Activity, Legs: Zap, Arms: Dumbbell, Core: Flame, Cardio: Heart };

const difficultyStyle = {
  Beginner: { dots: 1, cls: 'text-emerald-700 dark:text-emerald-500 bg-emerald-500/10' },
  Intermediate: { dots: 2, cls: 'text-amber-700 dark:text-amber-500 bg-amber-500/10' },
  Advanced: { dots: 3, cls: 'text-rose-700 dark:text-rose-500 bg-rose-500/10' },
};

// Exercise ids already in today's (unfinished) workout
const addedIds = (workout) =>
  new Set(workout && workout.status !== 'completed' ? workout.exercises.map((e) => e.exerciseId) : []);

export default function Library() {
  const { toast, navigate } = useApp();
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState('All');
  const [query, setQuery] = useState('');
  const [added, setAdded] = useState(() => new Set());
  const [pending, setPending] = useState(() => new Set());

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ex, today] = await Promise.all([api('/api/exercises'), api('/api/workouts')]);
      setCatalog(ex);
      setAdded(addedIds(today.workout));
    } catch (err) {
      setError(err);
      toast({ type: 'error', title: 'Couldn’t load the library', message: err.message, duration: 6000 });
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const exercises = catalog?.exercises ?? [];
  const muscleGroups = catalog?.muscleGroups ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter(
      (e) => (group === 'All' || e.muscleGroup === group) && (!q || `${e.name} ${e.equipment}`.toLowerCase().includes(q))
    );
  }, [exercises, group, query]);

  const setFlag = (setter, id, on) =>
    setter((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const toggle = async (ex) => {
    if (pending.has(ex.id)) return;
    const wasAdded = added.has(ex.id);
    setFlag(setAdded, ex.id, !wasAdded); // optimistic
    setFlag(setPending, ex.id, true);
    try {
      const { workout } = wasAdded
        ? await api('/api/workouts', { method: 'DELETE', query: { exerciseId: ex.id } })
        : await api('/api/workouts', { method: 'POST', body: { exerciseId: ex.id } });
      setAdded(addedIds(workout));
      if (wasAdded) toast({ type: 'info', title: 'Removed from today’s workout', message: ex.name });
      else toast({ title: 'Added to today’s workout 💪', message: `${ex.name} · ${ex.sets} × ${ex.reps}` });
    } catch (err) {
      setFlag(setAdded, ex.id, wasAdded); // roll back
      toast({ type: 'error', title: wasAdded ? 'Couldn’t remove that' : 'Couldn’t add that', message: err.message });
    } finally {
      setFlag(setPending, ex.id, false);
    }
  };

  if (error && !catalog) return <ErrorState error={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        eyebrow="Workout library"
        title="Find your next move"
        subtitle={
          catalog
            ? `${exercises.length} coach-approved exercises. Filter by muscle group and add them to today’s workout.`
            : 'Loading coach-approved exercises…'
        }
        actions={
          added.size > 0 && (
            <button onClick={() => navigate('workout')} className="btn-primary group">
              Start workout ({added.size}) <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises or equipment…"
          className="glass w-full !rounded-2xl py-3.5 pl-12 pr-4 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-lime-400/50"
          aria-label="Search exercises"
        />
      </div>

      {!catalog ? (
        <LibrarySkeleton />
      ) : (
        <>
          {/* Filters */}
          <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {['All', ...muscleGroups].map((g) => {
              const Icon = groupIcons[g];
              return (
                <button key={g} onClick={() => setGroup(g)} className={`chip ${group === g ? 'chip-active' : ''}`}>
                  {Icon && <Icon className="h-4 w-4" />}
                  {g}
                  <span className="text-xs opacity-60">
                    {g === 'All' ? exercises.length : exercises.filter((e) => e.muscleGroup === g).length}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={exercises.length ? 'No exercises found' : 'The library is empty'}
              message={
                exercises.length
                  ? `Nothing matches “${query}” in ${group === 'All' ? 'any group' : group}. Try a different word or clear the filters.`
                  : 'No exercises in the database yet. Run “npm run db:setup” to load the sample library.'
              }
              action={
                exercises.length > 0 && (
                  <button className="btn-ghost" onClick={() => { setQuery(''); setGroup('All'); }}>
                    Clear filters
                  </button>
                )
              }
            />
          ) : (
            <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((ex, i) => (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex}
                    index={i}
                    added={added.has(ex.id)}
                    busy={pending.has(ex.id)}
                    onToggle={() => toggle(ex)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// forwardRef: AnimatePresence "popLayout" measures exiting cards through a ref
const ExerciseCard = forwardRef(function ExerciseCard({ ex, index, added, busy, onToggle }, ref) {
  const Icon = groupIcons[ex.muscleGroup];
  const diff = difficultyStyle[ex.difficulty];
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(index * 0.03, 0.3) } }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      whileHover={{ y: -5 }}
      className="glass group relative flex flex-col overflow-hidden p-5"
      title={ex.description}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-gradient opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25" />
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-line/[0.05]">
          <Icon className="h-5 w-5 text-accent" />
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${diff.cls}`}>
          <span className="flex gap-0.5">
            {[1, 2, 3].map((n) => (
              <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= diff.dots ? 'bg-current' : 'bg-current opacity-25'}`} />
            ))}
          </span>
          {ex.difficulty}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-tight">{ex.name}</h3>
      <p className="mt-1 text-sm text-muted">
        {ex.muscleGroup} · {ex.equipment}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Sets" value={ex.sets} />
        <Stat label="Reps" value={ex.reps} />
        <Stat label="Rest" value={`${ex.restSeconds}s`} />
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <Timer className="h-4 w-4" /> ~{ex.calories} kcal
        </span>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onToggle}
          disabled={busy}
          aria-pressed={added}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:cursor-wait ${
            added ? 'bg-brand-gradient text-[#0B0F14] shadow-glow' : 'border border-line/10 hover:border-line/25'
          }`}
        >
          {added ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" />}
          {added ? 'Added to today' : 'Add to today’s workout'}
        </motion.button>
      </div>
    </motion.article>
  );
});

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-line/[0.04] px-2 py-2.5">
      <dd className="truncate font-display font-bold">{value}</dd>
      <dt className="text-[11px] text-muted">{label}</dt>
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div role="status" aria-label="Loading exercises">
      <div className="mb-6 flex gap-2 overflow-hidden">
        {[64, 80, 72, 68, 70, 72, 84].map((w, i) => (
          <Skeleton key={i} className="h-10 shrink-0 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} className="!p-5">
            <div className="flex justify-between">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-5 w-44" />
            <Skeleton className="mt-2 h-4 w-28" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
            <div className="mt-4 flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-9 w-40 rounded-xl" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
