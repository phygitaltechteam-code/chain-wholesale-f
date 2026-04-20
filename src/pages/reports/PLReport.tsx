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
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';

interface RevenueItem {
  id: string;
  title: string;
  description: string;
  value: string;
  icon: React.ElementType;
  valueNum: number;
}

interface ExpenseItem {
  id: string;
  title: string;
  description: string;
  value: string;
  icon: React.ElementType;
  valueNum: number;
}

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

  const revenuesData: RevenueItem[] = [
    {
      id: '1',
      title: 'Gold & Diamond Sales',
      description: 'Direct store counter sales',
      value: '₹68,20,000',
      icon: Tag,
      valueNum: 6820000,
    },
    {
      id: '2',
      title: 'Making Charges',
      description: 'Labour and design fees collected',
      value: '₹12,45,000',
      icon: Zap,
      valueNum: 1245000,
    },
    {
      id: '3',
      title: 'Repair & Polishing',
      description: 'Ancillary service revenue',
      value: '₹8,15,000',
      icon: Hammer,
      valueNum: 815000,
    },
  ];

  const expensesData: ExpenseItem[] = [
    {
      id: '1',
      title: 'Bullion Purchases',
      description: 'Raw 24K gold and silver bricks',
      value: '₹52,40,000',
      icon: ShoppingCart,
      valueNum: 5240000,
    },
    {
      id: '2',
      title: 'Karigar Labour',
      description: 'Contractual manufacturing payouts',
      value: '₹8,15,000',
      icon: Hammer,
      valueNum: 815000,
    },
    {
      id: '3',
      title: 'Shop Rent & Bills',
      description: 'Fixed monthly establishment costs',
      value: '₹6,20,000',
      icon: Store,
      valueNum: 620000,
    },
    {
      id: '4',
      title: 'Marketing & Digital',
      description: 'Social media and local ads',
      value: '₹4,90,000',
      icon: Megaphone,
      valueNum: 490000,
    },
  ];

  const totalRevenue = revenuesData.reduce(
    (sum, item) => sum + item.valueNum,
    0,
  );
  const totalExpenses = expensesData.reduce(
    (sum, item) => sum + item.valueNum,
    0,
  );
  const netProfit = totalRevenue - totalExpenses;
  const netProfitLakhs = (netProfit / 100000).toFixed(2);

  // Define columns for Revenue GenericTable
  const revenueColumns: Column<RevenueItem>[] = [
    {
      header: 'Revenue Stream',
      accessor: (item) => (
        <div className="flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#785600]/5 text-[#785600] transition-colors group-hover:bg-[#785600] group-hover:text-white">
            <item.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[#1A1C1B] transition-transform group-hover:translate-x-1">
              {item.title}
            </p>
            <p className="text-[11px] font-medium text-[#5E5B56]/60">
              {item.description}
            </p>
          </div>
        </div>
      ),
      align: 'left',
    },
    {
      header: 'Amount',
      accessor: (item) => (
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl font-bold transition-transform group-hover:scale-105">
            {item.value}
          </span>
          <ChevronRight className="h-4 w-4 rounded-full border p-0.5 text-[#5E5B56]/20 opacity-0 transition-all group-hover:opacity-100" />
        </div>
      ),
      align: 'right',
    },
  ];

  // Define columns for Expenses GenericTable
  const expenseColumns: Column<ExpenseItem>[] = [
    {
      header: 'Expense Category',
      accessor: (item) => (
        <div className="flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/5 text-red-900 transition-colors group-hover:bg-red-900 group-hover:text-white">
            <item.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[#1A1C1B] transition-transform group-hover:translate-x-1">
              {item.title}
            </p>
            <p className="text-[11px] font-medium text-[#5E5B56]/60">
              {item.description}
            </p>
          </div>
        </div>
      ),
      align: 'left',
    },
    {
      header: 'Amount',
      accessor: (item) => (
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl font-bold transition-transform group-hover:scale-105">
            {item.value}
          </span>
          <ChevronRight className="h-4 w-4 rounded-full border p-0.5 text-[#5E5B56]/20 opacity-0 transition-all group-hover:opacity-100" />
        </div>
      ),
      align: 'right',
    },
  ];

  // Custom row class for hover effects
  const rowClassName =
    'group transition-all duration-300 hover:bg-white rounded-2xl cursor-pointer';

  return (
    <div className="font-sans min-h-screen bg-[#F9F7F3] p-8">
      {/* Header Utilities */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1C1B]">
            Live Bullion Rates
          </span>
          <div className="flex items-center gap-3 text-sm font-bold text-[#785600]">
            <span className="rounded-full border border-[#D3C4AF]/10 bg-white px-4 py-2 shadow-sm">
              Gold: ₹6,245
            </span>
            <span className="rounded-full border border-[#D3C4AF]/10 bg-white px-4 py-2 shadow-sm">
              Silver: ₹74,200
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-[#5E5B56] transition-all hover:bg-[#F4F4F2]">
            Print View
          </button>
          <button className="rounded-full bg-gradient-to-br from-[#785600] to-[#5a4000] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90">
            Export All
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Main Title Section */}
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h2 className="font-serif mb-3 text-5xl font-bold tracking-tight text-[#1A1C1B]">
              Profit & Loss Statement
            </h2>
            <p className="text-lg font-medium text-[#5E5B56] opacity-70">
              Financial Overview for the Current Period
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex rounded-xl border border-[#D3C4AF]/10 bg-[#F4F4F2] p-1.5 shadow-sm">
              {(['monthly', 'quarterly', 'annual'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-6 py-2 text-sm font-bold capitalize transition-all ${
                    period === p
                      ? 'bg-white text-[#785600] shadow-md'
                      : 'text-[#5E5B56]/60 hover:text-[#1A1C1B]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[#D3C4AF]/10 bg-[#F4F4F2] px-5 py-2.5 text-[#5E5B56] shadow-sm">
              <Calendar className="h-4 w-4 text-[#785600]" />
              <span className="text-sm font-bold">
                Oct 1, 2023 - Oct 31, 2023
              </span>
            </div>
          </div>
        </div>

        {/* High-Impact Analytics Section */}
        <div className="mb-12 grid grid-cols-12 gap-8">
          {/* Net Profit Card */}
          <div className="relative col-span-12 flex flex-col justify-center overflow-hidden rounded-3xl border border-[#D3C4AF]/5 bg-white p-10 shadow-lg shadow-[#785600]/5 lg:col-span-4">
            <div className="absolute -right-6 -top-6">
              <TrendingUp
                className="h-44 w-44 text-[#785600]/10"
                strokeWidth={1}
              />
            </div>
            <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#5E5B56]/50">
              Net Profit
            </h3>
            <div className="relative z-10 flex items-baseline gap-3">
              <span className="font-serif text-7xl font-bold text-[#785600]">
                ₹{netProfitLakhs}
              </span>
              <span className="font-serif text-3xl text-[#785600]/60">
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
          <div className="col-span-12 rounded-3xl border border-[#D3C4AF]/5 bg-white p-10 shadow-lg shadow-[#785600]/5 lg:col-span-8">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5E5B56]/50">
                Monthly Trends
              </h3>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <div className="h-3 w-3 rounded-full bg-[#785600]" />
                  <span className="text-[#5E5B56]">Revenue</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <div className="h-3 w-3 rounded-full bg-[#D3C4AF]/50" />
                  <span className="text-[#5E5B56]">Expenses</span>
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
                      fill: '#5E5B56',
                      opacity: 0.5,
                    }}
                    dy={16}
                  />
                  <Tooltip
                    cursor={{fill: '#F9F7F3', radius: 4}}
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
                          index === chartData.length - 1 ? '#785600' : '#D3C4AF'
                        }
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="expenses"
                    fill="#E2E3E1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Financial View */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Revenue Section with GenericTable */}
          <section className="overflow-hidden rounded-3xl border border-[#D3C4AF]/5 bg-[#F4F4F2]/50 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D3C4AF]/10 bg-[#F4F4F2] px-10 py-6">
              <h4 className="font-serif text-2xl font-bold italic text-[#785600]">
                Revenue Streams
              </h4>
              <span className="rounded-full border border-[#785600]/20 bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-[#785600]">
                Total: ₹{(totalRevenue / 100000).toFixed(2)} L
              </span>
            </div>
            <div className="p-8">
              <GenericTable
                data={revenuesData}
                columns={revenueColumns}
                title=""
                searchable={false}
                itemsPerPage={10}
                paginationOff={true}
                className="border-0 shadow-none"
              />
            </div>
          </section>

          {/* Expenses Section with GenericTable */}
          <section className="overflow-hidden rounded-3xl border border-[#D3C4AF]/5 bg-[#F4F4F2]/50 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D3C4AF]/10 bg-[#F4F4F2] px-10 py-6">
              <h4 className="font-serif text-2xl font-bold italic text-red-900">
                Operating Expenses
              </h4>
              <span className="rounded-full border border-red-900/20 bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-red-900">
                Total: ₹{(totalExpenses / 100000).toFixed(2)} L
              </span>
            </div>
            <div className="p-8">
              <GenericTable
                data={expensesData}
                columns={expenseColumns}
                title=""
                searchable={false}
                itemsPerPage={10}
                paginationOff={true}
                className="border-0 shadow-none"
              />
            </div>
          </section>
        </div>

        {/* Audit Certification Strip */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-[#D3C4AF]/10 bg-white p-8 shadow-sm md:flex-row">
          <div className="flex items-center gap-6">
            <div className="rounded-2xl bg-[#785600]/5 p-3">
              <Verified className="h-8 w-8 text-[#785600]" />
            </div>
            <div>
              <p className="text-base font-bold text-[#1A1C1B]">
                Account Statement Certified
              </p>
              <p className="text-xs font-medium text-[#5E5B56]/60">
                Last audited by Mr. Mehta on Oct 31, 2023 at 18:45 IST
              </p>
            </div>
          </div>
          <button className="border-b-2 border-[#785600]/20 pb-0.5 text-xs font-black uppercase tracking-[0.2em] text-[#785600] transition-colors hover:border-[#785600]">
            View Ledger Entry Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PLReport;
