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

interface MeltingRow {
  id: string;
  srNo: number;
  dateTime: string;
  particular: string;
  grossWt: number;
  purity: number;
  expectedFine: number;
  fineWeight: number;
  loss: number;
  scrapCount: number;
  isEditing?: boolean;
  isSaved?: boolean;
  grossWtRaw?: string;
  fineWeightRaw?: string;
  purityRaw?: string;
  isDirty?: boolean;
}

interface ScrapCardData {
  purity: number;
  totalWeight: number;
  count: number;
}

// ======================================================
// HELPER: Get Current Week Range
// ======================================================
const getCurrentWeekRange = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
};


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

  // Calculate Expected Fine: (Gross Wt * Purity) / 100
  const calculateExpectedFine = (grossWt: number, purity: number): number => {
    if (!grossWt || !purity) return 0;
    return Math.round(((grossWt * purity) / 100) * 1000) / 1000;
  };

  // Helper number display
  const toNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const formatNumberDisplay = (value: unknown): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
      useGrouping: true,
    }).format(toNumber(value));
  };

  const scrapCards: ScrapCardData[] = React.useMemo(() => {
    // First, check if we have scrap data from API
    const scrapList = Array.isArray(scrapData?.data) ? scrapData.data :
      Array.isArray(scrapData) ? scrapData : [];

    if (scrapList.length > 0) {
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

      const calculated = Array.from(cardMap.entries()).map(([purity, data]) => ({
        purity,
        totalWeight: Math.round(data.totalWeight * 1000) / 1000,
        count: data.count,
      }));

      return calculated;
    }

    // Fallback to meltingEntries if no scrap data
    const cardMap = new Map<number, { totalWeight: number; count: number }>();
    meltingEntries?.forEach((entry) => {
      const p = entry.purity || 0;
      if (p > 0) {
        const current = cardMap.get(p) || { totalWeight: 0, count: 0 };
        cardMap.set(p, {
          totalWeight: current.totalWeight + entry.grossWt,
          count: current.count + (entry.scrapCount || 1),
        });
      }
    });

    const calculated = Array.from(cardMap.entries()).map(([purity, data]) => ({
      purity,
      totalWeight: Math.round(data.totalWeight * 1000) / 1000,
      count: data.count,
    }));

    return calculated;
  }, [scrapData, meltingEntries]);

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


  // Format date helper for history
  const formatDate = (dateString: string) => {
    if (!dateString) return { date: '-', time: '-' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

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
      (acc: any, item: any) => ({
        totalGross:
          acc.totalGross + (item.grossWt || item.weight || item.grossWeight || 0),
        totalExpected: acc.totalExpected + (item.expectedFine || 0),
        totalFine:
          acc.totalFine + (item.fineWeight || item.fineWeight || 0),
      }),
      { totalGross: 0, totalExpected: 0, totalFine: 0 },
    );
  }, [meltingHistory, fromDate, toDate]);

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
      if (!entry.fineWeight || entry.fineWeight <= 0) {
        toast.error('Please enter a valid fine weight');
        return;
      }
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

  // History columns
  const historyColumns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item.createdAt || item.updatedAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'particular',
      header: 'Particular',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.particular || 'Scrap Melting'}
        </span>
      ),
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.grossWt || item.weight)} G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'expectedFine',
      header: 'Expected Fine (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.expectedFine)} G
        </span>
      ),
    },
    {
      key: 'fineWeight',
      header: 'Fine Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.fineWeight)} G
        </span>
      ),
    },
  ];

  // Main Table columns
  const columns: Column<MeltingRow>[] = [
    {
      key: 'particular',
      header: 'Particular',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.particular}
        </span>
      ),
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.grossWt)} G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <div className="flex w-24 items-center justify-center gap-1 whitespace-nowrap bg-gray-50/50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/50">
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)}%
          </span>
        </div>
      ),
    },
    {
      key: 'expectedFine',
      header: 'Expected (लगड)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.expectedFine)} G
        </span>
      ),
    },
    {
      key: 'fineWeight',
      header: 'Fine Wt (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                inputMode="decimal"
                {...getScaleProps(index, 'fineWeight')}
                onChange={(e) =>
                  handleInlineChange(index, 'fineWeight', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-28 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-7 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }
        return (
          <span className="font-mono text-sm font-semibold text-green-700 dark:text-green-400">
            {formatNumberDisplay(item.fineWeight)} G
          </span>
        );
      },
    },

    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => {
        const loss = Math.max(0, Math.round((item.expectedFine - item.fineWeight) * 1000) / 1000);
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(loss)} G
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item: MeltingRow, index: number) => {
        if (item.isSaved) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Stocked
            </span>
          );
        }

        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* Refine Button - Send to Stock */}
            <GenericButton
              type="button"
              onClick={() => handleStockClick(index)}
              variant="primary"
              className="flex items-center gap-1 text-xs py-1.5 px-3"
              title="Send Fine Gold to Stock"
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Refine</span>
            </GenericButton>
          </div>
        );
      },
    },
  ];

  // Print History Report
  const handlePrintHistory = () => {
    const data = getFilteredHistory();
    if (!data || data.length === 0) {
      toast.error('No history data to print');
      return;
    }

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';

    const rows = data
      .map((item: any, idx: number) => {
        const { date, time } = formatDate(item.createdAt || item.updatedAt);
        return `
          <tr>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;">${idx + 1}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;">${date} ${time}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;">${item.particular || 'Scrap Melting'}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;">${formatNumberDisplay(item.grossWt || item.weight)}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;">${formatNumberDisplay(item.purity)}%</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;">${formatNumberDisplay(item.expectedFine)}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;font-weight:bold;">${formatNumberDisplay(item.fineWeight || item.fineWeight)}</td>
          </tr>
        `;
      })
      .join('');

    const headerInfo =
      getpdfheaderdata?.data?.data ||
      (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
    const leftInvocation =
      headerInfo.leftInvocation || '॥ श्री गणेश प्रसन्न ॥';
    const rightInvocation =
      headerInfo.rightInvocation || '॥ श्री साई प्रसन्न ॥';
    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
    const description =
      headerInfo.description ||
      'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers =
      headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';

    printContainer.style.cssText =
      'position:fixed;left:-9999px;top:0;width:100%;background:white;padding:4px;z-index:9999;';
    document.body.appendChild(printContainer);

    printContainer.innerHTML = `
      <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;">
        <div style="text-align:center;border-bottom:2px solid #785600;padding-bottom:4px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;">
            <span>${leftInvocation}</span>
            <h2 style="margin:0;color:#785600;">${factoryName}</h2>
            <span>${rightInvocation}</span>
          </div>
          <div style="font-size:9px;">${description}</div>
          <div style="font-size:9px;">${proprietorName} - ${phoneNumbers}</div>
        </div>
        <h3 style="text-align:center;margin:4px 0 8px 0;font-size:14px;">Melting Department History Report</h3>
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <thead>
            <tr style="background:#785600;color:white;">
              <th style="border:1px solid #785600;padding:2px 3px;">Sr</th>
              <th style="border:1px solid #785600;padding:2px 3px;">Date & Time</th>
              <th style="border:1px solid #785600;padding:2px 3px;">Particular</th>
              <th style="border:1px solid #785600;padding:2px 3px;">Gross Wt (G)</th>
              <th style="border:1px solid #785600;padding:2px 3px;">Purity %</th>
              <th style="border:1px solid #785600;padding:2px 3px;">Expected Fine (G)</th>
              <th style="border:1px solid #785600;padding:2px 3px;">Fine Wt (G)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
      }, 1000);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Scrap Cards Bar with Smooth Scrollbar */}
      {scrapCards.length > 0 && !showHistory && (
        <div className="w-full">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Flame className="h-4 w-4 text-[#785600] dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Available Scrap for Melting
            </span>
          </div>

          {/* Scrollable Container */}
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600">
            {scrapCards.map((card, idx) => (
              <div
                key={idx}
                className="flex min-w-[90px] flex-col rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="font-mono text-[11px] font-bold text-black dark:text-white">
                  Scrap ({card.purity}%)
                </span>
                <span className="font-mono text-[11px] font-bold text-black dark:text-white">
                  {formatNumberDisplay(card.totalWeight)} G
                </span>
              </div>
            ))}
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
          {!showHistory && (
            <GenericButton
              type="button"
              onClick={() => handleOpenAddScrap()}
              variant="primary"
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Melting</span>
            </GenericButton>
          )}

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
        <div>
          {/* History Summary Cards */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Gross Wt
                </span>
                <span className="text-lg font-bold text-black dark:text-amber-400">
                  {formatNumberDisplay(historyTotals.totalGross)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Expected Fine
                </span>
                <span className="text-lg font-bold text-black dark:text-blue-400">
                  {formatNumberDisplay(historyTotals.totalExpected)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Melted Fine
                </span>
                <span className="text-lg font-bold text-black dark:text-amber-400">
                  {formatNumberDisplay(historyTotals.totalFine)} G
                </span>
              </div>
            </div>
          </div>

          <GenericTable
            data={getFilteredHistory()}
            columns={historyColumns}
            emptyMessage="No melting history found."
            isLoading={historyLoading}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
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

      {/* Add Scrap Modal */}
      {showAddScrapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
                Add Melting
              </h3>
              <button
                type="button"
                onClick={() => setShowAddScrapModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddScrap} className="flex flex-col gap-4">
              {/* 1. Purity Dropdown */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
                  Purity %
                </label>
                <select
                  value={selectedPurity}
                  onChange={(e) =>
                    handleSelectPurity(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Select Purity</option>
                  {scrapCards.map((c) => (
                    <option key={c.purity} value={c.purity}>
                      {c.purity}%
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Weight as per Purity */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
                  Weight as per Purity (G)
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    selectedPurity !== ''
                      ? `${formatNumberDisplay(availableWeight)} G`
                      : ''
                  }
                  placeholder="0.000 G"
                  className="font-mono w-full rounded-lg border border-[#d3c4af]/20 bg-amber-50/50 px-2 py-1.5 pr-6 text-sm font-bold text-black outline-none cursor-not-allowed dark:bg-amber-950/20 dark:text-amber-400"
                />
              </div>

              {/* 3. One Scrap Weight Input Field */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
                  Scrap Weight (G)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={scrapWeight}
                    {...modalScaleProps}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val)) {
                        setScrapWeight(val);
                      }
                    }}
                    placeholder="Enter scrap weight"
                    className="font-mono w-full rounded-lg border border-[#d3c4af]/20 bg-amber-50/50 px-2 py-1.5 pr-6 text-sm font-bold text-black outline-none cursor-not-allowed dark:bg-amber-950/20 dark:text-amber-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                    G
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                <GenericButton
                  type="submit"
                  variant="primary"
                  disabled={
                    !selectedPurity ||
                    !scrapWeight ||
                    (parseFloat(scrapWeight) || 0) <= 0 ||
                    isSubmittingScrap
                  }
                >
                  {isSubmittingScrap ? 'Submitting...' : 'Submit'}
                </GenericButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeltingDept;
