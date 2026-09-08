import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  Save,
  ChevronRight,
  ChevronDown,
  Printer,
  Calendar,
  Flame,
  Box,
  Layers,
  X,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {GenericTable} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetCutting,
  useGetCuttingHistory,
  useSubmitCutting,
  useSubmitMoveKunda,
} from '@/lib/api/cutting';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';
import {
  useAddCuttingMelting,
  useGetCuttingScrap,
  getBackendErrorMessage,
  useAddCuttingScrap,
} from '@/lib/api/processmelting';
import {
  useGetProcessAlert,
  checkProcessLossAlert,
} from '@/lib/api/alertmanagement';

import {
  CuttingEntry,
  calculateLoss,
  hasMeltingStatus,
  getCuttingColumns,
  getHistoryCuttingColumns,
  printCuttingHistory,
  toNumber,
  formatNumberDisplay,
  formatNoTrailingZeros3Dec,
} from './cuttingUtils';
import HistoryCutting from './HistoryCutting';
import MeltingPopup from './MeltingPopup';

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
  const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(
    new Set(),
  );

  // Scrap selection and modal states
  const [selectedScrapIds, setSelectedScrapIds] = useState<Set<string>>(
    new Set(),
  );
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [scrapModalItems, setScrapModalItems] = useState<
    {id: string; purity: number; availableWeight: number; sendWeight: string}[]
  >([]);
  const [isMeltingSubmitting, setIsMeltingSubmitting] = useState(false);

  // Weighing Scale table focus hook
  const {getScaleProps} = useTableScaleFocus<'chainReceived' | 'scrap'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  const getDefaultWeekRange = () => {
    const {fromDate, toDate} = getCurrentAppWeekRange();
    return {monday: fromDate, sunday: toDate};
  };

  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const {monday, sunday} = getDefaultWeekRange();
    return [monday, sunday];
  });

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      const {monday, sunday} = getDefaultWeekRange();
      setDateRange([monday, sunday]);
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, []);

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
  const {data: cuttingScrapData, refetch: refetchCuttingScrap} =
    useGetCuttingScrap();
  const receivedscrap = useAddCuttingScrap();
  const {data: alertRules} = useGetProcessAlert('cutting');

  const scrapList = React.useMemo(() => {
    const list = Array.isArray(cuttingScrapData?.data)
      ? cuttingScrapData.data
      : Array.isArray(cuttingScrapData)
        ? cuttingScrapData
        : [];
    return list;
  }, [cuttingScrapData]);

  // Toggle selection of a scrap card (clicking card ONLY toggles selection border, NO popup opens)
  const toggleSelectScrapCard = (id: string) => {
    setSelectedScrapIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Open Scrap Modal ONLY when clicking "Received Scrap" button
  const openScrapModal = () => {
    if (!scrapList || scrapList.length === 0) {
      toast.error('No cutting scrap available');
      return;
    }

    if (selectedScrapIds.size === 0) {
      toast.error('Please select at least one scrap card');
      return;
    }

    const itemsToLoad = scrapList.filter((item: any) =>
      selectedScrapIds.has(item.id),
    );

    setScrapModalItems(
      itemsToLoad.map((item: any) => ({
        id: item.id,
        purity: Number(item.purity) || 0,
        availableWeight: Number(item.weight) || 0,
        sendWeight: '',
      })),
    );

    setIsScrapModalOpen(true);
  };

  const handleModalWeightChange = (index: number, val: string) => {
    setScrapModalItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? {...item, sendWeight: val} : item,
      ),
    );
  };

  const scrapCalculations = React.useMemo(() => {
    let totalEnteredWeight = 0;
    let totalAvailableWeight = 0;
    let weightedPuritySum = 0;
    let activeWeightSum = 0;

    const itemBreakdown = scrapModalItems.map((item) => {
      const entered = parseFloat(item.sendWeight) || 0;
      const avail = item.availableWeight || 0;
      const p = item.purity || 0;

      // Use typed sendWeight if > 0, otherwise use availableWeight for weighted average calculation
      const effectiveWeight = entered > 0 ? entered : avail;

      totalEnteredWeight += entered;
      totalAvailableWeight += avail;
      weightedPuritySum += effectiveWeight * p;
      activeWeightSum += effectiveWeight;

      return {
        ...item,
        entered,
        avail,
        effectiveWeight,
        p,
      };
    });

    const finalPurity =
      activeWeightSum > 0 ? weightedPuritySum / activeWeightSum : 0;

    return {
      itemBreakdown,
      totalEnteredWeight,
      totalAvailableWeight,
      finalPurity,
    };
  }, [scrapModalItems]);

  const handleProcessMelting = async () => {
    const itemsToProcess = scrapCalculations.itemBreakdown.filter(
      (item) => item.entered > 0,
    );

    if (itemsToProcess.length === 0) {
      toast.error('Please enter weight to melt');
      return;
    }

    try {
      await receivedscrap.mutateAsync({
        data: {
          items: itemsToProcess.map((item) => ({
            cuttingId: item.id,
            purity: item.p,
            weight: item.entered,
          })),

          avgPurity: Number(scrapCalculations.finalPurity.toFixed(3)),
          avgWeight: Number(scrapCalculations.totalEnteredWeight.toFixed(3)),
        },
      });

      setIsScrapModalOpen(false);
      setSelectedScrapIds(new Set());
      await refetchCuttingScrap();
      await refetch();
    } catch (error: any) {
      console.error('Error in melting scrap:', error);
    }
  };

  const handleMelting = async (entry: CuttingEntry) => {
    setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: entry.purity || 0,
          chainReceived: entry.chainReceived || 0,
          cuttingId: entry.id,
        },
      });
      await refetchCuttingScrap();
      await refetch();
    } catch (error: any) {
      console.error('Error in melting:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to process melting'));
    } finally {
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

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (cuttingData.length > 0) {
      const entries: CuttingEntry[] = cuttingData.map(
        (cutting: any, index: number) => {
          const itemName = cutting.item?.name || cutting.itemId || 'N/A';
          const sizeName = cutting.size?.size || cutting.sizeId || 'N/A';

          const chainGiven =
            cutting.chainWeight !== undefined && cutting.chainWeight !== null
              ? cutting.chainWeight
              : cutting.chainGiven || 0;
          const chainReceived = cutting.chainReceived || 0;
          const scrap = cutting.scrap || 0;
          const loss = cutting.loss || 0;

          const isSaved =
            cutting.isCompleted === true ||
            cutting.status === 'completed' ||
            cutting.process === 'kunda' ||
            (cutting.chainReceived !== null &&
              cutting.chainReceived !== undefined &&
              cutting.isCompleted === true);

          let calculatedLoss = 0;
          if (
            isSaved ||
            (cutting.chainReceived !== null &&
              cutting.chainReceived !== undefined &&
              cutting.chainReceived > 0)
          ) {
            calculatedLoss = calculateLoss(chainGiven, chainReceived, scrap);
          }

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
            purity: cutting.purity || '',
            chainWeight: chainGiven,
            chainGiven: chainGiven,
            chainReceived: chainReceived,
            scrap: scrap,
            loss: calculatedLoss,
            isEditing: !isSaved,
            isSaved: isSaved,
            chainGivenRaw: cutting.chainGiven
              ? cutting.chainGiven.toString()
              : '',
            chainReceivedRaw: cutting.chainReceived
              ? cutting.chainReceived.toString()
              : '',
            scrapRaw: cutting.scrap ? cutting.scrap.toString() : '',
            purityRaw:
              cutting.purity !== null && cutting.purity !== undefined
                ? cutting.purity.toString()
                : '',
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
  }, [cuttingData, cuttingLoading]);

  // Filter and sort history by Proceed Date & Time
  const getFilteredHistory = () => {
    let list = Array.isArray(cuttingHistory?.data)
      ? cuttingHistory.data
      : Array.isArray(cuttingHistory)
        ? cuttingHistory
        : [];

    // Sort descending by Proceed Date & Time
    list = [...list].sort((a: any, b: any) => {
      const dateA = new Date(
        a.updatedAt || a.proceedDateTime || a.updated_at || a.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        b.updatedAt || b.proceedDateTime || b.updated_at || b.createdAt || 0,
      ).getTime();
      return dateB - dateA;
    });

    if (!dateRange || dateRange.length === 0) return list;

    const [fromRaw, toRaw] = dateRange;
    const from = fromRaw ? new Date(fromRaw) : null;
    if (from) from.setHours(0, 0, 0, 0);
    const to = toRaw ? new Date(toRaw) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return list.filter((item: any) => {
      const dateVal =
        item?.updatedAt ||
        item?.proceedDateTime ||
        item?.updated_at ||
        item?.createdAt;
      if (!dateVal) return false;
      const itemDate = new Date(dateVal);
      if (Number.isNaN(itemDate.getTime())) return false;

      if (from && to) {
        return itemDate >= from && itemDate <= to;
      }
      if (from) {
        return itemDate >= from;
      }
      if (to) {
        return itemDate <= to;
      }

      return true;
    });
  };

  const totals = cuttingEntries.reduce(
    (acc, item: any) => ({
      totalGiven: acc.totalGiven + toNumber(item?.chainWeight),
      totalReceived: acc.totalReceived + toNumber(item?.chainReceived),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss: acc.totalLoss + toNumber(item?.loss),
    }),
    {totalGiven: 0, totalReceived: 0, totalScrap: 0, totalLoss: 0},
  );

  // Handle inline field change
  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'chainGiven' | 'chainReceived' | 'scrap' | 'purity',
      value: string,
    ) => {
      setHasEditedRow(true);

      setCuttingEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = {...entry};

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

            const givenAmount = Number(updated.chainGiven || 0);
            const receivedAmount = Number(updated.chainReceived || 0);
            const scrapAmount = Number(updated.scrap || 0);

            updated.loss = Math.max(
              0,
              Math.round((givenAmount - receivedAmount - scrapAmount) * 1000) /
                1000,
            );

            console.log(`[Cutting Field Change - Row #${index + 1}]`, {
              fieldChanged: field,
              newValue: value,
              chainGiven: givenAmount,
              chainReceived: receivedAmount,
              scrap: scrapAmount,
              calculatedLoss: updated.loss,
              formula: `${givenAmount} (Chain Given) - ${receivedAmount} (Chain Received) - ${scrapAmount} (Scrap) = ${updated.loss} G (Loss)`,
            });

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

      setSaveIndex(index);
      setActionType(target);
      setShowConfirmModal(true);
    },
    [cuttingEntries],
  );

  // Confirm and save
  const confirmSave = useCallback(async () => {
    if (saveIndex === null || !actionType) return;

    const index = saveIndex;
    const entry = cuttingEntries[index];

    const lossVal =
      entry.loss !== undefined && entry.loss !== null
        ? entry.loss
        : calculateLoss(
            entry.chainGiven || 0,
            entry.chainReceived || 0,
            entry.scrap || 0,
          );

    setIsLoading(true);

    try {
      if (actionType === 'stock') {
        await submitCutting.mutateAsync({
          id: entry.id,
          data: {
            chainGiven: entry.chainGiven,
            chainReceived: entry.chainReceived,
            scrap: entry.scrap,
            loss: lossVal,
            purity: entry.purity,
            isCompleted: true,
          },
        });
      } else if (actionType === 'kunda') {
        await submitMoveKunda.mutateAsync({
          id: entry.id,
          data: {
            chainGiven: entry.chainGiven,
            chainReceived: entry.chainReceived,
            scrap: entry.scrap,
            loss: lossVal,
            purity: entry.purity,
            isCompleted: true,
          },
        });
      }

      setCuttingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? {...s, isEditing: false, isSaved: true, isCompleted: true}
            : s,
        ),
      );

      setHasEditedRow(false);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);

      await refetch();
    } catch (error: any) {
      console.error('Error saving cutting:', error);
      toast.error(
        getBackendErrorMessage(error, 'Failed to save cutting entry'),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [
    saveIndex,
    actionType,
    cuttingEntries,
    submitCutting,
    submitMoveKunda,
    refetch,
    alertRules,
  ]);

  const isSubmitting = submitCutting.isPending || submitMoveKunda.isPending;

  const columns = getCuttingColumns({
    getScaleProps,
    handleInlineChange,
    handleSaveClick,
    handleMelting,
    isLoading,
    isSubmitting,
    submitMoveKundaIsPending: submitMoveKunda.isPending,
    meltingLoadingIds,
    alertRules,
  });

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
      {scrapList.length > 0 && !showHistory && (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Available Cutting Scrap
              </span>
            </div>
            {/* Received Scrap Button - Only show when at least one card is selected */}
            {selectedScrapIds.size > 0 && (
              <GenericButton
                type="button"
                onClick={openScrapModal}
                variant="primary"
                className="text-xs"
              >
                <span>Received</span>
              </GenericButton>
            )}
          </div>

          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-2 pt-1">
            {scrapList.map((scrap: any, idx: number) => {
              const isSelected = selectedScrapIds.has(scrap.id);
              return (
                <button
                  key={scrap.id || idx}
                  type="button"
                  onClick={() => toggleSelectScrapCard(scrap.id)}
                  className={`flex min-w-[140px] flex-col items-start rounded-xl border px-4 py-3 shadow-sm transition-all ${
                    isSelected
                      ? 'border-2 border-[#785600] bg-amber-50 shadow-md ring-2 ring-[#785600]/20 dark:border-amber-400 dark:bg-amber-950/50'
                      : 'border-[#d3c4af]/30 bg-white hover:border-[#785600]/60 dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-black dark:text-white">
                      Scrap ({scrap.purity}%)
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold text-black dark:text-white">
                    {(Number(scrap.weight) || 0).toFixed(3)} G
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
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
          )}

          {/* Print History Button */}
          {showHistory && (
            <GenericButton
              type="button"
              onClick={() =>
                printCuttingHistory(
                  getFilteredHistory(),
                  dateRange,
                  getpdfheaderdata,
                )
              }
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
            // isLoading={cuttingLoading || isSubmitting}
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
          filteredData={getFilteredHistory()}
          historyLoading={historyLoading}
          dateRange={dateRange}
          historyColumns={getHistoryCuttingColumns(alertRules)}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Save
              </h3>

              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this cutting entry and go to the{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  {actionType === 'kunda' ? 'S/Kunda' : 'Stock'}
                </strong>{' '}
                department?
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
                  onClick={confirmSave}
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

      {/* Scrap Received Modal */}
      <MeltingPopup
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        scrapModalItems={scrapModalItems}
        scrapCalculations={scrapCalculations}
        refetchCuttingScrap={refetchCuttingScrap}
        refetch={refetch}
        onSuccess={() => {
          setSelectedScrapIds(new Set());
        }}
      />
    </div>
  );
};

export default CuttingDept;
