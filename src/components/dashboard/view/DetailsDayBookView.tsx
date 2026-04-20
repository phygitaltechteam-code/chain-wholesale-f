import React from 'react';
import { motion, Variants } from 'framer-motion';
import { StatCard } from '../StatCard';
import { Card } from '../Card';
import {
  Sun, ArrowLeftRight, Lock,
  Download, Maximize2, Calendar, Filter,
  Coins, Gem,
} from 'lucide-react';

// ── Brand palette ─────────────────────────────────────────────────────────────
// Gold: #785600 / #986D00 / light #FFDEA6
// Silver: #5D5C74
// Positive: #059669   Negative: red-600
// Surfaces: #F4F4F2 (container) · #FFFFFF (card)
// Text: #1A1C1B (heading) · #4F4535 (label) · #817563 (meta)
// Borders: #D3C4AF (ghost) · #E2E3E1 (divider)

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

// Source badge colours
const sourceBadge: Record<string, string> = {
  Retail:    'bg-[#FFDEA6]/60 text-[#785600]',
  Bank:      'bg-[#5D5C74]/10 text-[#5D5C74]',
  Wholesale: 'bg-[#817563]/10 text-[#817563]',
};

const TRANSACTIONS = [
  {
    sn: 1, time: '10:15 AM',
    client: 'Rajesh Jewellers', particulars: 'Inv #4092 - Bridal Set',
    source: 'Retail',
    amount: '+ 2,50,000', amountBal: '14,95,000',
    gold: '- 45.50',  goldBal: '1,204.50',
    silver: '-',       silverBal: '8,500.00',
  },
  {
    sn: 2, time: '11:30 AM',
    client: 'HDFC Bank Deposit', particulars: 'Cash deposited to main acc',
    source: 'Bank',
    amount: '- 1,00,000', amountBal: '13,95,000',
    gold: '-',  goldBal: '1,204.50',
    silver: '-', silverBal: '8,500.00',
  },
  {
    sn: 3, time: '02:45 PM',
    client: 'Mehta Bullion Corp', particulars: 'Scrap exchange for coins',
    source: 'Wholesale',
    amount: '+ 1,70,500', amountBal: '15,65,500',
    gold: '-',        goldBal: '1,204.50',
    silver: '+ 120.00', silverBal: '8,620.00',
  },
];

/** Returns the text colour class for a ledger cell value */
const amtColor = (v: string) =>
  v.startsWith('+') ? 'text-[#059669] font-bold' :
  v.startsWith('-') ? 'text-red-600 font-bold' :
  'text-[#817563]';

