import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronDown, Printer, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {
  useAddSKundaInStock,
  useGetKunda,
  useGetKundaHistory,
  useSubmitKunda,
} from '@/lib/api/cutting';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useAddSkundaMelting } from '@/lib/api/processmelting';

import {
  KundaEntry,
  hasMeltingStatus,
  toNumber,
  getDefaultWeekRange,
  printSKundaHistory,
  getSKundaColumns,
} from './sKundaUtils';
import HistorySKunda from './HistorySKunda';
import SkundaAddInStock from './SkundaAddInStock';

const SKundaDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [kundaEntries, setKundaEntries] = useState<KundaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const { monday, sunday } = getDefaultWeekRange();
    return [monday, sunday];
  });

  const isInitialMount = useRef(true);

  const {
    data: kundaData = [],
    isLoading: kundaLoading,
    refetch,
    error,
  } = useGetKunda();
  const {
    data: kundaHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetKundaHistory();
  const submitKunda = useSubmitKunda();
  const addStockInward = useAddSKundaInStock();



  const { getScaleProps } = useTableScaleFocus<
    'kundaGiven' | 'chainReceived' | 'scrap'
  >((index, field, weight) => {
    handleInlineChange(index, field, weight.toString());
  });

  useEffect(() => {
    if (kundaLoading) return;

    if (error) {
      console.error('Error fetching S Kunda data:', error);
      setKundaEntries([]);
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (kundaData && kundaData.length > 0) {
      const entries: KundaEntry[] = kundaData.map(
        (kunda: any, index: number) => {
          const itemName = kunda.item?.name || kunda.itemId || 'N/A';
          const sizeName = kunda.size?.size || kunda.sizeId || 'N/A';

          const chainGiven = kunda.chainWeight || 0;
          const isSaved = kunda.isCompleted === true;
          const kundaGiven = isSaved ? kunda.kundaGiven || kunda.kunda || 0 : 0;
          const chainReceived = isSaved ? kunda.chainReceived || 0 : 0;
          const scrap = isSaved ? kunda.scrap || 0 : 0;
          const loss =
            isSaved && (chainReceived > 0 || kundaGiven > 0 || scrap > 0)
              ? kunda.loss !== undefined && kunda.loss !== null
                ? kunda.loss
                : Math.max(
                  0,
                  Math.round(
                    (chainGiven + kundaGiven - chainReceived - scrap) * 1000,
                  ) / 1000,
                )
              : 0;

          return {
            id: kunda.id,
            srNo: index + 1,
            dateTime: new Date(kunda.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            item: itemName,
            size: sizeName,
            purity: kunda.purity || 0,
            chainGiven: chainGiven,
            kundaGiven: kundaGiven,
            chainReceived: chainReceived,
            scrap: scrap,
            loss: loss,
            isEditing: !isSaved,
            isSaved: isSaved,
            kundaGivenRaw: isSaved && (kunda.kundaGiven || kunda.kunda) ? (kunda.kundaGiven || kunda.kunda).toString() : '',
            chainReceivedRaw: isSaved && kunda.chainReceived ? kunda.chainReceived.toString() : '',
            scrapRaw: isSaved && kunda.scrap ? kunda.scrap.toString() : '',
            purityRaw: kunda.purity ? kunda.purity.toString() : '',
            itemId: kunda.itemId,
            sizeId: kunda.sizeId,
            isCompleted: kunda.isCompleted || false,
            isDirty: false,
            status: kunda.status,
            process: kunda.process,
            isMelting: kunda.isMelting,
            meltingStatus: kunda.meltingStatus,
          };
        },
      );
      setKundaEntries(entries);
    } else {
      setKundaEntries([]);
    }
  }, [kundaData, kundaLoading, error]);

  const getFilteredHistory = () => {
    let filtered = kundaHistory;

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

  const filteredHistory = getFilteredHistory();
  const historyTotals = filteredHistory.reduce(
    (
      acc: {
        totalGiven: number;
        totalKundaGiven: number;
        totalReceived: number;
        totalScrap: number;
        totalLoss: number;
      },
      item: any,
    ) => ({
      totalGiven: acc.totalGiven + toNumber(item?.chainWeight),
      totalKundaGiven:
        acc.totalKundaGiven +
        toNumber(item?.kundaGiven || item?.kundaGiven || item?.kunda),
      totalReceived: acc.totalReceived + toNumber(item?.chainReceived),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss: acc.totalLoss + toNumber(item?.loss),
    }),
    {
      totalGiven: 0,
      totalKundaGiven: 0,
      totalReceived: 0,
      totalScrap: 0,
      totalLoss: 0,
    },
  );

  const handlePrintHistory = () => {
    printSKundaHistory(getFilteredHistory(), dateRange, getpdfheaderdata);
  };

  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'kundaGiven' | 'chainReceived' | 'scrap' | 'purity',
      value: string,
    ) => {
      setKundaEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };

            if (field === 'kundaGiven') {
              updated.kundaGivenRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.kundaGiven = 0;
              } else {
                const numValue = parseFloat(value);
                updated.kundaGiven = isNaN(numValue) ? 0 : numValue;
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

            const kundaAmount = Number(updated.kundaGiven || 0);
            const receivedAmount = Number(updated.chainReceived || 0);
            const scrapAmount = Number(updated.scrap || 0);

            const hasAnyInputEntered =
              (updated.kundaGivenRaw !== undefined && updated.kundaGivenRaw !== '') ||
              (updated.chainReceivedRaw !== undefined && updated.chainReceivedRaw !== '') ||
              (updated.scrapRaw !== undefined && updated.scrapRaw !== '') ||
              kundaAmount > 0 ||
              receivedAmount > 0 ||
              scrapAmount > 0;

            if (hasAnyInputEntered) {
              updated.loss = Math.max(
                0,
                Math.round(
                  (updated.chainGiven +
                    kundaAmount -
                    receivedAmount -
                    scrapAmount) *
                  1000,
                ) / 1000,
              );
            } else {
              updated.loss = 0;
            }

            updated.isDirty = true;
            return updated;
          }
          return entry;
        }),
      );
    },
    [],
  );

  const handleStockClick = useCallback(
    (index: number) => {
      const entry = kundaEntries[index];

      if (!entry.chainReceived || entry.chainReceived < 0) {
        toast.error('Please enter a valid chain received weight');
        return;
      }

      if (!entry.purity || entry.purity <= 0 || entry.purity > 100) {
        toast.error('Please enter a valid purity percentage');
        return;
      }

      setSaveIndex(index);
      setShowConfirmModal(true);
    },
    [kundaEntries],
  );

  // Update the handleStockAdded function
  const handleStockAdded = async (stockData: { id: string; stockId?: string; weight: number }) => {
    try {
      const stockId = stockData.stockId || stockData.id;
      await addStockInward.mutateAsync({
        id: stockId,
        data: {
          stockId: stockId,
          weight: stockData.weight,
        },
      });
      await refetch();
      toast.success('Stock added successfully!');
    } catch (error: any) {
      console.error('Error adding stock:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to add stock';
      toast.error(errorMessage);
    }
  };

  const confirmStock = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = kundaEntries[index];

    setIsLoading(true);

    try {
      await submitKunda.mutateAsync({
        id: entry.id,
        data: {
          kundaGiven: entry.kundaGiven,
          chainReceived: entry.chainReceived,
          scrap: entry.scrap,
          purity: entry.purity,
          loss: entry.loss,
          isCompleted: true,
        },
      });

      setKundaEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? {
              ...s,
              isEditing: false,
              isSaved: true,
              isCompleted: true,
              isDirty: false,
            }
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();
    } catch (error: any) {
      console.error('Error submitting S Kunda process:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to complete S Kunda process';
      toast.error(errorMessage);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, kundaEntries, submitKunda, refetch]);

  const hasEditableValues = (entry: KundaEntry): boolean => {
    return Boolean(entry.isDirty);
  };

  const showActionColumn = kundaEntries.some(
    (entry) => !entry.isSaved && entry.isDirty,
  );

  const isSubmitting = submitKunda.isPending;

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  const columns = getSKundaColumns(
    getScaleProps,
    handleInlineChange,
    handleStockClick,
    isLoading,
    isSubmitting,
    hasEditableValues,
    showActionColumn
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'S Kunda History' : 'S Kunda Department'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showHistory && (
            <>
              <div className="flex flex-wrap items-center gap-2">
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

              <GenericButton
                type="button"
                onClick={handlePrintHistory}
                variant="primary"
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Print</span>
              </GenericButton>
            </>
          )}
          {!showHistory && (
            <GenericButton
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add</span>
            </GenericButton>
          )}
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
            <span>{showHistory ? 'Show S Kunda' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {!showHistory ? (
        <div>
          <GenericTable<KundaEntry>
            data={kundaEntries}
            columns={columns}
            emptyMessage="No S Kunda entries found."
            isLoading={kundaLoading || isSubmitting}
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
        <HistorySKunda
          filteredData={getFilteredHistory()}
          historyTotals={historyTotals}
          historyLoading={historyLoading}
        />
      )}
      <SkundaAddInStock
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleStockAdded}
      />
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Save
              </h3>

              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this S Kunda entry? This action
                cannot be undone.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSaveIndex(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmStock}
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

export default SKundaDept;
