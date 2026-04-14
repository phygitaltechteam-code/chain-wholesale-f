import {useNavigate} from '@tanstack/react-router';
import React, {useState} from 'react';
import {
  MdArrowBack,
  MdHelpOutline,
  MdReceiptLong,
  MdPictureAsPdf,
  MdTableView,
  MdCandlestickChart,
  MdPieChart,
  MdAccountBalanceWallet,
  MdAssessment,
} from 'react-icons/md';

// ==================== TYPES ====================
interface ReportSummary {
  totalValue: number;
  currency: string;
  fiscalYear: string;
  lastUpdated: string;
}

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'pdf' | 'excel' | 'csv';
  color: string;
}

interface PortfolioStats {
  totalTrades: number;
  totalVolume: number;
  avgTradeValue: number;
  topAsset: string;
}

// ==================== MAIN REPORT COMPONENT ====================
const Report: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'today' | 'month' | 'custom'>('today');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string>('10 mins ago');

  // Dynamic Data (Easy to connect with API later)
  const summary: ReportSummary = {
    totalValue: 1482500,
    currency: '₹',
    fiscalYear: 'FY 23-24',
    lastUpdated: '2 hours ago',
  };

  const stats: PortfolioStats = {
    totalTrades: 1247,
    totalVolume: 2847500,
    avgTradeValue: 2283,
    topAsset: 'Digital Gold',
  };

  const reportOptions: ReportOption[] = [
    {
      id: 'all-transactions',
      title: 'All Transactions Report',
      description:
        'Comprehensive log of every gold, silver, and digital asset trade within the selected period.',
      icon: <MdReceiptLong className="text-3xl text-[#37ec13]" />,
      type: 'pdf',
      color: 'text-red-500',
    },
    {
      id: 'pnl-report',
      title: 'P&L Statement',
      description:
        'Detailed Profit & Loss report with day-wise, asset-wise breakdown.',
      icon: <MdAssessment className="text-3xl text-[#37ec13]" />,
      type: 'pdf',
      color: 'text-amber-500',
    },
    {
      id: 'portfolio-summary',
      title: 'Portfolio Summary',
      description:
        'Asset allocation, performance metrics, and holdings snapshot.',
      icon: <MdPieChart className="text-3xl text-[#37ec13]" />,
      type: 'excel',
      color: 'text-blue-500',
    },
    {
      id: 'trade-history',
      title: 'Trade History',
      description:
        'Complete chronological record of all buy/sell transactions.',
      icon: <MdCandlestickChart className="text-3xl text-[#37ec13]" />,
      type: 'csv',
      color: 'text-emerald-500',
    },
  ];

  // Handle Report Generation
  const handleGenerateReport = async (option: ReportOption) => {
    setIsGenerating(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const fileType = option.type.toUpperCase();
    alert(`✅ ${option.title} generated successfully as ${fileType}!`);

    setLastGenerated('Just now');
    setIsGenerating(false);
  };

  // Format Currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen justify-center bg-[#132210]">
      <div className="text-gray-100 relative flex min-h-screen w-full flex-col overflow-hidden bg-[#000000]">
        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(55,236,19,0.2)] bg-[rgba(0,0,0,0.95)] px-4 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              className="rounded-full p-2 hover:bg-white/10"
              onClick={() => navigate({to: '/dashboard'})}
            >
              <MdArrowBack className="text-xl" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Reports Hub
            </h1>
          </div>
          <button className="rounded-full p-2 transition-colors hover:bg-[rgba(55,236,19,0.1)]">
            <MdHelpOutline className="text-xl text-[#37ec13]" />
          </button>
        </header>

        <main className="w-full flex-1 space-y-8 px-4 py-6 pb-32">
          {/* Fiscal Snapshot Card */}
          <section className="group relative overflow-hidden rounded-2xl border border-[rgba(55,236,19,0.2)] bg-[#0a0a0a] p-6 shadow-[0_0_25px_rgba(55,236,19,0.08)]">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(55,236,19,0.1)] blur-3xl transition-all duration-500 group-hover:bg-[rgba(55,236,19,0.2)]" />

            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(55,236,19,0.8)]">
                    Fiscal Snapshot
                  </p>
                  <h2 className="text-gray-400 mt-1 text-sm">
                    Total Transaction Value
                  </h2>
                </div>

                <span className="rounded border border-[rgba(55,236,19,0.2)] bg-[rgba(55,236,19,0.1)] px-2 py-1 text-[10px] font-bold uppercase text-[#37ec13]">
                  {summary.fiscalYear}
                </span>
              </div>

              <div>
                <span className="text-4xl font-bold tracking-tighter text-white">
                  {summary.currency} {formatCurrency(summary.totalValue)}
                  <span className="text-gray-600 text-xl">.00</span>
                </span>
              </div>

              <p className="text-gray-500 mt-3 text-xs">
                Last updated: {summary.lastUpdated}
              </p>
            </div>
          </section>

          {/* Portfolio Quick Stats */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#0a0a0a] p-4">
              <p className="text-gray-500 text-[10px]">Total Trades</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {stats.totalTrades}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#0a0a0a] p-4">
              <p className="text-gray-500 text-[10px]">Avg Trade Value</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {summary.currency} {formatCurrency(stats.avgTradeValue)}
              </p>
            </div>
          </section>

          {/* Reporting Period Selector */}
          <section>
            <label className="text-gray-500 ml-1 text-[10px] font-bold uppercase tracking-widest">
              Reporting Period
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#0a0a0a] p-1">
              <button
                onClick={() => setPeriod('today')}
                className={`flex-1 rounded-lg py-3 text-xs font-bold transition-all ${
                  period === 'today'
                    ? 'bg-[#37ec13] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Today
              </button>

              <button
                onClick={() => setPeriod('month')}
                className={`flex-1 rounded-lg py-3 text-xs font-bold transition-all ${
                  period === 'month'
                    ? 'bg-[#37ec13] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                This Month
              </button>

              <button
                onClick={() => setPeriod('custom')}
                className={`flex-1 rounded-lg py-3 text-xs font-bold transition-all ${
                  period === 'custom'
                    ? 'bg-[#37ec13] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Custom Range
              </button>
            </div>
          </section>

          {/* Available Reports */}
          <section className="space-y-4">
            <h3 className="px-1 text-sm font-semibold text-white">
              Available Reports
            </h3>

            {reportOptions.map((option) => (
              <div
                key={option.id}
                className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a] p-6 transition-all hover:border-[rgba(55,236,19,0.4)]"
              >
                <div className="mb-6 flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(55,236,19,0.2)] bg-[rgba(55,236,19,0.1)]">
                    {option.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">
                      {option.title}
                    </h3>
                    <p className="text-gray-500 mt-1 text-xs leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateReport(option)}
                  disabled={isGenerating}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#111111] py-4 text-xs font-semibold text-white transition-all hover:border-[rgba(55,236,19,0.3)] disabled:opacity-50"
                >
                  {option.type === 'pdf' ? (
                    <MdPictureAsPdf className={`text-xl ${option.color}`} />
                  ) : (
                    <MdTableView className={`text-xl ${option.color}`} />
                  )}
                  {isGenerating
                    ? 'Generating...'
                    : `Export as ${option.type.toUpperCase()}`}
                </button>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Report;
