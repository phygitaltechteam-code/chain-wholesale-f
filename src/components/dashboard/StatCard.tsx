import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

// ── Brand palette tokens ──────────────────────────────────────────────────────
// Gold primary: #785600  |  Gold light: #FFDEA6  |  Gold dark: #986D00
// Silver:       #5D5C74  |  Silver light: #5D5C74/15
// Positive:     #059669  |  Negative: #DC2626
// Surface:      #F4F4F2  |  White: #FFFFFF  |  Hover: #EEEEEC
// Heading:      #1A1C1B  |  Label: #817563  |  Border: #D3C4AF

interface StatItem {
  label: string;
  value: string;
  unit?: string;
  isPositive?: boolean;
}

interface StatCardProps {
  title: string;
  icon?: LucideIcon;
  items: StatItem[];
  variant?: 'flat' | 'elevated' | 'low';
  titleClassName?: string;
  /** Show a single hero value with trend badge instead of a list */
  heroMode?: boolean;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'primary' | 'secondary' | 'error';
}

type AccentKey = NonNullable<StatCardProps['accentColor']>;

/* Per-accent design tokens */
const accentTokens: Record<AccentKey, {
  gradient: string;
  border: string;
  iconBg: string;
  iconText: string;
  glow: string;
}> = {
  primary: {
    gradient: 'from-[#785600]/8 to-transparent',
    border:   'border-[#785600]/25',
    iconBg:   'bg-[#FFDEA6]/50',
    iconText: 'text-[#785600]',
    glow:     'from-[#785600]/10 to-transparent',
  },
  secondary: {
    gradient: 'from-[#5D5C74]/8 to-transparent',
    border:   'border-[#5D5C74]/25',
    iconBg:   'bg-[#5D5C74]/10',
    iconText: 'text-[#5D5C74]',
    glow:     'from-[#5D5C74]/10 to-transparent',
  },
  error: {
    gradient: 'from-red-600/8 to-transparent',
    border:   'border-red-600/25',
    iconBg:   'bg-red-50',
    iconText: 'text-red-600',
    glow:     'from-red-600/10 to-transparent',
  },
};

const valueColor = (isPositive?: boolean) => {
  if (isPositive === true)  return 'text-[#059669]';
  if (isPositive === false) return 'text-red-600';
  return 'text-[#1A1C1B]';
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  icon: Icon,
  items,
  variant = 'elevated',
  titleClassName = '',
  heroMode = false,
  trend,
  trendPositive,
  accentColor = 'primary',
}) => {
  const tokens = accentTokens[accentColor];

  const bgClass =
    variant === 'elevated'
      ? 'bg-[#F4F4F2]'
      : variant === 'flat'
      ? 'bg-[#F4F4F2]'
      : 'bg-white';

  return (
    <div
      className={[
        'relative rounded-2xl overflow-hidden border shadow-sm h-full',
        `bg-gradient-to-br ${tokens.gradient}`,
        bgClass,
        tokens.border,
        'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md',
      ].join(' ')}
    >
      {/* Decorative background glow */}
      <div
        className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30 bg-gradient-to-br ${tokens.glow}`}
      />

      <div className="relative p-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-lg font-semibold text-[#4F4535] uppercase tracking-widest ${titleClassName}`}
          >
            {title}
          </span>
          {Icon && (
            <div className={`p-2 rounded-xl ${tokens.iconBg}`}>
              <Icon size={15} className={tokens.iconText} />
            </div>
          )}
        </div>

        {/* ── Hero mode: single big number ── */}
        {heroMode && items[0] && (
          <div>
            <p className={`text-5xl font-bold tracking-tight mb-2.5 ${valueColor(items[0].isPositive)}`}>
              {items[0].value}
              {items[0].unit && (
                <span className="text-base font-normal text-[#817563] ml-1">{items[0].unit}</span>
              )}
            </p>
            {trend && (
              <div
                className={`inline-flex items-center gap-1 text-lg font-semibold px-2.5 py-1 rounded-full ${
                  trendPositive
                    ? 'bg-[#059669]/10 text-[#059669]'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {trendPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {trend}
              </div>
            )}
          </div>
        )}

        {/* ── List mode: multiple rows ── */}
        {!heroMode && (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center ${
                  idx !== items.length - 1
                    ? 'border-b border-[#E2E3E1] pb-3'
                    : ''
                }`}
              >
                <span className="text-md text-[#817563] font-medium">{item.label}</span>
                <span className={`text-base font-bold tabular-nums ${valueColor(item.isPositive)}`}>
                  {item.value}
                  {item.unit && (
                    <span className="text-sm font-normal text-[#817563] ml-0.5">{item.unit}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
