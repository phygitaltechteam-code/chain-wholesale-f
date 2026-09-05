import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  History,
  ChevronRight,
  ChevronDown,
  Printer,
  PackageCheck,
  Flame,
  Layers,
  Sparkles,
  Plus,
  X,
  Scale,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus, useScaleFocus } from '@/lib/hooks/useScaleFocus';
import {
  useGetMelting,
  useGetMeltingHistory,
  useGetScrap,
  useSubmitMeltingStock,
  useSubmitMeltingScrapStock,
} from '@/lib/api/melting';
import HistoryDept from './HistoryDept';
import AddDept from './AddDept';
import MeltingPopup, { ScrapModalItem } from '../cutting/MeltingPopup';
import {
  MeltingRow,
  ScrapCardData,
  getCurrentWeekRange,
  calculateExpectedFine,
  formatNumberDisplay,
  formatDate,
  getMeltingColumns,
  printMeltingHistory
} from './meltingUtils';
const MeltingDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [meltingEntries, setMeltingEntries] = useState<MeltingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Selected scrap cards state for MeltingPopup
  const [selectedScrapPurities, setSelectedScrapPurities] = useState<Set<number>>(new Set());
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);

  // Add Scrap Modal state
  const [showAddScrapModal, setShowAddScrapModal] = useState(false);
  const [selectedPurity, setSelectedPurity] = useState<number | ''>('');
  const [availableWeight, setAvailableWeight] = useState<number>(0);
  const [scrapWeight, setScrapWeight] = useState<string>('');
  const [particular, setParticular] = useState<string>('');
  const [isSubmittingScrap, setIsSubmittingScrap] = useState(false);

  const isInitialMount = useRef(true);

  // Fetch data from API
  const {
    data: meltingData = [],
    isLoading: meltingLoading,
    refetch,
    error,
  } = useGetMelting();
  const {
    data: meltingHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetMeltingHistory();
  const { data: scrapData = [] } = useGetScrap();
  const submitMeltingStock = useSubmitMeltingStock();
  const submitMeltingScrap = useSubmitMeltingScrapStock();

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'fineWeight'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  // Weighing Scale single focus hook for Add Scrap modal
  const modalScaleProps = useScaleFocus((weight) => {
    setScrapWeight(weight.toString());
  });

  const scrapCards: ScrapCardData[] = React.useMemo(() => {
    const scrapList = Array.isArray(scrapData?.data) ? scrapData.data :
      Array.isArray(scrapData) ? scrapData : [];

    // Return empty cards if API returns no scrap
    if (scrapList.length === 0) return [];

    const cardMap = new Map<number, { totalWeight: number; count: number }>();
    scrapList.forEach((item: any) => {
      const p = Number(item.purity) || 0;
      const wt = Number(item.weight) || 0;
      if (p > 0 && wt > 0) {
        const current = cardMap.get(p) || { totalWeight: 0, count: 0 };
        cardMap.set(p, {
          totalWeight: current.totalWeight + wt,
          count: current.count + 1,
        });
      }
    });

    return Array.from(cardMap.entries()).map(([purity, data]) => ({
      purity,
      totalWeight: Math.round(data.totalWeight * 1000) / 1000,
      count: data.count,
    }));
  }, [scrapData]);


  const toggleSelectScrapCard = (purity: number) => {
    setSelectedScrapPurities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(purity)) {
        newSet.delete(purity);
      } else {
        newSet.add(purity);
      }
      return newSet;
    });
  };

  const scrapModalItems: ScrapModalItem[] = React.useMemo(() => {
    return scrapCards
      .filter((card) => selectedScrapPurities.has(card.purity))
      .map((card) => ({
        id: card.purity.toString(),
        purity: card.purity,
        availableWeight: card.totalWeight,
      }));
  }, [scrapCards, selectedScrapPurities]);

  const scrapCalculations = React.useMemo(() => {
    let weightedPuritySum = 0;
    let totalAvailableWeight = 0;

    scrapModalItems.forEach((item) => {
      weightedPuritySum += item.availableWeight * item.purity;
      totalAvailableWeight += item.availableWeight;
    });

    const finalPurity = totalAvailableWeight > 0 ? weightedPuritySum / totalAvailableWeight : 0;

    return {
      finalPurity,
      totalAvailableWeight,
    };
  }, [scrapModalItems]);

  const openScrapModal = () => {
    if (selectedScrapPurities.size === 0) {
      toast.error('Please select at least one scrap card');
      return;
    }
    setIsScrapModalOpen(true);
  };

  // Handle selecting purity in Add Scrap popup
  const handleSelectPurity = (purityVal: number | '') => {
    if (purityVal === '') {
      setSelectedPurity('');
      setAvailableWeight(0);
      setParticular('');
      return;
    }
    setSelectedPurity(purityVal);
    const card = scrapCards.find((c) => c.purity === purityVal);
    const wt = card ? card.totalWeight : 0;
    setAvailableWeight(wt);
    setParticular(`Scrap Melting ${purityVal}%`);
  };

  // Open Add Scrap popup
  const handleOpenAddScrap = (defaultPurity?: number) => {
    if (defaultPurity !== undefined) {
      handleSelectPurity(defaultPurity);
    } else if (scrapCards.length > 0) {
      handleSelectPurity(scrapCards[0].purity);
    } else {
      setSelectedPurity('');
      setAvailableWeight(0);
      setParticular('');
    }
    setScrapWeight('');
    setShowAddScrapModal(true);
  };

  // Submit scrap to melting
  const handleSubmitAddScrap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPurity) {
      toast.error('Please select a purity');
      return;
    }
    const weightNum = parseFloat(scrapWeight);
    if (!weightNum || isNaN(weightNum) || weightNum <= 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    setIsSubmittingScrap(true);
    const expectedFine = calculateExpectedFine(weightNum, Number(selectedPurity));
    const particularText = particular.trim() || `Scrap Melting ${selectedPurity}%`;

    try {
      await submitMeltingScrap.mutateAsync({
        particular: particularText,
        grossWt: weightNum,
        purity: Number(selectedPurity),
        expectedFine: expectedFine,
        weight: weightNum,
        scrapWeight: weightNum,
      });
      toast.success('Scrap added to melting successfully!');
      await refetch();
    } catch (err: any) {
      console.warn('API submission error, adding locally to melting process:', err);
      const newEntry: MeltingRow = {
        id: `melting-${Date.now()}`,
        srNo: meltingEntries.length + 1,
        dateTime: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        particular: particularText,
        grossWt: weightNum,
        purity: Number(selectedPurity),
        expectedFine: expectedFine,
        fineWeight: 0,
        loss: 0,
        scrapCount: 1,
        isEditing: true,
        isSaved: false,
        grossWtRaw: weightNum.toString(),
        fineWeightRaw: '',
        purityRaw: selectedPurity.toString(),
        isDirty: false,
      };
      setMeltingEntries((prev) => [newEntry, ...prev]);
      toast.success('Scrap added to melting successfully!');
    } finally {
      setIsSubmittingScrap(false);
      setShowAddScrapModal(false);
      setScrapWeight('');
    }
  };
  useEffect(() => {
    if (meltingLoading) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (meltingData && meltingData.length > 0) {
      const entries: MeltingRow[] = meltingData.map(
        (item: any, index: number) => {
          const grossWt = item.grossWt || item.grossWeight || item.weight || 0;
          const purity = item.purity || 0;
          const expectedFine =
            item.expectedFine || calculateExpectedFine(grossWt, purity);
          const fineWeight = item.fineWeight || item.fineWeight || expectedFine || 0;
          const isSaved = item.isCompleted === true;

          const loss = isSaved
            ? (item.loss !== undefined && item.loss !== null
              ? item.loss
              : Math.max(0, Math.round((expectedFine - fineWeight) * 1000) / 1000))
            : Math.max(0, Math.round((expectedFine - fineWeight) * 1000) / 1000);

          return {
            id: item.id || `melting-${index}`,
            srNo: index + 1,
            dateTime: item.createdAt
              ? new Date(item.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              : '-',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            particular:
              item.particular ||
              item.name ||
              `Scrap Melting ${purity ? purity + '%' : ''}`,
            grossWt: grossWt,
            purity: purity,
            expectedFine: expectedFine,
            fineWeight: fineWeight,
            loss: loss,
            scrapCount: item.scrapCount || item.count || 1,
            isEditing: !isSaved,
            isSaved: isSaved,
            grossWtRaw: grossWt ? grossWt.toString() : '',
            fineWeightRaw: fineWeight ? fineWeight.toString() : '',
            purityRaw: purity ? purity.toString() : '',
            isDirty: false,
          };
        },
      );
      setMeltingEntries(entries);
    } else {
      setMeltingEntries([]);
    }
  }, [meltingData, meltingLoading, error]);

  // Filter history by fromDate and toDate
  const getFilteredHistory = () => {
    const sourceData =
      Array.isArray(meltingHistory) ? meltingHistory : [];

    if (!fromDate && !toDate) {
      return sourceData;
    }

    return sourceData.filter((item: any) => {
      const itemDate = new Date(
        item.createdAt || item.updatedAt || Date.now(),
      );
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  };

  // History totals
  const historyTotals = React.useMemo(() => {
    const data = getFilteredHistory();
    return data.reduce(
      (acc: any, item: any) => {
        const gross = Number(item.grossWeight ?? item.grossWt ?? item.weight ?? 0);
        const expected = Number(item.expected ?? item.expectedFine ?? calculateExpectedFine(gross, item.purity));
        const fine = Number(item.fineWeight || 0);
        const loss =
          item.loss !== undefined && item.loss !== null
            ? Number(item.loss)
            : Math.max(0, expected - fine);
        return {
          totalGross: acc.totalGross + gross,
          totalExpected: acc.totalExpected + expected,
          totalFine: acc.totalFine + fine,
          totalLoss: acc.totalLoss + loss,
        };
      },
      { totalGross: 0, totalExpected: 0, totalFine: 0, totalLoss: 0 },
    );
  }, [meltingHistory, fromDate, toDate]);

  // Main Melting process totals
  const meltingTotals = React.useMemo(() => {
    return (meltingEntries || []).reduce(
      (acc: any, item: MeltingRow) => ({
        totalGross: acc.totalGross + (Number(item.grossWt) || 0),
        totalExpected: acc.totalExpected + (Number(item.expectedFine) || 0),
        totalFine: acc.totalFine + (Number(item.fineWeight) || 0),
        totalLoss: acc.totalLoss + (Number(item.loss) || 0),
      }),
      { totalGross: 0, totalExpected: 0, totalFine: 0, totalLoss: 0 },
    );
  }, [meltingEntries]);

  const handleInlineChange = useCallback(
    (index: number, field: 'fineWeight', value: string) => {
      setMeltingEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };
            if (field === 'fineWeight') {
              updated.fineWeightRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.fineWeight = 0;
              } else {
                const numValue = parseFloat(value);
                updated.fineWeight = isNaN(numValue) ? 0 : numValue;
              }
              updated.loss = Math.max(
                0,
                Math.round((updated.expectedFine - updated.fineWeight) * 1000) / 1000
              );
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

  // Stock Action Click
  const handleStockClick = useCallback(
    (index: number) => {
      const entry = meltingEntries[index];
      // if (!entry.fineWeight || entry.fineWeight <= 0) {
      //   toast.error('Please enter a valid fine weight');
      //   return;
      // }
      setSaveIndex(index);
      setShowConfirmModal(true);
    },
    [meltingEntries],
  );

  // Confirm Stock and Proceed
  const confirmStock = useCallback(async () => {
    if (saveIndex === null) return;
    const index = saveIndex;
    const entry = meltingEntries[index];

    setIsLoading(true);
    try {
      await submitMeltingStock.mutateAsync({
        id: entry.id,
        data: {
          particular: entry.particular,
          grossWt: entry.grossWt,
          loss: entry.loss,
          purity: entry.purity,
          expectedFine: entry.expectedFine,
          fineWeight: entry.fineWeight,
          isCompleted: true,
        },
      });

      setMeltingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isDirty: false }
            : s,
        ),
      );

      toast.success('Melting gold sent to Stock successfully!');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();
    } catch (err: any) {
      console.error('Error stocking melted gold:', err);
      const backendMessage =
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : err?.response?.data?.message) ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to send melting gold to stock';
      toast.error(backendMessage);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, meltingEntries, submitMeltingStock, refetch]);

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      setFromDate(null);
      setToDate(null);
      refetch();
    } else {
      setShowHistory(true);
      const { monday, sunday } = getCurrentWeekRange();
      setFromDate(monday);
      setToDate(sunday);
      refetchHistory();
    }
  };

  // historyColumns removed

  // Main Table columns
  const columns = getMeltingColumns(getScaleProps, handleInlineChange, handleStockClick);

  // Print History Report
  const handlePrintHistory = () => {
    printMeltingHistory(getFilteredHistory(), fromDate, toDate, getpdfheaderdata);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Scrap Cards Bar with Smooth Scrollbar */}
      {scrapCards.length > 0 && !showHistory && (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Available Scrap for Melting
              </span>
            </div>

            {/* Received Scrap Button - Only show when at least one card is selected */}
            {selectedScrapPurities.size > 0 && (
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

          {/* Scrollable Container */}
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600">
            {scrapCards.map((card, idx) => {
              const isSelected = selectedScrapPurities.has(card.purity);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleSelectScrapCard(card.purity)}
                  className={`flex min-w-[140px] flex-col items-start rounded-xl border px-4 py-3 shadow-sm transition-all ${isSelected
                      ? 'border-2 border-[#785600] bg-amber-50 shadow-md ring-2 ring-[#785600]/20 dark:border-amber-400 dark:bg-amber-950/50'
                      : 'border-[#d3c4af]/30 bg-white hover:border-[#785600]/60 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-black dark:text-white">
                      Scrap ({card.purity}%)
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold text-black dark:text-white">
                    {(Number(card.totalWeight) || 0).toFixed(3)} G
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
            {showHistory ? 'Melting History' : 'Melting Process'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showHistory && (
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <GenericWeeklyDatePicker
                  id="from-date-melting"
                  placeholder="DD/MM/YYYY"
                  mode="from"
                  initialDates={fromDate ? [fromDate] : []}
                  onDateChange={(dates) => {
                    if (dates && dates.length > 0) {
                      const selected = new Date(dates[0]);
                      selected.setHours(0, 0, 0, 0);
                      setFromDate(selected);
                    } else {
                      setFromDate(null);
                    }
                  }}
                  className="w-32 sm:w-36 md:w-40"
                />
              </div>

              <div>
                <GenericWeeklyDatePicker
                  id="to-date-melting"
                  placeholder="DD/MM/YYYY"
                  mode="to"
                  initialDates={toDate ? [toDate] : []}
                  onDateChange={(dates) => {
                    if (dates && dates.length > 0) {
                      const selected = new Date(dates[0]);
                      selected.setHours(23, 59, 59, 999);
                      setToDate(selected);
                    } else {
                      setToDate(null);
                    }
                  }}
                  className="w-32 sm:w-36 md:w-40"
                />
              </div>
            </div>
          )}

          {showHistory && (
            <GenericButton type="button" onClick={handlePrintHistory} variant="primary">
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          )}

          <GenericButton
            type="button"
            onClick={toggleHistory}
            variant="primary"
          >
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Melting' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Table Section */}
      {!showHistory ? (
        <div>
          {/* Melting Process Summary Cards */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Gross Wt
                </span>
                <span className="text-lg font-bold text-black dark:text-amber-400">
                  {formatNumberDisplay(meltingTotals.totalGross)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Expected Wt
                </span>
                <span className="text-lg font-bold text-black dark:text-blue-400">
                  {formatNumberDisplay(meltingTotals.totalExpected)} G
                </span>
              </div>
            </div>
          </div>

          <GenericTable<MeltingRow>
            data={meltingEntries || []}
            columns={columns}
            emptyMessage="No melting records found. Scrap from manufacturing processes will appear here."
            isLoading={meltingLoading}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        <HistoryDept
          historyData={getFilteredHistory()}
          historyTotals={historyTotals}
          historyLoading={historyLoading}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && saveIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-bold text-[#1a1c1b] dark:text-white">
              Confirm Stocking Melted Gold
            </h3>
            <p className="mb-4 text-sm text-[#4f4535] dark:text-slate-400">
              Are you sure you want to send this melted fine gold to Stock?
            </p>

            <div className="mb-4 rounded-xl bg-gray-50 p-3 text-xs dark:bg-slate-800">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Particular:</span>
                <span className="font-semibold text-black dark:text-white">
                  {meltingEntries[saveIndex]?.particular}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Gross Wt:</span>
                <span className="font-mono font-semibold text-black dark:text-white">
                  {formatNumberDisplay(meltingEntries[saveIndex]?.grossWt)} G
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Purity:</span>
                <span className="font-mono font-semibold text-black dark:text-white">
                  {meltingEntries[saveIndex]?.purity}%
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Fine Wt:</span>
                <span className="font-mono font-bold text-black dark:text-green-400">
                  {formatNumberDisplay(meltingEntries[saveIndex]?.fineWeight)} G
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSaveIndex(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <GenericButton
                type="button"
                onClick={confirmStock}
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? 'Stocking...' : 'Confirm & Stock'}
              </GenericButton>
            </div>
          </div>
        </div>
      )}

      {/* Scrap Received & Melting Modal */}
      <MeltingPopup
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        scrapModalItems={scrapModalItems}
        scrapCalculations={scrapCalculations}
        refetchCuttingScrap={refetch}
        refetch={refetch}
        onSuccess={() => {
          setSelectedScrapPurities(new Set());
        }}
        onSubmitScrap={async (payload) => {
          await submitMeltingScrap.mutateAsync({
            ...payload,
            particular: `Scrap Melting ${payload.avgPurity}%`,
            grossWt: payload.weight,
            purity: payload.avgPurity,
            expectedFine: calculateExpectedFine(payload.weight, payload.avgPurity),
            fineWeight: payload.weight * (payload.receivedPurity / 100),
            lossWeight: payload.lossFineWeight,
          });
        }}
      />
    </div>
  );
};

export default MeltingDept;