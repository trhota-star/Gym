import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, LineChart as LineIcon, Medal, Table2, TrendingUp, Trophy } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import AnimatedCounter from '../components/AnimatedCounter';
import { personalRecords, strengthHistory } from '../data/mock';

// Fixed entity → color mapping (validated for CVD separation in both themes)
const series = [
  { key: 'squat', label: 'Squat', color: 'var(--c1)' },
  { key: 'bench', label: 'Bench', color: 'var(--c2)' },
  { key: 'deadlift', label: 'Deadlift', color: 'var(--c3)' },
];

const ranges = [
  { key: 6, label: '6 wks' },
  { key: 12, label: '12 wks' },
];

const tiers = {
  gold: { cls: 'from-amber-300 to-yellow-500', label: 'Gold', Icon: Trophy },
  silver: { cls: 'from-slate-200 to-slate-400', label: 'Silver', Icon: Medal },
  bronze: { cls: 'from-orange-300 to-amber-700', label: 'Bronze', Icon: Award },
};

export default function Progress() {
  const [range, setRange] = useState(12);
  const [view, setView] = useState('chart');
  const data = strengthHistory.slice(-range);
  const first = data[0];
  const last = data[data.length - 1];
  const totalGain = series.reduce((s, x) => s + (last[x.key] - first[x.key]), 0);

  return (
    <div>
      <PageHeader eyebrow="Progress" title="Stronger every week" subtitle="Estimated one-rep max for your main lifts, plus the records you’ve smashed." />

      {/* Stat tiles */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label={`Total gain · ${range} wks`} value={totalGain} decimals={1} suffix=" kg" accent />
        {series.map((s) => (
          <Tile
            key={s.key}
            label={`${s.label} e1RM`}
            value={last[s.key]}
            decimals={1}
            suffix=" kg"
            delta={`+${(last[s.key] - first[s.key]).toFixed(1)} kg`}
          />
        ))}
      </div>

      <GlassCard hover={false}>
        {/* Controls in one row above the chart */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Strength over time</h2>
            <p className="text-sm text-muted">Estimated 1RM, kg</p>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-xl bg-line/[0.05] p-1">
              {ranges.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${range === r.key ? 'bg-surface text-ink shadow' : 'text-muted hover:text-ink'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl bg-line/[0.05] p-1">
              {[
                { k: 'chart', Icon: LineIcon, l: 'Chart view' },
                { k: 'table', Icon: Table2, l: 'Table view' },
              ].map(({ k, Icon, l }) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  aria-label={l}
                  title={l}
                  className={`rounded-lg px-2.5 py-1.5 transition ${view === k ? 'bg-surface text-ink shadow' : 'text-muted hover:text-ink'}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <ul className="mt-4 flex flex-wrap gap-4 text-sm">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-muted">
              <span className="h-0.5 w-5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>

        {view === 'chart' ? (
          <div className="mt-4 h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart key={range} data={data} margin={{ top: 10, right: 64, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} domain={[(min) => Math.floor((min - 5) / 20) * 20, (max) => Math.ceil((max + 5) / 20) * 20]}
                  allowDecimals={false} width={56} />
                <Tooltip content={<StrengthTooltip />} cursor={{ stroke: 'rgb(var(--muted))', strokeDasharray: '4 4' }} />
                {series.map((s, i) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--surface))', fill: s.color }}
                    animationDuration={1400}
                    animationBegin={i * 150}
                    label={<EndLabel last={data.length - 1} text={s.label} />}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 max-h-80 overflow-auto rounded-2xl border border-line/[0.08]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Week</th>
                  {series.map((s) => (
                    <th key={s.key} className="px-4 py-2.5 text-right font-medium">{s.label} (kg)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.week} className="border-t border-line/[0.06]">
                    <td className="px-4 py-2.5 font-medium">{row.week}</td>
                    {series.map((s) => (
                      <td key={s.key} className="px-4 py-2.5 text-right tabular-nums">{row[s.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* PRs */}
      <div className="mt-10 mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow">Hall of fame</p>
          <h2 className="mt-1 text-2xl font-bold">Personal records</h2>
        </div>
        <span className="text-sm text-muted">{personalRecords.length} PRs</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {personalRecords.map((pr, i) => {
          const t = tiers[pr.tier];
          return (
            <GlassCard key={pr.lift} delay={i * 0.06} className="group">
              <div className="flex items-start justify-between">
                <motion.div
                  whileHover={{ rotate: [0, -12, 12, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${t.cls} shadow-lg`}
                >
                  <t.Icon className="h-7 w-7 text-[#0B0F14]/80" />
                </motion.div>
                <span className="rounded-full bg-line/[0.06] px-2.5 py-1 text-xs font-semibold text-muted">{t.label}</span>
              </div>
              <p className="mt-4 text-sm text-muted">{pr.lift}</p>
              <p className="font-display text-3xl font-bold">{pr.value}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                  <TrendingUp className="h-4 w-4" /> {pr.delta}
                </span>
                <span className="text-muted">{pr.date}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

function Tile({ label, value, decimals, suffix, delta, accent }) {
  return (
    <GlassCard className={accent ? '!bg-brand-gradient !border-transparent text-[#0B0F14]' : ''}>
      <p className={`text-xs sm:text-sm ${accent ? 'text-[#0B0F14]/70' : 'text-muted'}`}>{label}</p>
      <p className="mt-1 font-display text-2xl font-bold sm:text-3xl">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </p>
      {delta && <p className="mt-1 text-xs font-semibold text-emerald-500">{delta}</p>}
    </GlassCard>
  );
}

function EndLabel({ x, y, index, last, text }) {
  if (index !== last) return null;
  return (
    <text x={x + 8} y={y} dy={4} fontSize={12} fontWeight={600} fill="rgb(var(--ink))">
      {text}
    </text>
  );
}

function StrengthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass min-w-[10rem] !rounded-xl px-3 py-2 text-sm">
      <p className="mb-1 font-display font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: p.stroke }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums">{p.value} kg</span>
        </p>
      ))}
    </div>
  );
}
