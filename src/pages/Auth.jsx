import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Eye, EyeOff, Loader2, Lock, Mail, Timer, UserRound } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { Backdrop } from '../components/Layout';
import { useApp } from '../context/AppContext';
import { isOffline } from '../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Auth({ mode }) {
  const { navigate, login, signup, toast } = useApp();
  const isSignup = mode === 'signup';
  const [form, setForm] = useState({ fullName: '', email: '', password: '', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 150 });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (isSignup && form.fullName.trim().length < 2) return setError('Please enter your name.');
    if (!form.email.trim() || !form.password) return setError('Please enter your email and password.');
    if (isSignup && (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) {
      return setError('Use at least 8 characters, including a letter and a number.');
    }
    setBusy(true);
    try {
      if (isSignup) {
        const me = await signup({ ...form, fullName: form.fullName.trim() });
        toast({ title: `Welcome to PulseFit, ${me.fullName.split(' ')[0]}! 🎉`, message: 'Pick a few exercises to build today’s workout.' });
      } else {
        const me = await login(form.email, form.password);
        toast({ title: `Welcome back, ${me.fullName.split(' ')[0]}! 💪`, message: 'Let’s keep that streak going.' });
      }
    } catch (err) {
      setError(err.message);
      if (isOffline(err)) toast({ type: 'error', title: 'Connection problem', message: err.message, duration: 6000 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Backdrop />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[50rem]" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo onClick={() => navigate('landing')} />
        <ThemeToggle />
      </header>

      <main className="relative mx-auto flex max-w-md flex-col px-4 pb-16 pt-6 sm:pt-12">
        <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0} className="eyebrow text-center">
          {isSignup ? 'Join PulseFit' : 'Welcome back'}
        </motion.p>
        <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1} className="mt-3 text-center text-4xl font-bold sm:text-5xl">
          {isSignup ? (
            <>
              Start your <span className="text-gradient animate-shimmer">streak.</span>
            </>
          ) : (
            <>
              Ready to <span className="text-gradient animate-shimmer">train?</span>
            </>
          )}
        </motion.h1>
        <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-3 text-center text-muted">
          {isSignup ? 'Set your weekly goals and we’ll track every rep.' : 'Log in to pick up right where you left off.'}
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="relative mt-8">
          <div className="absolute inset-6 rounded-[2.5rem] bg-brand-gradient opacity-20 blur-3xl" aria-hidden="true" />
          <form onSubmit={submit} className="glass relative space-y-4 !rounded-[2rem] p-6 sm:p-8" noValidate>
            {isSignup && (
              <Field Icon={UserRound} label="Full name" value={form.fullName} onChange={set('fullName')} autoComplete="name" placeholder="Alex Morgan" />
            )}
            <Field Icon={Mail} label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />
            <Field
              Icon={Lock}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? '8+ characters, a letter and a number' : 'Your password'}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-line/10 hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {isSignup && (
              <div className="space-y-4 rounded-2xl border border-line/[0.08] bg-line/[0.03] p-4">
                <p className="eyebrow">Your weekly goals</p>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Dumbbell className="h-4 w-4 text-accent" /> Workouts per week
                  </p>
                  <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label="Workouts per week">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                      const active = form.weeklyGoalWorkouts === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => set('weeklyGoalWorkouts')(n)}
                          className={`h-10 rounded-xl font-display font-semibold transition ${
                            active ? 'bg-brand-gradient text-[#0B0F14] shadow-glow' : 'border border-line/10 text-muted hover:border-line/25 hover:text-ink'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label htmlFor="goal-minutes" className="mb-2 flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-accent" /> Active minutes per week
                    </span>
                    <span className="font-display text-base font-bold tabular-nums">{form.weeklyGoalMinutes} min</span>
                  </label>
                  <input
                    id="goal-minutes"
                    type="range"
                    min={30}
                    max={600}
                    step={15}
                    value={form.weeklyGoalMinutes}
                    onChange={(e) => set('weeklyGoalMinutes')(Number(e.target.value))}
                    className="w-full accent-lime-400"
                  />
                </div>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit" disabled={busy} className="btn-primary group w-full py-4 text-lg">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {isSignup ? 'Create my account' : 'Log in'}
              {!busy && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
        </motion.div>

        <motion.p variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-6 text-center text-sm text-muted">
          {isSignup ? 'Already a member?' : 'New to PulseFit?'}{' '}
          <button
            onClick={() => navigate(isSignup ? 'login' : 'signup', { replace: true })}
            className="font-semibold text-accent underline-offset-4 hover:underline"
          >
            {isSignup ? 'Log in' : 'Create an account'}
          </button>
        </motion.p>
      </main>
    </div>
  );
}

function Field({ Icon, label, trailing, ...input }) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          id={id}
          required
          className="w-full rounded-2xl border border-line/10 bg-line/[0.03] py-3.5 pl-12 pr-12 text-ink placeholder:text-muted/70 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-lime-400/50"
          {...input}
        />
        {trailing && <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
    </div>
  );
}