export const DetailedDayBookView: React.FC = () => {
  return (
    <div className="space-y-6 pb-36">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div
        custom={0} variants={fadeUp as Variants} initial="hidden" animate="show"
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold text-[#4F4535] uppercase tracking-[0.18em] mb-1">
            Ledger View
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1C1B] leading-tight">
            Detailed Day Book
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date pill */}
          <div className="flex items-center gap-2 bg-white border border-[#D3C4AF]/30 rounded-xl px-4 py-2 text-base shadow-sm">
            <Calendar size={16} className="text-[#785600]" />
            <span className="font-medium text-[#1A1C1B]">Oct 24, 2023</span>
          </div>

          {/* Source filter */}
          <div className="flex items-center gap-2 bg-white border border-[#D3C4AF]/30 rounded-xl px-4 py-2 shadow-sm">
            <Filter size={16} className="text-[#817563]" />
            <select className="bg-transparent border-none text-base font-medium text-[#1A1C1B] p-0 focus:ring-0 appearance-none pr-4 cursor-pointer">
              <option>All Sources</option>
              <option>Retail Sales</option>
              <option>Wholesale</option>
              <option>Bank</option>
            </select>
          </div>

          {/* Export button */}
          <button className="flex items-center gap-2 bg-[#785600] text-white px-5 py-2.5 rounded-xl text-base font-semibold hover:bg-[#986D00] active:scale-95 transition-all duration-150 shadow-md shadow-[#785600]/25">
            <Download size={14} />
            Export
          </button>
        </div>
      </motion.div>

      {/* ── Balance Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div custom={1} variants={fadeUp as Variants} initial="hidden" animate="show">
          <StatCard
            title="Opening Balance"
            icon={Sun}
            accentColor="secondary"
            items={[
              { label: 'Amount',     value: '₹ 12,45,000' },
              { label: 'Gold (24K)', value: '1,250.00', unit: 'g' },
              { label: 'Silver',     value: '8,500.00', unit: 'g' },
            ]}
          />
        </motion.div>

        <motion.div custom={2} variants={fadeUp as Variants} initial="hidden" animate="show">
          <StatCard
            title="Today's Activity"
            icon={ArrowLeftRight}
            accentColor="primary"
            items={[
              { label: 'Net Cash',   value: '+₹ 3,20,500', isPositive: true  },
              { label: 'Net Gold',   value: '-45.50',  unit: 'g', isPositive: false },
              { label: 'Net Silver', value: '+120.00', unit: 'g', isPositive: true  },
            ]}
          />
        </motion.div>

        <motion.div custom={3} variants={fadeUp as Variants} initial="hidden" animate="show">
          <StatCard
            title="Closing Balance"
            icon={Lock}
            accentColor="primary"
            titleClassName="text-[#785600]"
            items={[
              { label: 'Amount',     value: '₹ 15,65,500', isPositive: true },
              { label: 'Gold (24K)', value: '1,204.50', unit: 'g' },
              { label: 'Silver',     value: '8,620.00', unit: 'g' },
            ]}
          />
        </motion.div>
      </div>

      {/* ── Transaction Ledger ───────────────────────────────────────────── */}
      <motion.div custom={4} variants={fadeUp as Variants} initial="hidden" animate="show">
        <Card
          title="Transaction Ledger"
          subtitle={`${TRANSACTIONS.length} entries recorded today`}
          noPadding
          action={
            <button className="p-1.5 text-[#817563] hover:bg-[#F4F4F2] rounded-lg transition-colors">
              <Maximize2 size={15} />
            </button>
          }
        >
          {/* ── Desktop Table ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F4F2] border-b border-[#E2E3E1]">
                  {[
                    { label: '#',          cls: 'w-10' },
                    { label: 'Time',       cls: 'w-24' },
                    { label: 'Client',     cls: 'min-w-[180px]' },
                    { label: 'Source',     cls: 'w-28 text-center' },
                    { label: 'Amount (₹)', cls: 'text-right bg-white/60 border-l border-[#E2E3E1]' },
                    { label: 'Gold (g)',   cls: 'text-right bg-[#FFDEA6]/10 border-l border-[#E2E3E1]' },
                    { label: 'Silver (g)', cls: 'text-right bg-[#5D5C74]/5 border-l border-[#E2E3E1]' },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className={`px-5 py-3.5 text-xs font-semibold text-[#817563] uppercase tracking-widest ${col.cls}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E3E1]">
                {TRANSACTIONS.map((tx, idx) => (
                  <motion.tr
                    key={tx.sn}
                    custom={idx}
                    variants={fadeUp as Variants}
                    initial="hidden"
                    animate="show"
                    className="hover:bg-[#EEEEEC] transition-colors group"
                  >
                    <td className="px-5 py-4 text-sm text-[#817563] font-mono">{tx.sn}</td>
                    <td className="px-5 py-4 text-sm text-[#817563] tabular-nums">{tx.time}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-base text-[#1A1C1B]">{tx.client}</div>
                      <div className="text-xs text-[#817563]/80 mt-0.5">{tx.particulars}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${sourceBadge[tx.source] ?? 'bg-[#F4F4F2] text-[#817563]'}`}>
                        {tx.source}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right border-l border-[#E2E3E1] bg-white/40">
                      <div className={`text-base tabular-nums ${amtColor(tx.amount)}`}>{tx.amount}</div>
                      <div className="text-xs text-[#817563] tabular-nums mt-0.5">Bal: {tx.amountBal}</div>
                    </td>
                    <td className="px-5 py-4 text-right border-l border-[#E2E3E1] bg-[#FFDEA6]/5">
                      <div className={`text-base tabular-nums ${amtColor(tx.gold)}`}>{tx.gold}</div>
                      <div className="text-xs text-[#817563] tabular-nums mt-0.5">Bal: {tx.goldBal}</div>
                    </td>
                    <td className="px-5 py-4 text-right border-l border-[#E2E3E1] bg-[#5D5C74]/[0.03]">
                      <div className={`text-base tabular-nums ${amtColor(tx.silver)}`}>{tx.silver}</div>
                      <div className="text-xs text-[#817563] tabular-nums mt-0.5">Bal: {tx.silverBal}</div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="md:hidden divide-y divide-[#E2E3E1]">
            {TRANSACTIONS.map((tx, idx) => (
              <motion.div
                key={tx.sn}
                custom={idx}
                variants={fadeUp as Variants}
                initial="hidden"
                animate="show"
                className="p-4 hover:bg-[#EEEEEC] transition-colors"
              >
                {/* Row 1: time + source badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#817563] tabular-nums">{tx.time}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${sourceBadge[tx.source] ?? 'bg-[#F4F4F2] text-[#817563]'}`}>
                      {tx.source}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#817563]">#{tx.sn}</span>
                </div>

                {/* Row 2: client name */}
                <p className="font-semibold text-base text-[#1A1C1B] mb-0.5">{tx.client}</p>
                <p className="text-xs text-[#817563]/80 mb-3">{tx.particulars}</p>

                {/* Row 3: amount + gold + silver chips */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Amount (₹)', value: tx.amount, bal: tx.amountBal },
                    { label: 'Gold',       value: tx.gold,   bal: tx.goldBal,   icon: Coins },
                    { label: 'Silver',     value: tx.silver, bal: tx.silverBal, icon: Gem },
                  ].map((cell, ci) => (
                    <div key={ci} className="bg-[#F4F4F2] rounded-xl p-2.5 border border-[#D3C4AF]/20">
                      <p className="text-xs text-[#817563] uppercase font-semibold mb-1">{cell.label}</p>
                      <p className={`text-sm tabular-nums ${amtColor(cell.value)}`}>{cell.value}</p>
                      <p className="text-xs text-[#817563] tabular-nums mt-0.5">Bal: {cell.bal}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Floating Footer ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-2xl border-t border-[#D3C4AF]/30 shadow-xl">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <span className="hidden sm:block text-[10px] font-bold text-[#4F4535] uppercase tracking-[0.2em]">
              Net Daily Totals
            </span>

            <div className="flex gap-4 sm:gap-8 md:gap-12 ml-auto">
              {[
                { label: 'Amount',  value: '+ ₹ 3,20,500', positive: true  },
                { label: 'Gold',    value: '- 45.50 g',     positive: false },
                { label: 'Silver',  value: '+ 120.00 g',    positive: true  },
              ].map((item, idx) => (
                <div key={idx} className="text-right">
                  <span className="text-xs sm:text-sm font-semibold text-[#817563] block mb-1 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className={`text-lg sm:text-2xl font-bold tabular-nums ${item.positive ? 'text-[#059669]' : 'text-red-600'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
