import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save,
  ChevronRight,
  ChevronDown,
  Printer,
  Calendar,
  Flame,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetCutting,
  useGetCuttingHistory,
  useSubmitCutting,
  useSubmitMoveKunda,
} from '@/lib/api/cutting';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useAddMelting } from '@/lib/api/tar';
import { useAddCuttingMelting } from '@/lib/api/processmelting';

import {
  CuttingEntry,
  calculateLoss,
  hasMeltingStatus,
  getCuttingColumns,
  getHistoryCuttingColumns,
  printCuttingHistory,
  toNumber,
  formatNumberDisplay,
} from './cuttingUtils';
import HistoryCutting from './HistoryCutting';

const CuttingDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [cuttingEntries, setCuttingEntries] = useState<CuttingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEditedRow, setHasEditedRow] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'stock' | 'kunda' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(new Set());
  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'chainReceived' | 'scrap'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  // Helper function to get week start (Monday 00:00) and end (Sunday 23:59:59)
  const getDefaultWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const { monday, sunday } = getDefaultWeekRange();
    return [monday, sunday];
  });

  const isInitialMount = useRef(true);

  // Fetch data from API
  const {
    data: cuttingData = [],
    isLoading: cuttingLoading,
    refetch,
    error,
  } = useGetCutting();
  const {
    data: cuttingHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetCuttingHistory();
  const submitCutting = useSubmitCutting();
  const submitMoveKunda = useSubmitMoveKunda();
  const submitMelting = useAddCuttingMelting();
  const handleMelting = async (entry: CuttingEntry) => {
    // Add this entry ID to loading set
    setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: entry.purity || 0,
          chainWeight: entry.chainGiven || entry.chainReceived || 0,
          cuttingId: entry.id,

        },
      });
      await refetch();
    } catch (error: any) {
      console.error('Error in melting:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to process melting';
      toast.error(errorMessage);
    } finally {
      // Remove this entry ID from loading set
      setMeltingLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  };
  // Load data from API
  useEffect(() => {
    if (cuttingLoading) {
      return;
    }

    if (error) {
      console.error('Error fetching cutting data:', error);
      setCuttingEntries([]);
      return;
    }

    if (cuttingData && cuttingData.length > 0) {
      const entries: CuttingEntry[] = cuttingData.map(
        (cutting: any, index: number) => {
          const itemName = cutting.item?.name || cutting.itemId || 'N/A';
          const sizeName = cutting.size?.size || cutting.sizeId || 'N/A';

          const isSaved =
            cutting.isCompleted === true &&
            cutting.chainReceived !== null &&
            cutting.chainReceived !== undefined &&
            cutting.purity !== null &&
            cutting.purity !== undefined;

          const chainGiven = cutting.chainWeight || cutting.chainGiven || 0;
          const chainReceived = isSaved ? cutting.chainReceived || 0 : 0;
          const scrap = isSaved ? cutting.scrap || 0 : 0;
          const loss =
            isSaved && chainReceived > 0
              ? cutting.loss !== undefined && cutting.loss !== null
                ? cutting.loss
                : calculateLoss(chainGiven, chainReceived, scrap)
              : 0;

          return {
            id: cutting.id,
            srNo: index + 1,
            dateTime: new Date(cutting.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            item: itemName,
            size: sizeName,
            purity: cutting.purity || 0,
            chainGiven: chainGiven,
            chainReceived: chainReceived,
            scrap: scrap,
            loss: loss,
            isEditing: !isSaved,
            isSaved: isSaved,
            chainGivenRaw: chainGiven > 0 ? chainGiven.toString() : '',
            chainReceivedRaw:
              isSaved && cutting.chainReceived
                ? cutting.chainReceived.toString()
                : '',
            scrapRaw: isSaved && cutting.scrap ? cutting.scrap.toString() : '',
            purityRaw: cutting.purity ? cutting.purity.toString() : '',
            itemId: cutting.itemId,
            sizeId: cutting.sizeId,
            isCompleted: cutting.isCompleted || false,
            isDirty: false,
            status: cutting.status,
            process: cutting.process,
            isMelting: cutting.isMelting,
            meltingStatus: cutting.meltingStatus,
          };
        },
      );
      setCuttingEntries(entries);
    } else {
      setCuttingEntries([]);
    }
  }, [cuttingData, cuttingLoading, error]);

  // Filter history by selected From-To date range.
  const getFilteredHistory = () => {
    let filtered = cuttingHistory;

    if (dateRange && dateRange.length > 0) {
      if (dateRange[0]) {
        const from = new Date(dateRange[0]);
        from.setHours(0, 0, 0, 0);
        filtered = filtered.filter((item: any) => {
          if (!item?.createdAt) return false;
          const itemDate = new Date(item.createdAt);
          if (Number.isNaN(itemDate.getTime())) return false;
          return itemDate >= from;
        });
      }
      if (dateRange[1]) {
        const to = new Date(dateRange[1]);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((item: any) => {
          if (!item?.createdAt) return false;
          const itemDate = new Date(item.createdAt);
          if (Number.isNaN(itemDate.getTime())) return false;
          return itemDate <= to;
        });
      }
    }

    return filtered;
  };

  // Calculate history totals
  const filteredHistory = getFilteredHistory();
  const historyTotals = filteredHistory.reduce(
    (
      acc: {
        totalGiven: number;
        totalReceived: number;
        totalScrap: number;
        totalLoss: number;
      },
      item: any,
    ) => ({
      totalGiven: acc.totalGiven + toNumber(item?.chainWeight),
      totalReceived: acc.totalReceived + toNumber(item?.chainReceived),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss: acc.totalLoss + toNumber(item?.loss),
    }),
    { totalGiven: 0, totalReceived: 0, totalScrap: 0, totalLoss: 0 },
  );

  // Handle inline field change
  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'chainGiven' | 'chainReceived' | 'scrap' | 'purity',
      value: string,
    ) => {
      // Show Action column as soon as the user edits any input
      setHasEditedRow(true);

      setCuttingEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };

            if (field === 'chainGiven') {
              updated.chainGivenRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.chainGiven = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainGiven = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'chainReceived') {
              updated.chainReceivedRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.chainReceived = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainReceived = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'scrap') {
              updated.scrapRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.scrap = 0;
              } else {
                const numValue = parseFloat(value);
                updated.scrap = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'purity') {
              updated.purityRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.purity = 0;
              } else {
                const numValue = parseFloat(value);
                updated.purity = isNaN(numValue) ? 0 : numValue;
              }
            }

            const hasReceived =
              (updated.chainReceivedRaw !== undefined &&
                updated.chainReceivedRaw !== '' &&
                updated.chainReceived > 0) ||
              updated.chainReceived > 0;

            if (hasReceived) {
              const scrapAmount = updated.scrap || 0;
              updated.loss = Math.max(
                0,
                Math.round(
                  (updated.chainGiven - updated.chainReceived - scrapAmount) *
                  1000,
                ) / 1000,
              );
            } else {
              updated.loss = 0;
            }

            // Mark row as dirty so only this row shows the action button
            updated.isDirty = true;
            return updated;
          }
          return entry;
        }),
      );
    },
    [],
  );

  // Open confirmation popup before saving
  const handleSaveClick = useCallback(
    (index: number, target: 'stock' | 'kunda') => {
      const entry = cuttingEntries[index];

      if (!entry.chainGiven || entry.chainGiven < 0) {
        toast.error('Please enter a valid chain given weight');
        return;
      }

      if (!entry.chainReceived || entry.chainReceived < 0) {
        toast.error('Please enter a valid chain received weight');
        return;
      }

      if (!entry.purity || entry.purity < 0 || entry.purity > 100) {
        toast.error('Please enter a valid purity percentage (1-100)');
        return;
      }

      setSaveIndex(index);
      setActionType(target);
      setShowConfirmModal(true);
    },
    [cuttingEntries],
  );

  // Confirm and save for Stock
  const confirmSaveStock = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = cuttingEntries[index];

    setIsLoading(true);

    try {
      await submitCutting.mutateAsync({
        id: entry.id,
        data: {
          chainGiven: entry.chainGiven,
          chainReceived: entry.chainReceived,
          scrap: entry.scrap,
          purity: entry.purity,
          loss: entry.loss,
          isCompleted: true,
        },
      });

      setCuttingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
      setHasEditedRow(false);
      await refetch();

      toast.success('Cutting entry saved to Stock successfully!');
      // navigate({
      //   to: '/Stocks/stockpage',
      // });
    } catch (error: any) {
      console.error('Error saving cutting to Stock:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save cutting entry';
      toast.error(errorMessage);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, cuttingEntries, submitCutting, navigate, refetch]);

  // Confirm and save for S Kunda
  const confirmSaveKunda = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = cuttingEntries[index];

    setIsLoading(true);

    try {
      await submitMoveKunda.mutateAsync({
        id: entry.id,
        data: {
          chainGiven: entry.chainGiven,
          chainReceived: entry.chainReceived,
          scrap: entry.scrap,
          purity: entry.purity,
          loss: entry.loss,
          isCompleted: true,
        },
      });

      setCuttingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
      setHasEditedRow(false);
      await refetch();

      toast.success('Cutting entry moved to S Kunda successfully!');
      // navigate({
      //   to: '/manufacturingprocess/process',
      //   state: { selectedTab: 'kunda' },
      // });
    } catch (error: any) {
      console.error('Error moving cutting entry to S Kunda:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to move to S Kunda';
      toast.error(errorMessage);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, cuttingEntries, submitMoveKunda, navigate, refetch]);


  const isSubmitting = submitCutting.isPending;
  const submitMoveKundaIsPending = submitMoveKunda.isPending;

  const columns = getCuttingColumns(
      getScaleProps,
      handleInlineChange,
      handleSaveClick,
      handleMelting,
      isLoading,
      isSubmitting,
      submitMoveKundaIsPending,
      meltingLoadingIds
  );
  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Cutting History' : 'Cutting Department'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Weekly Date Filter - Only show when viewing history */}
          {showHistory && (
            <div className="flex flex-wrap items-center gap-2">
              {/* From Date - Defaults to Monday */}
              <GenericWeeklyDatePicker
                id="from-date-box"
                placeholder="DD/MM/YYYY"
                mode="from"
                initialDates={dateRange}
                onDateChange={(dates) => {
                  if (dates && dates.length > 0) {
                    const from = new Date(dates[0]);
                    from.setHours(0, 0, 0, 0);
                    setDateRange((prev) => [from, prev[1] || from]);
                  } else {
                    setDateRange((prev) => [undefined as any, prev[1]]);
                  }
                }}
                className="w-32 sm:w-36 md:w-40"
              />

              {/* To Date - Defaults to Sunday */}
              <GenericWeeklyDatePicker
                id="to-date-box"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={dateRange}
                onDateChange={(dates) => {
                  if (dates && dates.length > 0) {
                    const to = new Date(dates[0]);
                    to.setHours(23, 59, 59, 999);
                    setDateRange((prev) => [prev[0] || to, to]);
                  } else {
                    setDateRange((prev) => [prev[0], undefined as any]);
                  }
                }}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>
          )}

          {/* Print History Button */}
          {showHistory && (
            <GenericButton
              type="button"
              onClick={() => printCuttingHistory(getFilteredHistory(), dateRange, getpdfheaderdata)}
              variant="primary"
            >
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Print</span>
            </GenericButton>
          )}

          {/* History Toggle Button */}
          <GenericButton
            type="button"
            onClick={toggleHistory}
            variant="primary"
          >
            {showHistory ? (
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span>{showHistory ? 'Show Cutting' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Conditional Rendering: Cutting Table OR History Table */}
      {!showHistory ? (
        <div>
          <GenericTable<CuttingEntry>
            data={cuttingEntries}
            columns={columns}
            emptyMessage="No cutting entries found."
            isLoading={cuttingLoading || isSubmitting}
            showSrNo={true}
            srNoLabel="Sr No."
            rowClassName={(item) =>
              hasMeltingStatus(item)
                ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
                : ''
            }
          />
        </div>
      ) : (
        <HistoryCutting
            historyData={getFilteredHistory()}
            historyTotals={historyTotals}
            historyLoading={historyLoading}
            dateRange={dateRange}
            historyColumns={getHistoryCuttingColumns()}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Action
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this cutting entry and send it to{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  {actionType === 'stock' ? 'Stock' : 'S Kunda'}
                </strong>
                ?
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSaveIndex(null);
                    setActionType(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    actionType === 'stock' ? confirmSaveStock : confirmSaveKunda
                  }
                  disabled={isLoading}
                  className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Confirm Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuttingDept;
