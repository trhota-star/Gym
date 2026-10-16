import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Dumbbell, Flame, Play, Plus, Target, Timer, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';
import AnimatedCounter from '../components/AnimatedCounter';
import QuoteCard from '../components/QuoteCard';
import ErrorState from '../components/ErrorState';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

const TODAY_INDEX = 6; // the chart ends with today

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const longDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

const classTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

function classDay(iso) {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

function motivation({ workouts }) {
  const left = workouts.target - workouts.done;
  if (left <= 0) return 'Weekly workout goal smashed. Everything from here is a bonus! 🏆';
  if (left === 1) return 'You’re 1 workout away from smashing your weekly goal.';
  return `${left} workouts to go to hit your weekly goal. You’ve got this.`;
}

function coachNote(workout) {
  if (workout.status === 'completed') return `Done in ${workout.durationMinutes} min. Great work. Recovery is part of the plan too.`;
  if (workout.status === 'in_progress') return `You’re ${workout.completedSets} of ${workout.totalSets} sets in. Jump back in and finish strong.`;
  return 'The rest timer starts on its own after every set. Just tap and breathe.';
}

export default function Dashboard() {
  const { navigate, toast } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api('/api/dashboard'));
    } catch (err) {
      setError(err);
      toast({ type: 'error', title: 'Couldn’t load your dashboard', message: err.message, duration: 6000 });
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) return <ErrorState error={error} onRetry={load} />;
  if (!data) return <DashboardSkeleton />;

  const { workout, weeklyActivity, streak, goals: weeklyGoals, nextClass, firstName } = data;
  const hasWorkout = workout && workout.exercises.length > 0;
  const totalMinutes = weeklyActivity.reduce((s, d) => s + d.minutes, 0);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <p className="eyebrow mb-2">{longDate()}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          {greeting()}, {firstName} <span className="inline-block origin-[70%_70%] animate-[wave_2s_ease-in-out_1]">👋</span>
        </h1>
        <p className="mt-2 text-muted">{motivation(weeklyGoals)}</p>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's workout */}
        <GlassCard className="lg:col-span-2" hover={false}>
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime-400/20 blur-3xl" />
          {hasWorkout ? (
            <>
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-semibold text-accent">
                    {workout.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                    {workout.status === 'completed' ? 'Completed today' : 'Today’s workout'}
                  </span>
                  <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{workout.name}</h2>
                  <p className="mt-1 text-muted">{workout.muscleGroups.join(' · ')}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-sm">
                    <Meta
                      Icon={Clock}
                      text={workout.status === 'completed' ? `${workout.durationMinutes} min` : `~${workout.estimatedMinutes} min`}
                    />
                    <Meta Icon={Flame} text={`~${workout.calories} kcal`} />
                    <Meta Icon={Dumbbell} text={`${workout.exercises.length} ${workout.exercises.length === 1 ? 'exercise' : 'exercises'}`} />
                  </div>
                </div>
                <button onClick={() => navigate('workout')} className="btn-primary group shrink-0 px-7 py-4 text-lg">
                  <Play className="h-5 w-5 fill-current" />
                  {workout.status === 'in_progress' ? 'Continue' : workout.status === 'completed' ? 'Review' : 'Start'}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              <ul className="relative mt-6 grid gap-2 sm:grid-cols-2">
                {workout.exercises.map((e, i) => (
                  <li key={e.workoutExerciseId} className="flex items-center gap-3 rounded-2xl bg-line/[0.04] px-4 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-line/[0.06] font-display text-sm font-bold text-accent">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.name}</p>
                      <p className="text-xs text-muted">
                        {e.sets.length} × {e.reps} · {e.restSeconds}s rest
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="relative mt-4 text-sm text-muted">
                <span className="font-semibold text-ink">Coach note:</span> {coachNote(workout)}
              </p>
            </>
          ) : (
            <div className="relative flex flex-col items-start gap-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-semibold text-accent">
                  <Zap className="h-3.5 w-3.5" /> Today’s workout
                </span>
                <h2 className="mt-4 text-2xl font-bold sm:text-3xl">No workout yet today.</h2>
                <p className="mt-1 text-muted">Pick one from the Library! Add a few exercises and they’ll show up right here.</p>
              </div>
              <button onClick={() => navigate('library')} className="btn-primary group shrink-0 px-7 py-4 text-lg">
                <Plus className="h-5 w-5" /> Open Library
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </GlassCard>

        {/* Streak */}
        <GlassCard delay={0.08}>
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-orange-500/25 blur-3xl" />
          <p className="eyebrow">Current streak</p>
          <div className="relative mt-4 flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2 }}
              className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-[0_0_40px_-6px_rgba(249,115,22,0.7)]"
            >
              <Flame className="h-11 w-11 fill-yellow-200 text-white" />
            </motion.div>
            <div>
              <p className="font-display text-6xl font-bold leading-none">
                <AnimatedCounter value={streak.current} duration={1.4} />
              </p>
              <p className="mt-1 text-muted">{streak.current === 1 ? 'day' : 'days'} in a row</p>
            </div>
          </div>
          <div className="relative mt-6 flex justify-between">
            {weeklyActivity.map((d, i) => {
              const done = d.minutes > 0;
              const today = i === TODAY_INDEX;
              return (
                <div key={d.date} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                      done
                        ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white'
                        : today
                          ? 'border-2 border-dashed border-orange-400 text-orange-400'
                          : 'bg-line/[0.06] text-muted'
                    }`}
                  >
                    {done ? <Flame className="h-4 w-4" /> : d.day[0]}
                  </span>
                  <span className={`text-[11px] ${today ? 'font-semibold text-ink' : 'text-muted'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
          <p className="relative mt-4 text-sm text-muted">
            Best streak: <span className="font-semibold text-ink">{streak.best} {streak.best === 1 ? 'day' : 'days'}</span>
          </p>
        </GlassCard>

        {/* Rings */}
        <GlassCard delay={0.1} className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">This week</p>
              <h3 className="mt-1 text-xl font-semibold">Goal rings</h3>
            </div>
            <Target className="h-5 w-5 text-muted" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-6">
            <Ring label="Workouts" done={weeklyGoals.workouts.done} target={weeklyGoals.workouts.target} from="#C6FF3D" to="#5CF2A0" Icon={Dumbbell} />
            <Ring label="Active min" done={weeklyGoals.minutes.done} target={weeklyGoals.minutes.target} from="#22D3EE" to="#3B82F6" Icon={Timer} delay={0.2} />
            <Ring label="Goals hit" done={weeklyGoals.goals.done} target={weeklyGoals.goals.target} from="#F472B6" to="#A855F7" Icon={Target} delay={0.4} />
          </div>
        </GlassCard>

        <QuoteCard delay={0.12} />

        {/* Weekly activity chart */}
        <GlassCard delay={0.14} className="lg:col-span-2" hover={false}>
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Last 7 days</p>
              <h3 className="mt-1 text-xl font-semibold">Active minutes per day</h3>
            </div>
            <p className="text-right">
              <span className="font-display text-3xl font-bold">
                <AnimatedCounter value={totalMinutes} />
              </span>
              <span className="ml-1 text-sm text-muted">min total</span>
            </p>
          </div>
          <div className="mt-6 h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} margin={{ top: 8, right: 0, left: -24, bottom: 0 }} barCategoryGap="28%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6FF3D" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={48} allowDecimals={false} />
                <Tooltip content={<ActivityTooltip />} cursor={{ radius: 8 }} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out" minPointSize={3}>
                  {weeklyActivity.map((d, i) => (
                    <Cell
                      key={d.date}
                      fill={d.minutes ? 'url(#barGrad)' : 'rgb(var(--line) / 0.12)'}
                      opacity={i === TODAY_INDEX || d.minutes ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Next class */}
        <GlassCard delay={0.16} className="flex flex-col">
          <p className="eyebrow">Up next</p>
          {nextClass ? (
            <>
              <h3 className="mt-2 text-xl font-semibold">{nextClass.title}</h3>
              <p className="text-sm text-muted">
                {nextClass.intensity} intensity · with {nextClass.coach}
              </p>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-line/[0.04] p-4">
                <CalendarDays className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-display text-2xl font-bold">{classTime(nextClass.startTime)}</p>
                  <p className="text-xs text-muted">
                    {classDay(nextClass.startTime)} · {nextClass.duration} min
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-orange-400">{nextClass.capacity} spots in this class</p>
              <button onClick={() => navigate('classes')} className="btn-ghost mt-auto w-full pt-3">
                View schedule <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <p className="mt-2 text-muted">No more classes this week. Rest up!</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Meta({ Icon, text }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line/10 px-3 py-1.5 text-muted">
      <Icon className="h-4 w-4 text-accent" />
      {text}
    </span>
  );
}

function Ring({ label, done, target, from, to, Icon, delay = 0 }) {
  const pct = target > 0 ? Math.min(done / target, 1) : 0;
  return (
    <div className="flex flex-col items-center text-center">
      <ProgressRing progress={pct} size={104} stroke={9} from={from} to={to} delay={delay} className="sm:scale-110">
        <div>
          <Icon className="mx-auto mb-0.5 h-4 w-4 text-muted" />
          <p className="font-display text-xl font-bold leading-none">
            <AnimatedCounter value={Math.round(pct * 100)} suffix="%" />
          </p>
        </div>
      </ProgressRing>
      <p className="mt-3 text-sm font-semibold sm:mt-5">{label}</p>
      <p className="text-xs text-muted">
        {done} / {target}
      </p>
    </div>
  );
}

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass !rounded-xl px-3 py-2 text-sm">
      <p className="font-display font-semibold">{label}</p>
      {d.minutes ? (
        <p className="text-muted">
          <span className="font-semibold text-ink">{d.minutes} min</span> · {d.calories} kcal
        </p>
      ) : (
        <p className="text-muted">Rest day</p>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="mb-3 h-3 w-36" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="lg:col-span-2">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="mt-4 h-9 w-56" />
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton className="h-3 w-28" />
          <div className="mt-4 flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-3xl" />
            <Skeleton className="h-14 w-16" />
          </div>
          <Skeleton className="mt-6 h-8 w-full rounded-full" />
        </SkeletonCard>
        <SkeletonCard className="lg:col-span-2">
          <Skeleton className="h-6 w-32" />
          <div className="mt-6 grid grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="mx-auto h-24 w-24 rounded-full" />
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard className="h-48" />
      </div>
    </div>
  );
}
