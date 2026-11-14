import {useState} from 'react';
import {
  Weight,
  Package,
  Coins,
  Hammer,
  Recycle,
  Scissors,
  Users,
  HardHat,
  RefreshCw,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import {useGetRealTimeGold} from '@/lib/api/realtimegold';
import {formatGramWithUnit} from '@/utils/weightValidation';

type Summary = Record<string, any>;

type CardConfig = {
  label: string;
  weightKey: string;
  fineKey: string;
  countKey: string;
  icon: LucideIcon;
  iconClass: string;
  hoverClass: string;
  highlight?: boolean;
};

const CARDS: CardConfig[] = [
  {
    label: 'Grand Total',
    weightKey: 'grandTotalWeight',
    fineKey: 'grandTotalFineWeight',
    countKey: 'totalItemsCount',
    icon: Weight,
    iconClass:
      'bg-amber-100 text-[#785600] dark:bg-amber-500/10 dark:text-amber-400',
    hoverClass: 'hover:border-amber-500/40',
    highlight: true,
  },
  {
    label: 'Stock',
    weightKey: 'totalStockWeight',
    fineKey: 'totalStockFineWeight',
    countKey: 'stockItemsCount',
    icon: Package,
    iconClass:
      'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    hoverClass: 'hover:border-blue-500/40',
  },
  {
    label: 'Gold',
    weightKey: 'totalGoldWeight',
    fineKey: 'totalGoldFineWeight',
    countKey: 'goldItemsCount',
    icon: Coins,
    iconClass:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
    hoverClass: 'hover:border-yellow-500/40',
  },
  {
    label: 'In Process',
    weightKey: 'totalProcessWeight',
    fineKey: 'totalProcessFineWeight',
    countKey: 'processItemsCount',
    icon: Hammer,
    iconClass:
      'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    hoverClass: 'hover:border-purple-500/40',
  },
  {
    label: 'Scrap',
    weightKey: 'totalScrapWeight',
    fineKey: 'totalScrapFineWeight',
    countKey: 'scrapItemsCount',
    icon: Recycle,
    iconClass:
      'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
    hoverClass: 'hover:border-orange-500/40',
  },
  {
    label: 'Cutting Scrap',
    weightKey: 'totalCuttingScrapWeight',
    fineKey: 'totalCuttingScrapFineWeight',
    countKey: 'cuttingScrapItemsCount',
    icon: Scissors,
    iconClass:
      'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    hoverClass: 'hover:border-rose-500/40',
  },
  {
    label: 'Client Due',
    weightKey: 'totalClientDueWeight',
    fineKey: 'totalClientDueFineWeight',
    countKey: 'clientDueItemsCount',
    icon: Users,
    iconClass:
      'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
    hoverClass: 'hover:border-cyan-500/40',
  },
  {
    label: 'Karigar Due',
    weightKey: 'totalKarigarDueWeight',
    fineKey: 'totalKarigarDueFineWeight',
    countKey: 'karigarDueItemsCount',
    icon: HardHat,
    iconClass:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    hoverClass: 'hover:border-emerald-500/40',
  },
];

const Dashboard = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    window.location.href = '/signin';
  };

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    refetch,
  } = useGetRealTimeGold();

  const summary: Summary =
    (dashboardData as any)?.data?.summary ??
    (dashboardData as any)?.summary ??
    {};

  const processEntries = Object.entries(
    (summary.byProcess ?? {}) as Record<
      string,
      {totalWeight?: number; totalFineWeight?: number; count?: number}
    >,
  );

  const showValue = (val: unknown) =>
    isLoading ? '—' : formatGramWithUnit(Number(val ?? 0));

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-4 dark:bg-slate-950 md:p-8">
      {/* Top Banner Header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-[#d3c4af]/20 pb-6 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center justify-between md:w-auto">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-amber-500"></span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#785600] dark:text-amber-400 md:text-3xl">
              Dashboard
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 active:scale-95 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 md:hidden"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-2 text-xs font-semibold text-[#1a1c1b] shadow-sm transition-all hover:bg-[#f4f4f2] hover:text-[#785600] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-amber-400"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const count = Number(summary[card.countKey] ?? 0);
          return (
            <div
              key={card.label}
              className={`min-w-0 rounded-xl border bg-white p-3 shadow-sm transition-all sm:p-5 dark:bg-slate-900/90 ${card.hoverClass} ${
                card.highlight
                  ? 'border-amber-400/60 ring-1 ring-amber-300/40 dark:border-amber-500/40'
                  : 'border-[#d3c4af]/20 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#4f4535] dark:text-slate-400 sm:text-xs">
                  {card.label}
                </span>
                <div
                  className={`shrink-0 rounded-lg p-1.5 sm:p-2 ${card.iconClass}`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="block truncate font-mono text-base font-bold text-[#1a1c1b] dark:text-slate-100 sm:text-2xl">
                  {showValue(summary[card.weightKey])}
                </span>
                <p className="mt-1 truncate text-[10px] text-[#4f4535] dark:text-slate-400 sm:text-[11px]">
                  Fine:{' '}
                  <span className="font-mono font-semibold">
                    {showValue(summary[card.fineKey])}
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400 sm:text-[11px]">
                  {isLoading ? '—' : count} {count === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Process Breakdown */}
      {processEntries.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
            Process Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {processEntries.map(([name, p]) => (
              <div
                key={name}
                className="min-w-0 rounded-lg border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold capitalize text-[#785600] dark:text-amber-400">
                    {name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {Number(p?.count ?? 0)} items
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-sm font-bold text-[#1a1c1b] dark:text-slate-100">
                  {formatGramWithUnit(Number(p?.totalWeight ?? 0))}
                </p>
                <p className="truncate text-[10px] text-[#4f4535] dark:text-slate-400">
                  Fine:{' '}
                  <span className="font-mono">
                    {formatGramWithUnit(Number(p?.totalFineWeight ?? 0))}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
                Confirm Logout
              </h3>
              <p className="mt-1 text-xs text-[#4f4535] dark:text-slate-400">
                Are you sure you want to log out of your account?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-3 dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="hover:bg-gray-50 rounded-lg border border-[#d3c4af]/40 bg-white px-3 py-2 text-xs font-semibold text-[#4f4535] transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
