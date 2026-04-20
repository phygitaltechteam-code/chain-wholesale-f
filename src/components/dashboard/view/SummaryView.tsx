import React from 'react';
import { motion, Variants } from 'framer-motion';
import { StatCard } from '../StatCard';
import { Card } from '../Card';
import {
  TrendingUp,
  Banknote,
  Landmark,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Gem,
  CalendarDays,
} from 'lucide-react';

// ── Brand palette ─────────────────────────────────────────────────────────────
// Gold: #785600 / #986D00 / light #FFDEA6
// Silver: #5D5C74
// Positive: #059669   Negative: #DC2626
// Surfaces: #F9F9F7 (page) · #F4F4F2 (container) · #FFFFFF (card)
// Text: #1A1C1B (heading) · #4F4535 (label) · #817563 (meta/muted)
// Borders: #D3C4AF (ghost) · #E2E3E1 (divider)

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

export const SummaryView: React.FC = () => {
  return (
    <div className="space-y-6 pb-8">

      {/* ── Page Title Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#4F4535] uppercase tracking-[0.18em] mb-1">
            Executive Summary
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1C1B] leading-tight">
            Day Book Summary
          </h2>
        </div>
        <div className="flex items-center gap-2 text-base text-[#817563] bg-white border border-[#D3C4AF]/30 rounded-xl px-3 py-2 self-start sm:self-auto shadow-sm">
          <CalendarDays size={16} className="text-[#785600]" />
          <span className="font-medium text-[#1A1C1B] text-base">Oct 24, 2023</span>
        </div>
      </div>

      {/* ── Hero Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Net Cash Flow – hero card spanning 2 cols */}
        <motion.div
          className="sm:col-span-2"
          custom={0} variants={fadeUp as Variants} initial="hidden" animate="show"
        >
          {/* Gradient backdrop: white → F4F4F2 with a gold glow */}
          <Card variant="gradient" hoverable className="h-full relative overflow-hidden">
            {/* Decorative gold circle */}
            <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-[#785600]/6 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold text-[#4F4535] uppercase tracking-widest">
                    Net Cash Flow
                  </p>
                  {/* Trend badge */}
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#059669]/10 text-[#059669]">
                    <TrendingUp size={11} />
                    +12.5% vs yesterday
                  </div>
                </div>
                {/* Icon chip */}
                <div className="p-3 rounded-2xl bg-[#FFDEA6]/50 border border-[#785600]/20">
                  <Banknote size={22} className="text-[#785600]" />
                </div>
              </div>

              <p className="text-5xl sm:text-6xl font-bold text-[#1A1C1B] tracking-tight">
                ₹&nbsp;4,25,000
              </p>

              {/* Animated progress bar */}
              <div className="mt-6 h-1.5 w-full bg-[#EEEEEC] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ delay: 0.4, duration: 0.9, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-[#785600] to-[#986D00]"
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-[#817563]">
                <span>0%</span>
                <span className="text-[#785600] font-semibold">75% of target</span>
                <span>100%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Total Cash In */}
        <motion.div custom={1} variants={fadeUp as Variants} initial="hidden" animate="show">
          <StatCard
            title="Total Cash In"
            icon={ArrowUpRight}
            heroMode
            trend="+8.2% today"
            trendPositive
            accentColor="primary"
            items={[{ label: 'Amount', value: '₹ 8,50,000', isPositive: true }]}
          />
        </motion.div>

        {/* Total Cash Out */}
        <motion.div custom={2} variants={fadeUp as Variants} initial="hidden" animate="show">
          <StatCard
            title="Total Cash Out"
            icon={ArrowDownRight}
            heroMode
            trend="-3.1% today"
            trendPositive={false}
            accentColor="error"
            items={[{ label: 'Amount', value: '₹ 4,25,000', isPositive: false }]}
          />
        </motion.div>
      </div>

      {/* ── Metal Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div custom={3} variants={fadeUp as Variants} initial="hidden" animate="show">
          <StatCard
            title="Gold Net (24K)"
            icon={Coins}
            accentColor="primary"
            items={[
              { label: 'Received', value: '2,400.00', unit: 'g', isPositive: true  },
              { label: 'Issued',   value: '1,149.50', unit: 'g', isPositive: false },
              { label: 'Net',      value: '+ 1,250.50', unit: 'g', isPositive: true },
            ]}
          />
        </motion.div>
        <motion.div custom={4} variants={fadeUp as Variants} initial="hidden" animate="show">
          <StatCard
            title="Silver Net"
            icon={Gem}
            accentColor="secondary"
            items={[
              { label: 'Received', value: '1,200.00', unit: 'g', isPositive: true  },
              { label: 'Issued',   value: '6,600.00', unit: 'g', isPositive: false },
              { label: 'Net',      value: '- 5,400.00', unit: 'g', isPositive: false },
            ]}
          />
        </motion.div>
      </div>

      {/* ── Detail Panels ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Funds Breakdown */}
        <motion.div custom={5} variants={fadeUp as Variants} initial="hidden" animate="show">
          <Card title="Funds Breakdown" subtitle="Today's cash distribution" variant="lowest" hoverable>
            <div className="space-y-3">
              {[
                {
                  label:  'Hard Cash',
                  detail: 'Physical vault',
                  amount: '₹ 2,10,000',
                  pct:    25,
                  icon:   Banknote,
                  iconBg: 'bg-[#FFDEA6]/50',
                  iconColor: 'text-[#785600]',
                  bar:    'bg-[#785600]',
                },
                {
                  label:  'Bank Transfers',
                  detail: 'NEFT / RTGS',
                  amount: '₹ 5,40,000',
                  pct:    63,
                  icon:   Landmark,
                  iconBg: 'bg-[#5D5C74]/10',
                  iconColor: 'text-[#5D5C74]',
                  bar:    'bg-[#5D5C74]',
                },
                {
                  label:  'Digital / UPI',
                  detail: 'Counter scans',
                  amount: '₹ 1,00,000',
                  pct:    12,
                  icon:   Smartphone,
                  iconBg: 'bg-[#817563]/10',
                  iconColor: 'text-[#817563]',
                  bar:    'bg-[#817563]',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-[#F4F4F2] hover:bg-[#EEEEEC] transition-all duration-200 cursor-default border border-[#D3C4AF]/20"
                >
                  <div className={`p-3 rounded-xl ${item.iconBg} group-hover:scale-105 transition-transform`}>
                    <item.icon size={20} className={item.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <p className="font-semibold text-base text-[#1A1C1B] truncate">{item.label}</p>
                      <p className="font-bold text-base text-[#1A1C1B] ml-2 tabular-nums">{item.amount}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-[#EEEEEC] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ delay: 0.3 + idx * 0.1, duration: 0.7, ease: 'easeOut' }}
                          className={`h-full rounded-full ${item.bar}`}
                        />
                      </div>
                      <span className="text-xs text-[#817563] font-medium w-7 text-right">{item.pct}%</span>
                    </div>
                    <p className="text-[18px] text-[#817563]/70 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Metal Movements */}
        <motion.div custom={6} variants={fadeUp as Variants} initial="hidden" animate="show">
          <Card title="Metal Movements" subtitle="Received vs. issued today" variant="lowest" hoverable>
            <div className="space-y-6">
              {[
                {
                  name:         'Gold (Fine)',
                  net:          '+ 1,250.50 g',
                  netPositive:  true,
                  received:     '2,400.00 g',
                  issued:       '1,149.50 g',
                  receivedPct:  68,
                  issuedPct:    32,
                  dotColor:     'bg-[#986D00]',
                  netColor:     'text-[#985600]',
                  barColor:     'bg-[#785600]',
                  barIssued:    'bg-[#FFDEA6]',
                },
                {
                  name:         'Silver (Fine)',
                  net:          '- 5,400.00 g',
                  netPositive:  false,
                  received:     '1,200.00 g',
                  issued:       '6,600.00 g',
                  receivedPct:  15,
                  issuedPct:    85,
                  dotColor:     'bg-[#5D5C74]',
                  netColor:     'text-[#5D5C74]',
                  barColor:     'bg-[#5D5C74]',
                  barIssued:    'bg-[#5D5C74]/25',
                },
              ].map((metal, idx) => (
                <div key={idx}>
                  {/* Metal header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${metal.dotColor}`} />
                      <span className="font-semibold text-base text-[#1A1C1B]">{metal.name}</span>
                    </div>
                    <span className={`font-bold text-sm tabular-nums ${metal.netColor} ${!metal.netPositive ? '!text-red-600' : ''}`}>
                      {metal.net}
                    </span>
                  </div>
                  {/* Received / Issued tiles */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: 'Received', value: metal.received, pct: metal.receivedPct, bar: metal.barColor },
                      { type: 'Issued',   value: metal.issued,   pct: metal.issuedPct,   bar: metal.barIssued },
                    ].map((tile) => (
                      <div
                        key={tile.type}
                        className="bg-[#F4F4F2] rounded-xl p-3.5 border border-[#D3C4AF]/20"
                      >
                        <p className="text-xs text-[#817563] uppercase tracking-wider mb-1.5 font-semibold">
                          {tile.type}
                        </p>
                        <p className="font-bold text-base text-[#1A1C1B] tabular-nums">{tile.value}</p>
                        <div className="mt-2 h-1 rounded-full bg-[#EEEEEC] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tile.pct}%` }}
                            transition={{ delay: 0.3 + idx * 0.15, duration: 0.7, ease: 'easeOut' }}
                            className={`h-full rounded-full ${tile.bar}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};
