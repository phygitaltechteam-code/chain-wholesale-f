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
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import {
  useGetMelting,
  useGetMeltingHistory,
  useSubmitMeltingStock,
} from '@/lib/api/melting';

interface MeltingRow {
  id: string;
  srNo: number;
  dateTime: string;
  particular: string;
  grossWt: number;
  purity: number;
  expectedFine: number;
  fineWt: number;
  scrapCount: number;
  isEditing?: boolean;
  isSaved?: boolean;
  grossWtRaw?: string;
  fineWtRaw?: string;
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

// Static fallback data for scrap cards at top
const STATIC_SCRAP_CARDS: ScrapCardData[] = [
  { purity: 92, totalWeight: 125.45, count: 3 },
  { purity: 90, totalWeight: 90.0, count: 2 },
  { purity: 84, totalWeight: 62.8, count: 2 },
  { purity: 75, totalWeight: 45.2, count: 1 },
  { purity: 91.6, totalWeight: 110.35, count: 4 },
];

// Static fallback data for Melting table
const STATIC_MELTING_ROWS: MeltingRow[] = [
  {
    id: 'static-melting-1',
    srNo: 1,
    dateTime: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    particular: 'Soldering Scrap 92%',
    grossWt: 125.45,
    purity: 92,
    expectedFine: 115.414,
    fineWt: 115.414,
    scrapCount: 3,
    isEditing: true,
    isSaved: false,
    grossWtRaw: '125.450',
    fineWtRaw: '115.414',
    purityRaw: '92',
    isDirty: false,
  },
  {
    id: 'static-melting-2',
    srNo: 2,
    dateTime: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    particular: 'Joint Scrap 90%',
    grossWt: 90.0,
    purity: 90,
    expectedFine: 81.0,
    fineWt: 81.0,
    scrapCount: 2,
    isEditing: true,
    isSaved: false,
    grossWtRaw: '90.000',
    fineWtRaw: '81.000',
    purityRaw: '90',
    isDirty: false,
  },
  {
    id: 'static-melting-3',
    srNo: 3,
    dateTime: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    particular: 'Cutting Scrap 75%',
    grossWt: 45.2,
    purity: 75,
    expectedFine: 33.9,
    fineWt: 33.9,
    scrapCount: 1,
    isEditing: true,
    isSaved: false,
    grossWtRaw: '45.200',
    fineWtRaw: '33.900',
    purityRaw: '75',
    isDirty: false,
  },
  {
    id: 'static-melting-4',
    srNo: 4,
    dateTime: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    particular: 'Tar Scrap 84%',
    grossWt: 62.8,
    purity: 84,
    expectedFine: 52.752,
    fineWt: 52.752,
    scrapCount: 2,
    isEditing: true,
    isSaved: false,
    grossWtRaw: '62.800',
    fineWtRaw: '52.752',
    purityRaw: '84',
    isDirty: false,
  },
  {
    id: 'static-melting-5',
    srNo: 5,
    dateTime: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    particular: 'Box Scrap 91.6%',
    grossWt: 110.35,
    purity: 91.6,
    expectedFine: 101.081,
    fineWt: 101.081,
    scrapCount: 4,
    isEditing: true,
    isSaved: false,
    grossWtRaw: '110.350',
    fineWtRaw: '101.081',
    purityRaw: '91.6',
    isDirty: false,
  },
];

// Static fallback data for Melting history
const STATIC_MELTING_HISTORY = [
  {
    id: 'hist-1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    particular: 'Soldering Scrap Melting 92%',
    grossWt: 140.5,
    purity: 92,
    expectedFine: 129.26,
    fineWt: 129.2,
  },
  {
    id: 'hist-2',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    particular: 'Cutting Scrap Melting 75%',
    grossWt: 85.2,
    purity: 75,
    expectedFine: 63.9,
    fineWt: 63.85,
  },
  {
    id: 'hist-3',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    particular: 'Joint Scrap Melting 90%',
    grossWt: 95.0,
    purity: 90,
    expectedFine: 85.5,
    fineWt: 85.5,
  },
];

const MeltingDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [meltingEntries, setMeltingEntries] = useState<MeltingRow[]>(
    STATIC_MELTING_ROWS,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

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
  const submitMeltingStock = useSubmitMeltingStock();

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'fineWt'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

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

  // Load data from API or use static fallback
  useEffect(() => {
    if (meltingLoading) return;

    if (error) {
      console.error('Error fetching melting data:', error);
      setMeltingEntries(STATIC_MELTING_ROWS);
      return;
    }

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
          const fineWt = item.fineWt || item.fineWeight || expectedFine || 0;
          const isSaved = item.isCompleted === true;

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
            fineWt: fineWt,
            scrapCount: item.scrapCount || item.count || 1,
            isEditing: !isSaved,
            isSaved: isSaved,
            grossWtRaw: grossWt ? grossWt.toString() : '',
            fineWtRaw: fineWt ? fineWt.toString() : '',
            purityRaw: purity ? purity.toString() : '',
            isDirty: false,
          };
        },
      );
      setMeltingEntries(entries);
    } else {
      setMeltingEntries(STATIC_MELTING_ROWS);
    }
  }, [meltingData, meltingLoading, error]);

  // Aggregate scrap cards (e.g. Scrap 90% | Wt 90G | Count)
  const scrapCards: ScrapCardData[] = React.useMemo(() => {
    const cardMap = new Map<number, { totalWeight: number; count: number }>();
    meltingEntries.forEach((entry) => {
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

    return calculated.length > 0 ? calculated : STATIC_SCRAP_CARDS;
  }, [meltingEntries]);

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
      meltingHistory && meltingHistory.length > 0
        ? meltingHistory
        : STATIC_MELTING_HISTORY;

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
          acc.totalFine + (item.fineWt || item.fineWeight || 0),
      }),
      { totalGross: 0, totalExpected: 0, totalFine: 0 },
    );
  }, [meltingHistory, fromDate, toDate]);

  // Handle inline change for fineWt
  const handleInlineChange = useCallback(
    (index: number, field: 'fineWt', value: string) => {
      setMeltingEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };
            if (field === 'fineWt') {
              updated.fineWtRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.fineWt = 0;
              } else {
                const numValue = parseFloat(value);
                updated.fineWt = isNaN(numValue) ? 0 : numValue;
              }
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
      if (!entry.fineWt || entry.fineWt <= 0) {
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
          purity: entry.purity,
          expectedFine: entry.expectedFine,
          fineWt: entry.fineWt,
          isCompleted: true,
          type: 'INWARD',
          stockType: 'FINE_GOLD',
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
      key: 'fineWt',
      header: 'Fine Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.fineWt || item.fineWeight)} G
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
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">          {formatNumberDisplay(item.expectedFine)} G
        </span>
      ),
    },
    {
      key: 'fineWt',
      header: 'Fine Wt (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                inputMode="decimal"
                value={
                  item.fineWtRaw !== undefined
                    ? item.fineWtRaw
                    : item.fineWt === 0
                      ? ''
                      : item.fineWt
                }
                {...getScaleProps(index, 'fineWt')}
                onChange={(e) =>
                  handleInlineChange(index, 'fineWt', e.target.value)
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
            {formatNumberDisplay(item.fineWt)} G
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
          <GenericButton
            type="button"
            onClick={() => handleStockClick(index)}
            variant="primary"
            className="flex items-center gap-1 text-xs py-1.5 px-3"
            title="Send Fine Gold to Stock"
          >
            <PackageCheck className="h-3.5 w-3.5" />
            <span>Stock</span>
          </GenericButton>
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
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;font-weight:bold;">${formatNumberDisplay(item.fineWt || item.fineWeight)}</td>
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
            data={meltingEntries}
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
                <span className="font-mono font-bold text-green-700 dark:text-green-400">
                  {formatNumberDisplay(meltingEntries[saveIndex]?.fineWt)} G
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
    </div>
  );
};

export default MeltingDept;
