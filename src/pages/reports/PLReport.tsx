import React, {useState} from 'react';
import {
  TrendingUp,
  Calendar,
  Printer,
  Download,
  ShoppingCart,
  Hammer,
  Store,
  Megaphone,
  Verified,
  ArrowUpRight,
  ChevronRight,
  Tag,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const PLReport = () => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>(
    'monthly',
  );

  const chartData = [
    {month: 'MAY', revenue: 60, expenses: 40},
    {month: 'JUN', revenue: 75, expenses: 45},
    {month: 'JUL', revenue: 65, expenses: 50},
    {month: 'AUG', revenue: 90, expenses: 55},
    {month: 'SEP', revenue: 80, expenses: 45},
    {month: 'OCT', revenue: 100, expenses: 60},
  ];

  const revenues = [
    {
      title: 'Gold & Diamond Sales',
      desc: 'Direct store counter sales',
      value: '₹68,20,000',
      icon: Tag,
    },
    {
      title: 'Making Charges',
      desc: 'Labour and design fees collected',
      value: '₹12,45,000',
      icon: Zap,
    },
    {
      title: 'Repair & Polishing',
      desc: 'Ancillary service revenue',
      value: '₹3,85,000',
      icon: Hammer,
    },
  ];

  const expenses = [
    {
      title: 'Bullion Purchases',
      desc: 'Raw 24K gold and silver bricks',
      value: '₹52,40,000',
      icon: ShoppingCart,
    },
    {
      title: 'Karigar Labour',
      desc: 'Contractual manufacturing payouts',
      value: '₹8,15,000',
      icon: Hammer,
    },
    {
      title: 'Shop Rent & Bills',
      desc: 'Fixed monthly establishment costs',
      value: '₹6,20,000',
      icon: Store,
    },
    {
      title: 'Marketing & Digital',
      desc: 'Social media and local ads',
      value: '₹4,90,000',
      icon: Megaphone,
    },
  ];

  return (
    <div className="bg-atelier-bg font-sans min-h-screen p-8">
      {/* Header Utilities */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-serif text-atelier-ink text-2xl font-bold tracking-tight">
            Live Bullion Rates
          </span>
          <div className="text-atelier-gold flex items-center gap-3 text-sm font-bold">
            <span className="bg-atelier-surface-low border-atelier-ink-variant/10 shadow-xs rounded-full border px-4 py-2">
              Gold: ₹6,245
            </span>
            <span className="bg-atelier-surface-low border-atelier-ink-variant/10 shadow-xs rounded-full border px-4 py-2">
              Silver: ₹74,200
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-atelier-surface-highest text-atelier-ink-variant hover:bg-atelier-surface-low rounded-xl px-6 py-2.5 text-sm font-bold transition-all">
            Print View
          </button>
          <button className="bg-linear-to-br from-atelier-gold to-atelier-gold-dark shadow-atelier-gold/20 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90">
            Export All
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Main Title Section */}
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h2 className="font-serif text-atelier-ink mb-3 text-5xl font-bold tracking-tight">
              Profit & Loss Statement
            </h2>
            <p className="text-atelier-ink-variant text-lg font-medium opacity-70">
              Financial Overview for the Current Period
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="bg-atelier-surface-low border-atelier-ink-variant/10 shadow-xs flex rounded-xl border p-1.5">
              {(['monthly', 'quarterly', 'annual'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`
                    rounded-lg px-6 py-2 text-sm font-bold capitalize transition-all
                    ${period === p ? 'text-atelier-gold bg-white shadow-md' : 'text-atelier-ink-variant/60 hover:text-atelier-ink'}
                  `}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="bg-atelier-surface-low border-atelier-ink-variant/10 text-atelier-ink-variant shadow-xs flex items-center gap-3 rounded-xl border px-5 py-2.5">
              <Calendar className="text-atelier-gold h-4 w-4" />
              <span className="text-sm font-bold">
                Oct 1, 2023 - Oct 31, 2023
              </span>
            </div>
          </div>
        </div>

        {/* High-Impact Analytics Section */}
        <div className="mb-12 grid grid-cols-12 gap-8">
          {/* Net Profit Card */}
          <div className="border-atelier-ink-variant/5 relative col-span-12 flex flex-col justify-center overflow-hidden rounded-3xl border bg-white p-10 shadow-[0px_10px_60px_rgba(121,88,0,0.06)] lg:col-span-4">
            <div className="absolute -right-6 -top-6">
              <TrendingUp
                className="text-atelier-gold/10 h-44 w-44"
                strokeWidth={1}
              />
            </div>
            <h3 className="text-atelier-ink-variant/50 mb-8 text-[10px] font-black uppercase tracking-[0.3em]">
              Net Profit
            </h3>
            <div className="relative z-10 flex items-baseline gap-3">
              <span className="font-serif text-atelier-gold text-7xl font-bold">
                ₹12.85
              </span>
              <span className="font-serif text-atelier-gold/60 text-3xl">
                Lakhs
              </span>
            </div>
            <div className="relative z-10 mt-8 flex items-center gap-2 font-bold text-green-600">
              <div className="rounded-full bg-green-50 p-1.5">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <span className="text-sm">14.2% from last month</span>
            </div>
          </div>

          {/* Monthly Trends Chart Card */}
          <div className="border-atelier-ink-variant/5 col-span-12 rounded-3xl border bg-white p-10 shadow-[0px_10px_60px_rgba(121,88,0,0.06)] lg:col-span-8">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="text-atelier-ink-variant/50 text-[10px] font-black uppercase tracking-[0.3em]">
                Monthly Trends
              </h3>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <div className="bg-atelier-gold h-3 w-3 rounded-full" />
                  <span className="text-atelier-ink-variant">Revenue</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <div className="bg-atelier-ink-variant/30 h-3 w-3 rounded-full" />
                  <span className="text-atelier-ink-variant">Expenses</span>
                </div>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{top: 0, right: 0, left: -20, bottom: 0}}
                  barGap={8}
                >
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fontWeight: 900,
                      fill: '#4f4535',
                      opacity: 0.5,
                    }}
                    dy={16}
                  />
                  <Tooltip
                    cursor={{fill: '#f9f9f7', radius: 4}}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-rev-${index}`}
                        fill={
                          index === chartData.length - 1 ? '#785600' : '#d3c4af'
                        }
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="expenses"
                    fill="#e2e3e1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Financial View */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Revenue Section */}
          <section className="bg-atelier-surface-low/50 border-atelier-ink-variant/5 shadow-xs overflow-hidden rounded-3xl border">
            <div className="bg-atelier-surface border-atelier-ink-variant/10 flex items-center justify-between border-b px-10 py-6">
              <h4 className="font-serif text-atelier-gold text-2xl font-bold italic">
                Revenue Streams
              </h4>
              <span className="text-atelier-gold border-atelier-gold/20 rounded-full border bg-white px-3 py-1 text-xs font-black uppercase tracking-widest">
                Total: ₹84.50 L
              </span>
            </div>
            <div className="space-y-2 p-8">
              {revenues.map((r, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between rounded-2xl p-4 transition-all duration-300 hover:bg-white"
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-atelier-gold/5 text-atelier-gold group-hover:bg-atelier-gold flex h-12 w-12 items-center justify-center rounded-2xl transition-colors group-hover:text-white">
                      <r.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-atelier-ink font-bold transition-transform group-hover:translate-x-1">
                        {r.title}
                      </p>
                      <p className="text-atelier-ink-variant/60 text-[11px] font-medium">
                        {r.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl font-bold transition-transform group-hover:scale-105">
                      {r.value}
                    </span>
                    <ChevronRight className="text-atelier-ink-variant/20 h-4 w-4 rounded-full border p-0.5 opacity-0 transition-all group-hover:opacity-100" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Expenses Section */}
          <section className="bg-atelier-surface-low/50 border-atelier-ink-variant/5 shadow-xs overflow-hidden rounded-3xl border">
            <div className="bg-atelier-surface border-atelier-ink-variant/10 flex items-center justify-between border-b px-10 py-6">
              <h4 className="font-serif text-2xl font-bold italic text-red-900">
                Operating Expenses
              </h4>
              <span className="rounded-full border border-red-900/20 bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-red-900">
                Total: ₹71.65 L
              </span>
            </div>
            <div className="space-y-2 p-8">
              {expenses.map((e, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between rounded-2xl p-4 transition-all duration-300 hover:bg-white"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/5 text-red-900 transition-colors group-hover:bg-red-900 group-hover:text-white">
                      <e.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-atelier-ink font-bold transition-transform group-hover:translate-x-1">
                        {e.title}
                      </p>
                      <p className="text-atelier-ink-variant/60 text-[11px] font-medium">
                        {e.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl font-bold transition-transform group-hover:scale-105">
                      {e.value}
                    </span>
                    <ChevronRight className="text-atelier-ink-variant/20 h-4 w-4 rounded-full border p-0.5 opacity-0 transition-all group-hover:opacity-100" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Audit Certification Strip */}
        <div className="border-atelier-ink-variant/10 mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border bg-white p-8 shadow-sm md:flex-row">
          <div className="flex items-center gap-6">
            <div className="bg-atelier-gold/5 rounded-2xl p-3">
              <Verified className="text-atelier-gold h-8 w-8" />
            </div>
            <div>
              <p className="text-atelier-ink text-base font-bold">
                Account Statement Certified
              </p>
              <p className="text-atelier-ink-variant/60 text-xs font-medium">
                Last audited by Mr. Mehta on Oct 31, 2023 at 18:45 IST
              </p>
            </div>
          </div>
          <button className="text-atelier-gold border-atelier-gold/20 hover:border-atelier-gold border-b-2 pb-0.5 text-xs font-black uppercase tracking-[0.2em] transition-colors">
            View Ledger Entry Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PLReport;
