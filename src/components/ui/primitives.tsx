import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/* ---------------------------------------------------------------- */
/* Card — the base surface every panel sits on                       */
/* ---------------------------------------------------------------- */
export function Card({
  children,
  className = '',
  hoverable = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl shadow-card ${
        hoverable ? 'transition-all hover:-translate-y-0.5 hover:shadow-pop hover:border-border-soft' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* ProgressRing — donut used for the hero balance + budget cards      */
/* segments: [{ value, color }] — value is 0..1 of the circle         */
/* ---------------------------------------------------------------- */
export function ProgressRing({
  size = 180,
  strokeWidth = 16,
  segments,
  trackColor = 'var(--color-surface-2)',
  children,
}: {
  size?: number;
  strokeWidth?: number;
  segments: { value: number; color: string }[];
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAccum = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const dash = Math.max(seg.value, 0) * circumference;
          const gap = circumference - dash;
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offsetAccum}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
          offsetAccum += dash;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* MiniRing — small single-value ring used on budget-style cards      */
/* ---------------------------------------------------------------- */
export function MiniRing({ percent, color }: { percent: number; color: string }) {
  return (
    <ProgressRing
      size={72}
      strokeWidth={7}
      segments={[{ value: Math.min(Math.max(percent, 0), 1), color }]}
    >
      <span className="text-xs font-mono font-bold text-ink">{Math.round(percent * 100)}%</span>
    </ProgressRing>
  );
}

/* ---------------------------------------------------------------- */
/* Badge — status pill                                                */
/* ---------------------------------------------------------------- */
const badgeTones: Record<string, string> = {
  gain: 'bg-gain-soft text-gain',
  warn: 'bg-warn-soft text-warn',
  loss: 'bg-loss-soft text-loss',
  brand: 'bg-brand-soft text-brand',
  violet: 'bg-violet-soft text-violet',
  neutral: 'bg-surface-2 text-ink-soft',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: keyof typeof badgeTones;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wide ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* StatCard — labeled figure with icon chip and trend dot             */
/* ---------------------------------------------------------------- */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  caption,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: keyof typeof badgeTones;
  caption?: string;
}) {
  const dotColor: Record<string, string> = {
    gain: 'bg-gain',
    warn: 'bg-warn',
    loss: 'bg-loss',
    brand: 'bg-brand',
    violet: 'bg-violet',
    neutral: 'bg-ink-faint',
  };
  return (
    <Card hoverable className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">{label}</p>
          <h3 className="text-xl font-display font-bold text-ink mt-1.5">{value}</h3>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${badgeTones[tone]}`}>
          <Icon size={16} />
        </div>
      </div>
      {caption && (
        <p className="text-[11px] text-ink-soft mt-3 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor[tone]}`} />
          {caption}
        </p>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* ThemeToggle — sun/moon switch                                      */
/* ---------------------------------------------------------------- */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-[52px] h-8 rounded-full bg-surface-2 border border-border cursor-pointer transition-colors hover:border-brand/50"
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow-card border border-border flex items-center justify-center transition-all duration-200 ${
          isDark ? 'left-[calc(100%-1.75rem)] text-brand' : 'left-0.5 text-warn'
        }`}
      >
        {isDark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
    </button>
  );
}
