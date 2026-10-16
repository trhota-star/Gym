import { motion } from 'framer-motion';
import {
  Bell, ChevronRight, Crown, Dumbbell, Flame, Lock, MapPin, Medal, Moon, Rocket, Settings, Share2, Sparkles, Sunrise, Timer, Trophy, Users, Zap,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedCounter from '../components/AnimatedCounter';
import ProgressRing from '../components/ProgressRing';
import ThemeToggle from '../components/ThemeToggle';
import { useApp } from '../context/AppContext';
import { achievements, lifetimeStats, user } from '../data/mock';

const Icons = { Zap, Flame, Dumbbell, Sunrise, Users, Trophy, Rocket, Medal, Timer };

export default function Profile() {
  const { toast } = useApp();
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const share = async () => {
    const text = `I'm on a ${user.streak}-day streak on PulseFit 💪`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard', message: 'Paste it anywhere to brag a little.' });
    } catch {
      toast({ type: 'error', title: 'Couldn’t copy that', message: 'Your browser blocked clipboard access. No worries, try again in a sec.' });
    }
  };

  return (
    <div>
      {/* Hero card */}
      <GlassCard hover={false} className="!p-0">
        <div className="relative h-32 overflow-hidden bg-brand-gradient sm:h-40">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <motion.div
            className="absolute -bottom-10 right-10 h-40 w-40 rounded-full bg-white/30 blur-3xl"
            animate={{ x: [0, 30, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>
        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <ProgressRing progress={user.xp / user.xpToNext} size={116} stroke={6} from="#C6FF3D" to="#22D3EE">
                  <span className="grid h-[92px] w-[92px] place-items-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 font-display text-3xl font-bold text-white ring-4 ring-surface">
                    {user.initials}
                  </span>
                </ProgressRing>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[#0B0F14] px-2.5 py-0.5 font-display text-xs font-bold text-lime-400 ring-2 ring-lime-400/60">
                  LVL {user.level}
                </span>
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
                <p className="text-sm text-muted">{user.handle}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={share} className="btn-ghost !py-2.5 text-sm">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button
                onClick={() => toast({ type: 'info', title: 'Settings coming soon', message: 'We’re polishing this one. Hang tight!' })}
                className="btn-ghost !py-2.5 text-sm"
              >
                <Settings className="h-4 w-4" /> Edit
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-3 py-1 font-semibold text-[#0B0F14]">
              <Crown className="h-4 w-4" /> {user.membership} member
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line/10 px-3 py-1 text-muted">
              <MapPin className="h-4 w-4" /> {user.homeGym}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line/10 px-3 py-1 text-muted">
              Since {user.memberSince}
            </span>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>XP to level {user.level + 1}</span>
              <span className="tabular-nums">
                {user.xp.toLocaleString()} / {user.xpToNext.toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line/[0.08]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(user.xp / user.xpToNext) * 100}%` }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="h-full rounded-full bg-brand-gradient shadow-glow"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Lifetime stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {lifetimeStats.map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.05} className="text-center">
            <p className="font-display text-3xl font-bold">
              <AnimatedCounter value={s.value} />
            </p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Achievements */}
      <div className="mb-4 mt-10 flex items-end justify-between">
        <div>
          <p className="eyebrow">Achievements</p>
          <h2 className="mt-1 text-2xl font-bold">Badges & milestones</h2>
        </div>
        <span className="text-sm text-muted">
          {unlocked} / {achievements.length} unlocked
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {achievements.map((a, i) => {
          const Icon = Icons[a.icon] ?? Sparkles;
          return (
            <GlassCard key={a.id} delay={i * 0.04} className={`group text-center ${a.unlocked ? '' : 'opacity-70'}`}>
              <div className="relative mx-auto w-fit">
                {a.unlocked && <div className="absolute inset-0 rounded-full bg-brand-gradient opacity-40 blur-xl transition-opacity group-hover:opacity-70" />}
                <motion.div
                  whileHover={a.unlocked ? { rotate: 360 } : undefined}
                  transition={{ duration: 0.7 }}
                  className={`relative grid h-16 w-16 place-items-center rounded-full ${
                    a.unlocked ? 'bg-brand-gradient text-[#0B0F14]' : 'border-2 border-dashed border-line/20 text-muted'
                  }`}
                >
                  {a.unlocked ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
                </motion.div>
              </div>
              <h3 className="mt-3 font-semibold">{a.title}</h3>
              <p className="mt-0.5 text-xs text-muted">{a.desc}</p>
              {!a.unlocked && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-line/[0.08]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(a.progress / a.target) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full bg-brand-gradient"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {a.progress} / {a.target}
                  </p>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Preferences */}
      <GlassCard hover={false} className="mt-10 !p-2">
        <Row Icon={Moon} title="Appearance" desc="Switch between dark and light mode" right={<ThemeToggle />} />
        <Row
          Icon={Bell}
          title="Workout reminders"
          desc="Daily nudge at 6:30 PM"
          onClick={() => toast({ title: 'Reminders on', message: 'We’ll nudge you at 6:30 PM every day.' })}
        />
        <Row
          Icon={Crown}
          title="Membership"
          desc={`${user.membership} · renews Nov 1`}
          onClick={() => toast({ type: 'info', title: 'You’re already on our top plan', message: 'Thanks for being Pro Elite ✨' })}
        />
      </GlassCard>
    </div>
  );
}

function Row({ Icon, title, desc, right, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-line/[0.04]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-line/[0.05]">
        <Icon className="h-5 w-5 text-accent" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted">{desc}</span>
      </span>
      {right ?? <ChevronRight className="h-5 w-5 text-muted" />}
    </Comp>
  );
}
