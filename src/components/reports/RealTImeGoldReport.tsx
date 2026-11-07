import React, {useState, useEffect, useMemo, useRef} from 'react';
import {Search, Printer, Loader2, LogOut} from 'lucide-react';
import {useGetHeader} from '@/lib/api/headerapi';
import {useGetRealTimeGold} from '@/lib/api/realtimegold';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {
  CategoryGroup,
  buildCategoryGroups,
  calculateAvgPurity,
} from './realtime/realTimeGoldUtils';
import {printRealTimeGoldReport} from './realtime/printRealTimeGoldReport';
import {RealTimeSummaryCards} from './realtime/RealTimeSummaryCards';
import {RealTimeStockPanel} from './realtime/RealTimeStockPanel';
import {RealTimeKarigarDuePanel} from './realtime/RealTimeKarigarDuePanel';
import {RealTimeKarigarStockPanel} from './realtime/RealTimeKarigarStockPanel';
import {RealTimeCustomerDuePanel} from './realtime/RealTimeCustomerDuePanel';

// ======================================================
// MAIN COMPONENT
// ======================================================
const RealTimeGoldReport: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    window.location.href = '/signin';
  };

  const {data: goldData, isLoading, isError, refetch} = useGetRealTimeGold();

  const rawData = useMemo(() => {
    if (!goldData) return null;
    return (goldData as any)?.data || goldData;
  }, [goldData]);

  const summaryFromApi = useMemo(() => {
    return rawData?.summary || null;
  }, [rawData]);

  const categoryGroups = useMemo(() => {
    return buildCategoryGroups(rawData);
  }, [rawData]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return categoryGroups;

    const term = searchTerm.toLowerCase();

    return categoryGroups
      .map((group) => {
        const groupNameMatch = group.name.toLowerCase().includes(term);
        const matchingItems = group.items.filter((item) =>
          item.name.toLowerCase().includes(term),
        );

        if (groupNameMatch) return group;

        if (matchingItems.length > 0) {
          return {
            ...group,
            items: matchingItems,
            totalGrossWeight: matchingItems.reduce(
              (s, i) => s + i.grossWeight,
              0,
            ),
            totalFineWeight: matchingItems.reduce(
              (s, i) => s + i.fineWeight,
              0,
            ),
            count: matchingItems.length,
          };
        }

        return null;
      })
      .filter((g): g is CategoryGroup => g !== null);
  }, [categoryGroups, searchTerm]);

  // Expand all categories by default once data first loads
  const didInitExpand = useRef(false);
  useEffect(() => {
    if (!didInitExpand.current && categoryGroups.length > 0) {
      didInitExpand.current = true;
      setExpandedRows(new Set(categoryGroups.map((g) => g.id)));
    }
  }, [categoryGroups]);

  const hadSearch = useRef(false);
  useEffect(() => {
    if (searchTerm.trim()) {
      hadSearch.current = true;
      const matchIds = filteredGroups.map((g) => g.id);
      setExpandedRows(new Set(matchIds));
    } else if (hadSearch.current) {
      hadSearch.current = false;
      setExpandedRows(new Set(categoryGroups.map((g) => g.id)));
    }
  }, [searchTerm, filteredGroups, categoryGroups]);

  const stockGroups = useMemo(() => {
    return filteredGroups.filter(
      (g) =>
        g.type === 'Stock' &&
        g.id !== 'client-due' &&
        g.id !== 'karigar-due' &&
        g.id !== 'karigar-stock',
    );
  }, [filteredGroups]);

  const processGroups = useMemo(() => {
    return filteredGroups.filter((g) => g.type === 'Process');
  }, [filteredGroups]);

  const karigarDueGroup = useMemo(() => {
    return filteredGroups.find((g) => g.id === 'karigar-due');
  }, [filteredGroups]);

  const karigarStockGroup = useMemo(() => {
    return filteredGroups.find((g) => g.id === 'karigar-stock');
  }, [filteredGroups]);

  const clientDueGroup = useMemo(() => {
    return filteredGroups.find((g) => g.id === 'client-due');
  }, [filteredGroups]);

  const stockTotals = useMemo(() => {
    const gross = stockGroups.reduce((s, g) => s + g.totalGrossWeight, 0);
    const fine = stockGroups.reduce((s, g) => s + g.totalFineWeight, 0);
    return {gross, fine, count: stockGroups.reduce((s, g) => s + g.count, 0)};
  }, [stockGroups]);

  const karigarDueTotal = useMemo(() => {
    const fine = karigarDueGroup ? karigarDueGroup.totalFineWeight : 0;
    return {fine, count: karigarDueGroup ? karigarDueGroup.count : 0};
  }, [karigarDueGroup]);

  const karigarStockTotals = useMemo(() => {
    const gross = karigarStockGroup ? karigarStockGroup.totalGrossWeight : 0;
    const fine = karigarStockGroup ? karigarStockGroup.totalFineWeight : 0;
    return {
      gross,
      fine,
      count: karigarStockGroup ? karigarStockGroup.count : 0,
    };
  }, [karigarStockGroup]);

  const clientDueTotal = useMemo(() => {
    const fine = clientDueGroup ? clientDueGroup.totalFineWeight : 0;
    return {fine, count: clientDueGroup ? clientDueGroup.count : 0};
  }, [clientDueGroup]);

  const grandTotals = useMemo(() => {
    const totalGrossWeight = stockTotals.gross + karigarStockTotals.gross;
    const totalFineWeight =
      stockTotals.fine +
      karigarStockTotals.fine +
      clientDueTotal.fine +
      karigarDueTotal.fine;
    const totalItems =
      stockTotals.count +
      karigarStockTotals.count +
      clientDueTotal.count +
      karigarDueTotal.count;

    const apiGrandGross = Number(summaryFromApi?.grandTotalWeight || 0);
    const apiGrandFine = Number(summaryFromApi?.grandTotalFineWeight || 0);

    const grandTotalWeight = apiGrandGross || totalGrossWeight;
    const grandTotalFineWeight = apiGrandFine || totalFineWeight;

    return {
      totalGrossWeight,
      totalFineWeight,
      totalItems,
      grandTotalWeight,
      grandTotalFineWeight,
      avgPurity: calculateAvgPurity(grandTotalWeight, grandTotalFineWeight),
    };
  }, [
    stockTotals,
    karigarStockTotals,
    clientDueTotal,
    karigarDueTotal,
    summaryFromApi,
  ]);

  // Total Gold WT = Stock Fine WT + Customer Due - Karigar Due
  const totalGoldWeight = useMemo(
    () => stockTotals.fine + clientDueTotal.fine - karigarDueTotal.fine,
    [stockTotals, clientDueTotal, karigarDueTotal],
  );

  const handlePrint = () => {
    printRealTimeGoldReport({
      headerInfo: getpdfheaderdata?.data?.data || {},
      filteredGroups,
      grandTotals,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#785600]" />
          <p className="mt-4 text-[#785600] dark:text-amber-400">
            Loading Real Time Gold Report...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load Real Time Gold Report.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d4200]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12 dark:bg-slate-950">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 border-b border-[#d3c4af]/30 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center justify-between sm:w-auto">
            <PageHeader title="Real Time Gold Dashboard" />
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 active:scale-95 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 sm:hidden"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Right Controls: Search & Print */}
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            {/* Search */}
            <div className="relative min-w-0 flex-1 sm:w-44 sm:flex-initial md:w-52">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4 p-3 sm:p-4 md:p-6">
        {/* Simple Summary Cards */}
        <RealTimeSummaryCards
          grandTotals={grandTotals}
          totalGoldWeight={totalGoldWeight}
        />

        {/* Horizontal Column Layout */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3 xl:grid-cols-3">
          {/* 1. GOLD & STOCK Panel */}
          <RealTimeStockPanel
            stockGroups={stockGroups}
            stockTotals={stockTotals}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
          />

          {/* 3. KARIGAR DUE Panel */}
          <RealTimeKarigarDuePanel
            karigarDueGroup={karigarDueGroup}
            karigarDueTotal={karigarDueTotal}
          />

          {/* 3. CLIENT DUE Panel */}
          <RealTimeCustomerDuePanel
            clientDueGroup={clientDueGroup}
            clientDueTotal={clientDueTotal}
          />
        </div>
      </div>

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

export default RealTimeGoldReport;
