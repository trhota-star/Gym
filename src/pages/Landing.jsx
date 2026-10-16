import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  DatabaseZap,
  Dumbbell,
  Flame,
  LineChart,
  LogOut,
  Play,
  Sparkles,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import AnimatedCounter from '../components/AnimatedCounter';
import ProgressRing from '../components/ProgressRing';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Backdrop } from '../components/Layout';
import { Skeleton } from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { api, initials } from '../lib/api';
import { todaysWorkout } from '../data/mock';

const statItems = [
  { label: 'Members', key: 'members' },
  { label: 'Workouts completed', key: 'workoutsCompleted' },
  { label: 'Classes this week', key: 'classesThisWeek' },
];

const features = [
  { Icon: Dumbbell, title: 'Smart workout library', text: 'Hundreds of moves sorted by muscle group, with sets, reps and difficulty built in.', page: 'library' },
  { Icon: Timer, title: 'Live workout mode', text: 'A huge rest timer, one-tap set tracking and a little celebration when you finish.', page: 'workout' },
  { Icon: LineChart, title: 'Progress you can see', text: 'Strength curves, PR trophies and weekly rings that make consistency visible.', page: 'progress' },
  { Icon: CalendarDays, title: 'Book classes in seconds', text: 'Yoga, HIIT, Spin and Boxing. See spots left and lock in your place.', page: 'classes' },
  { Icon: Flame, title: 'Streaks that stick', text: 'Daily streaks and quotes that keep you coming back, without the guilt trip.', page: 'dashboard' },
  { Icon: Trophy, title: 'Badges worth earning', text: 'Unlock achievements as you level up from First Rep to Unstoppable.', page: 'profile' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Landing() {
  const { navigate, user, logout } = useApp();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    api('/api/stats').then(setStats, setStatsError);
  }, []);

  // Members go straight to their dashboard; new visitors start by signing up
  const startWorkout = () => navigate(user ? 'dashboard' : 'signup');

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Backdrop />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[60rem]" aria-hidden="true" />

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-line/[0.06] bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#features" className="transition hover:text-ink">Features</a>
            <button onClick={() => navigate('classes')} className="transition hover:text-ink">Classes</button>
            <button onClick={() => navigate('progress')} className="transition hover:text-ink">Progress</button>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden items-center gap-2 rounded-xl py-1 pl-1 pr-3 text-sm font-semibold sm:flex">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 font-display text-xs font-bold text-white">
                    {initials(user.fullName)}
                  </span>
                  {user.fullName}
                </span>
                <button onClick={() => navigate('dashboard')} className="btn-primary !px-4 !py-2.5 text-sm">
                  Open app
                </button>
                <button
                  onClick={logout}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-line/[0.03] text-muted transition hover:border-line/25 hover:bg-line/[0.07] hover:text-ink"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('login')} className="btn-ghost !px-4 !py-2.5 text-sm">
                  Log in
                </button>
                <button onClick={() => navigate('signup')} className="btn-primary hidden !px-4 !py-2.5 text-sm sm:inline-flex">
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:pb-24 lg:pt-24">
        <div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-line/[0.04] px-3 py-1.5 text-xs font-semibold text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            New: AI-paced rest timers
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="mt-6 text-[2.9rem] font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
            Train smarter.
            <br />
            <span className="text-gradient animate-shimmer">Get stronger.</span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mt-6 max-w-lg text-lg text-muted">
            <strong className="font-semibold text-ink">PulseFit</strong> plans your workouts, tracks every rep, books your
            favourite classes and keeps your streak alive, all from your pocket.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={startWorkout} className="btn-primary group px-7 py-4 text-lg">
              <Play className="h-5 w-5 fill-current" />
              Start Your Workout
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => navigate('dashboard')} className="btn-ghost px-7 py-4 text-lg">
              See your dashboard
            </button>
          </motion.div>

          {/* Stats */}
          <motion.dl variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="mt-12 grid grid-cols-3 gap-4 border-t border-line/[0.08] pt-8">
            {statItems.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-muted sm:text-sm">{s.label}</dt>
                <dd className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                  {stats ? (
                    <AnimatedCounter value={stats[s.key]} duration={2.2} />
                  ) : statsError ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <Skeleton className="mt-1 h-8 w-20" />
                  )}
                </dd>
              </div>
            ))}
          </motion.dl>
          {statsError && (
            <p className="mt-3 flex items-center gap-2 text-sm text-rose-500" role="alert">
              <DatabaseZap className="h-4 w-4 shrink-0" />
              Live stats are unavailable: {statsError.message}
            </p>
          )}
        </div>

        <HeroVisual />
      </section>

      {/* Features */}
      <section id="features" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Everything in one app</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Built for the way you actually train</h2>
          <p className="mt-4 text-muted">No spreadsheets, no guesswork. Just open the app and lift.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, text, page }, i) => (
            <GlassCard key={title} delay={i * 0.06} className="group cursor-pointer" onClick={() => navigate(page)}>
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-gradient opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30" />
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line/10 bg-line/[0.04] transition group-hover:border-transparent group-hover:bg-brand-gradient group-hover:shadow-glow">
                <Icon className="h-6 w-6 text-accent transition group-hover:text-[#0B0F14]" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] bg-brand-gradient p-8 text-[#0B0F14] sm:p-14"
        >
          <Zap className="absolute -right-6 -top-6 h-48 w-48 rotate-12 opacity-15" strokeWidth={1.5} />
          <h2 className="max-w-xl text-3xl font-bold sm:text-5xl">Your next PR is one workout away.</h2>
          <p className="mt-4 max-w-md text-[#0B0F14]/75">
            {stats?.members
              ? `Join ${stats.members.toLocaleString('en-US')} ${stats.members === 1 ? 'member' : 'members'} training smarter with PulseFit.`
              : 'Join the members training smarter with PulseFit.'}
          </p>
          <button
            onClick={startWorkout}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#0B0F14] px-7 py-4 font-display text-lg font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-2xl"
          >
            Start Your Workout <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Footer />
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-md"
    >
      <div className="absolute inset-6 rounded-[2.5rem] bg-brand-gradient opacity-25 blur-3xl" />

      <div className="glass relative !rounded-[2rem] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Today</p>
            <p className="mt-1 font-display text-2xl font-bold">{todaysWorkout.title}</p>
            <p className="text-sm text-muted">{todaysWorkout.subtitle}</p>
          </div>
          <span className="rounded-full bg-lime-400/15 px-3 py-1 text-xs font-semibold text-accent">{todaysWorkout.duration} min</span>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <ProgressRing progress={0.72} size={190} stroke={14} animateOnView={false} delay={0.8} duration={2}>
            <div>
              <p className="font-display text-4xl font-bold">
                <AnimatedCounter value={72} suffix="%" duration={2} />
              </p>
              <p className="text-xs text-muted">weekly goal</p>
            </div>
          </ProgressRing>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          {[
            { Icon: Flame, v: '430', l: 'kcal' },
            { Icon: Timer, v: '52', l: 'min' },
            { Icon: Dumbbell, v: '13', l: 'sets' },
          ].map(({ Icon, v, l }) => (
            <div key={l} className="rounded-2xl bg-line/[0.04] py-3">
              <Icon className="mx-auto h-4 w-4 text-accent" />
              <p className="mt-1 font-display text-lg font-bold">{v}</p>
              <p className="text-[11px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating chips */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1 }}
        className="glass absolute -left-3 top-[38%] hidden !rounded-2xl px-4 py-3 animate-float sm:block lg:-left-12"
      >
        <div className="flex items-center gap-2.5">
          <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
          <div>
            <p className="font-display font-bold leading-none">12 days</p>
            <p className="text-[11px] text-muted">streak</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3 }}
        className="glass absolute -right-3 top-[52%] hidden !rounded-2xl px-4 py-3 animate-float [animation-delay:2s] sm:block lg:-right-12"
      >
        <div className="flex items-center gap-2.5">
          <Trophy className="h-5 w-5 text-amber-400" />
          <div>
            <p className="font-display font-bold leading-none">New PR!</p>
            <p className="text-[11px] text-muted">Deadlift 172.5 kg</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
