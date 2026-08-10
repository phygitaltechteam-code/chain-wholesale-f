import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, History, ChevronRight, ChevronDown, Printer, Calendar } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetCutting, useGetCuttingHistory, useSubmitCutting, useSubmitMoveKunda } from '@/lib/api/cutting';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';

interface CuttingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: number;
  chainGiven: number;
  chainReceived: number;
  scrap: number;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainGivenRaw?: string;
  chainReceivedRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

// Helper functions for safely extracting values
const getItemName = (item: any): string => {
  if (!item) return '-';
  if (typeof item === 'string') return item;
  if (item.name) return item.name;
  return '-';
};

const getSizeName = (size: any): string => {
  if (!size) return '-';
  if (typeof size === 'string') return size;
  if (size.size) return size.size;
  return '-';
};

// Calculate Loss: Chain Given - Chain Received
const calculateLoss = (chainGiven: number, chainReceived: number): number => {
  return Math.max(0, chainGiven - chainReceived);
};

const CuttingDept: React.FC = () => {
  const navigate = useNavigate();
  const [cuttingEntries, setCuttingEntries] = useState<CuttingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'stock' | 'kunda' | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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
  const { data: cuttingData = [], isLoading: cuttingLoading, refetch, error } = useGetCutting();
  const { data: cuttingHistory = [], isLoading: historyLoading, refetch: refetchHistory } = useGetCuttingHistory();
  const submitCutting = useSubmitCutting();
  const submitMoveKunda = useSubmitMoveKunda();

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
      const entries: CuttingEntry[] = cuttingData.map((cutting: any, index: number) => {
        const itemName = cutting.item?.name || cutting.itemId || 'N/A';
        const sizeName = cutting.size?.size || cutting.sizeId || 'N/A';

        const chainGiven = cutting.chainWeight || 0;
        const chainReceived = cutting.chainReceived || 0;
        const loss = calculateLoss(chainGiven, chainReceived);

        const isSaved = cutting.isCompleted === true &&
          cutting.chainReceived !== null &&
          cutting.chainReceived !== undefined &&
          cutting.purity !== null &&
          cutting.purity !== undefined;

        return {
          id: cutting.id,
          srNo: index + 1,
          dateTime: new Date(cutting.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          item: itemName,
          size: sizeName,
          purity: cutting.purity || 0,
          chainGiven: chainGiven,
          chainReceived: chainReceived,
          scrap: cutting.scrap || 0,
          loss: loss,
          isEditing: !isSaved,
          isSaved: isSaved,
          chainGivenRaw: cutting.chainWeight ? cutting.chainWeight.toString() : '',
          chainReceivedRaw: cutting.chainReceived ? cutting.chainReceived.toString() : '',
          scrapRaw: cutting.scrap ? cutting.scrap.toString() : '',
          purityRaw: cutting.purity ? cutting.purity.toString() : '',
          itemId: cutting.itemId,
          sizeId: cutting.sizeId,
          isCompleted: cutting.isCompleted || false,
        };
      });
      setCuttingEntries(entries);
    } else {
      setCuttingEntries([]);
    }
  }, [cuttingData, cuttingLoading, error]);

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

  const toNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  // Indian format, maximum 3 decimals and NO trailing zeros.
  const formatNumberDisplay = (value: unknown): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
      useGrouping: true,
    }).format(toNumber(value));
  };

  // Filter history by selected From-To date range.
  const getFilteredHistory = () => {
    let filtered = cuttingHistory;

    if (dateRange.length === 2) {
      const from = new Date(dateRange[0]);
      const to = new Date(dateRange[1]);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      filtered = cuttingHistory.filter((item: any) => {
        if (!item?.createdAt) return false;
        const itemDate = new Date(item.createdAt);
        if (Number.isNaN(itemDate.getTime())) return false;
        return itemDate >= from && itemDate <= to;
      });
    }

    return filtered;
  };

  // Calculate history totals
  const filteredHistory = getFilteredHistory();
  const historyTotals = filteredHistory.reduce(
    (acc: { totalGiven: number; totalReceived: number; totalScrap: number; totalLoss: number }, item: any) => ({
      totalGiven: acc.totalGiven + toNumber(item?.chainWeight),
      totalReceived: acc.totalReceived + toNumber(item?.chainReceived),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss: acc.totalLoss + toNumber(item?.loss),
    }),
    { totalGiven: 0, totalReceived: 0, totalScrap: 0, totalLoss: 0 }
  );

  // Print History Function with filtered data
  const handlePrintHistory = () => {
    const filteredData = getFilteredHistory();

    if (!filteredData || filteredData.length === 0) {
      toast.error('No history records available to print for the selected date range');
      return;
    }

    // Create a hidden div for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 100%;
        background: white;
        padding: 4px;
        z-index: 9999;
    `;
    document.body.appendChild(printContainer);

    // Build the table rows - Compact with minimum padding
    const rows = filteredData
      .map((item: any, index: number) => {
        const { date, time } = formatDate(item?.createdAt);
        const { date: proceedDate, time: proceedTime } = formatDate(item?.updatedAt);

        return `
                <tr>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${index + 1}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                        ${date} ${time}
                    </td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getItemName(item?.item)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getSizeName(item?.size)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.chainWeight)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.chainReceived)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.loss)}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.purity)}%</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                        ${proceedDate} ${proceedTime}
                    </td>
                </tr>
            `;
      })
      .join('');

    // Set the content with PDF Header - Minimal padding
    printContainer.innerHTML = `
        <div style="max-width:1200px;margin:0 auto;font-family:Arial,sans-serif;padding:0;">
            <!-- PDF Header -->
            <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin:0;padding:0;font-size:11px;font-weight:bold;color:#a84b20;">
                    <span>॥ श्री गणेश प्रसन्न ॥</span>
                    <span>॥ श्री साई प्रसन्न ॥</span>
                </div>
                <div style="margin:1px 0 0 0;padding:0;font-size:20px;font-weight:bold;color:#c43d5c;line-height:1.1;">
                    मातोश्री चेन फॅक्टरी
                </div>
                <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#8b451f;line-height:1.2;">
                    आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
                </div>
                <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#a84b20;line-height:1.2;">
                    प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ९३०९३५५१३६
                </div>
                <div style="border-bottom:2px solid #c43d5c;margin:2px 0 3px 0;"></div>
            </div>

            <!-- Title -->
            <h2 style="text-align:center;margin:2px 0 2px 0;font-size:16px;color:#000;padding:0;">Cutting History Report</h2>
            ${dateRange.length === 2 ? `
                <p style="text-align:center;font-size:10px;color:#000;margin:0 0 2px 0;">
                    Date Range: ${new Date(dateRange[0]).toLocaleDateString('en-IN')} to ${new Date(dateRange[1]).toLocaleDateString('en-IN')}
                </p>
            ` : ''}

            <!-- Table -->
            <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
                <thead>
                    <tr style="background:#785600;color:white;font-weight:600;">
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Item</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Size</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Given</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Rec</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Scrap</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Loss</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Purity %</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Proceed</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
             </table>

       </div>
    `;

    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
        @page {
            margin: 3mm;
        }
        @media print {
            body * {
                visibility: hidden;
            }
            #print-container, #print-container * {
                visibility: visible;
            }
            #print-container {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: white !important;
                padding: 4px !important;
                overflow: auto !important;
                z-index: 9999 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            #print-container table {
                width: 100% !important;
            }
            #print-container tr {
                page-break-inside: avoid !important;
            }
            #print-container thead tr {
                background: #785600 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            #print-container thead tr th {
                background: #785600 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    `;
    document.head.appendChild(style);

    // Trigger print
    setTimeout(() => {
      window.print();

      // Clean up after print
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 1000);
    }, 500);
  };

  // History table columns
  const historyColumns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item.createdAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
          </div>
        );
      },
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {getItemName(item?.item)}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {getSizeName(item?.size)}
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight)}
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainReceived)}
        </span>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.scrap)}
        </span>
      ),
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.loss)}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item.updatedAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
          </div>
        );
      },
    },
  ];

  // Handle inline field change
  const handleInlineChange = useCallback((index: number, field: 'chainGiven' | 'chainReceived' | 'scrap' | 'purity', value: string) => {
    setCuttingEntries(prev => prev.map((entry, i) => {
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
          // Recalculate loss when chainGiven changes
          updated.loss = calculateLoss(updated.chainGiven, updated.chainReceived);
        } else if (field === 'chainReceived') {
          updated.chainReceivedRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.chainReceived = 0;
          } else {
            const numValue = parseFloat(value);
            updated.chainReceived = isNaN(numValue) ? 0 : numValue;
          }
          // Recalculate loss when chainReceived changes
          updated.loss = calculateLoss(updated.chainGiven, updated.chainReceived);
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

        return updated;
      }
      return entry;
    }));
  }, []);

  // Open confirmation popup before saving
  const handleSaveClick = useCallback((index: number, target: 'stock' | 'kunda') => {
    const entry = cuttingEntries[index];

    if (!entry.chainGiven || entry.chainGiven < 0) {
      toast.error('Please enter a valid chain given weight');
      return;
    }

    if (!entry.chainReceived || entry.chainReceived < 0) {
      toast.error('Please enter a valid chain received weight');
      return;
    }

    if (!entry.scrap || entry.scrap < 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    if (!entry.purity || entry.purity < 0 || entry.purity > 100) {
      toast.error('Please enter a valid purity percentage (1-100)');
      return;
    }

    // Validate that chainReceived doesn't exceed chainGiven
    if (entry.chainReceived > entry.chainGiven) {
      toast.error(`Chain Received (${formatNumberDisplay(entry.chainReceived)}) cannot exceed Chain Given (${formatNumberDisplay(entry.chainGiven)})`);
      return;
    }

    setSaveIndex(index);
    setActionType(target);
    setShowConfirmModal(true);
  }, [cuttingEntries]);

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
        }
      });

      setCuttingEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true, isCompleted: true } : s
      ));

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
      await refetch();

      toast.success('Cutting entry saved to Stock successfully!');
      navigate({
        to: '/Stocks/stockpage'
      });
    } catch (error) {
      console.error('Error saving cutting to Stock:', error);
      toast.error('Failed to save cutting entry');
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
        }
      });

      setCuttingEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true, isCompleted: true } : s
      ));

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
      await refetch();

      toast.success('Cutting entry moved to S Kunda successfully!');
      navigate({
        to: '/manufacturingprocess/process',
        state: { selectedTab: 'kunda' }
      });
    } catch (error) {
      console.error('Error moving cutting entry to S Kunda:', error);
      toast.error('Failed to move to S Kunda');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, cuttingEntries, submitMoveKunda, navigate, refetch]);

  // Action column is shown only when at least one unsaved row
  // has an entered Chain Given / Chain Received / Scrap / Purity value.
  const hasEditableValues = (entry: CuttingEntry): boolean => {
    return Boolean(
      entry.chainGivenRaw?.trim() ||
      entry.chainReceivedRaw?.trim() ||
      entry.scrapRaw?.trim() ||
      entry.purityRaw?.trim()
    );
  };

  const showActionColumn = cuttingEntries.some(
    (entry) => !entry.isSaved && hasEditableValues(entry)
  );

  // Define columns for GenericTable
  const columns: Column<CuttingEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm text-[#4f4535] dark:text-slate-400">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {typeof item?.item === 'object'
            ? (item?.item?.name ?? '-')
            : (item?.item ?? '-')}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {typeof item?.size === 'object'
            ? (item?.size?.size ?? '-')
            : (item?.size ?? '-')}
        </span>
      ),
    },
    {
      key: 'chainGiven',
      header: 'Chain Given (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.chainGivenRaw !== undefined ? item.chainGivenRaw : (item.chainGiven === 0 ? '' : item.chainGiven)}
              onChange={(e) => handleInlineChange(index, 'chainGiven', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainGiven)}
          </span>
        );
      },
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.chainReceivedRaw !== undefined ? item.chainReceivedRaw : (item.chainReceived === 0 ? '' : item.chainReceived)}
              onChange={(e) => handleInlineChange(index, 'chainReceived', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainReceived)}
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.scrapRaw !== undefined ? item.scrapRaw : (item.scrap === 0 ? '' : item.scrap)}
              onChange={(e) => handleInlineChange(index, 'scrap', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)}
          </span>
        );
      },
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => (
        <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400">
          {formatNumberDisplay(item.loss)}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.purityRaw !== undefined ? item.purityRaw : (item.purity === 0 ? '' : item.purity)}
              onChange={(e) => handleInlineChange(index, 'purity', e.target.value)}
              placeholder="e.g., 91.6 %"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)}%
          </span>
        );
      },
    },


    // Same condition as the other departments:
    // Action column stays hidden until a value is entered.
    ...(showActionColumn
      ? [
        {
          key: 'actions',
          header: 'Action',
          render: (item: CuttingEntry, index: number) => {
            if (item.isSaved || !hasEditableValues(item)) {
              return null;
            }

            return (
              <div className="flex items-center gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => handleSaveClick(index, 'stock')}
                  disabled={isLoading || submitCutting.isPending || submitMoveKunda.isPending}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  title="Save to Stock"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveClick(index, 'kunda')}
                  disabled={isLoading || submitCutting.isPending || submitMoveKunda.isPending}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  title="Move to S Kunda"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>S Kunda</span>
                </button>
              </div>
            );
          },
        } as Column<CuttingEntry>,
      ]
      : []),
  ];

  const isSubmitting = submitCutting.isPending;

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
    <div className="bg-[#f9f9f7] dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#1a1c1b] dark:text-white truncate">
              {showHistory ? 'Cutting History' : 'Cutting Department'}
            </h1>

          </div>
          <div className="flex items-center gap-2">
            {/* Weekly Date Filter - Only show when viewing history */}
            {showHistory && (
              <div className="flex items-center gap-2">
                {/* From Date - defaults to Monday */}
                <GenericWeeklyDatePicker
                  id="from-date-cutting"
                  placeholder="DD/MM/YYYY"
                  mode="from"
                  initialDates={dateRange}
                  onDateChange={(dates) => {
                    if (dates && dates.length > 0) {
                      const from = dates[0];

                      if (dateRange.length === 2) {
                        const to = dateRange[1];

                        if (from <= to) {
                          setDateRange([from, to]);
                        } else {
                          const sunday = new Date(from);
                          sunday.setDate(from.getDate() + 6);
                          sunday.setHours(23, 59, 59, 999);
                          setDateRange([from, sunday]);
                        }
                      } else {
                        const sunday = new Date(from);
                        sunday.setDate(from.getDate() + 6);
                        sunday.setHours(23, 59, 59, 999);
                        setDateRange([from, sunday]);
                      }
                    }
                  }}
                  className="w-32 sm:w-36 md:w-40"
                />

                {/* To Date - defaults to Sunday */}
                <GenericWeeklyDatePicker
                  id="to-date-cutting"
                  placeholder="DD/MM/YYYY"
                  mode="to"
                  initialDates={dateRange}
                  onDateChange={(dates) => {
                    if (dates && dates.length > 0) {
                      const to = dates[0];

                      if (dateRange.length === 2) {
                        const from = dateRange[0];

                        if (from <= to) {
                          setDateRange([from, to]);
                        } else {
                          const monday = new Date(to);
                          monday.setDate(to.getDate() - 6);
                          monday.setHours(0, 0, 0, 0);
                          setDateRange([monday, to]);
                        }
                      } else {
                        const monday = new Date(to);
                        monday.setDate(to.getDate() - 6);
                        monday.setHours(0, 0, 0, 0);
                        setDateRange([monday, to]);
                      }
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
                onClick={handlePrintHistory}
                className="flex items-center gap-1.5 whitespace-nowrap !bg-green-600 !px-3 !py-1.5 !text-xs !text-white hover:!bg-green-700 sm:!px-4 sm:!py-2 sm:!text-sm"
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Print</span>
              </GenericButton>
            )}

            {/* History Toggle Button */}
            <GenericButton
              type="button"
              onClick={toggleHistory}
              className={`flex items-center gap-1.5 !px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !text-white whitespace-nowrap ${showHistory ? '!bg-amber-600 hover:!bg-amber-700' : '!bg-blue-600 hover:!bg-blue-700'
                }`}
            >
              {showHistory ? (
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span>
                {showHistory ? 'Show Cutting' : 'History'}
              </span>
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Cutting Table OR History Table */}
      {!showHistory ? (
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable<CuttingEntry>
            data={cuttingEntries}
            columns={columns}
            emptyMessage="No cutting entries found."
            isLoading={cuttingLoading || isSubmitting}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        <div className="px-3 py-4 sm:px-4 md:px-6">
          {/* History Summary Cards - Updated with Loss */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                    Chain Given
                  </span>
                  <span className="text-lg font-bold text-black dark:text-amber-400">
                    {formatNumberDisplay(historyTotals.totalGiven)} G
                  </span>
                </div>
                <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-amber-900/30 border border-[#785600]/20 dark:border-amber-700/30">
                  <span className="text-[#785600] dark:text-amber-400">📤</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                    Chain Received
                  </span>
                  <span className="text-lg font-bold text-black dark:text-blue-400">
                    {formatNumberDisplay(historyTotals.totalReceived)} G
                  </span>
                </div>
                <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-blue-900/30 border border-[#785600]/20 dark:border-blue-700/30">
                  <span className="text-[#785600] dark:text-blue-400">📥</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                    Scrap
                  </span>
                  <span className="text-lg font-bold text-black dark:text-green-400">
                    {formatNumberDisplay(historyTotals.totalScrap)} G
                  </span>
                </div>
                <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-green-900/30 border border-[#785600]/20 dark:border-green-700/30">
                  <span className="text-[#785600] dark:text-green-400">♻️</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                    Loss
                  </span>
                  <span className="text-lg font-bold text-black dark:text-red-400">
                    {formatNumberDisplay(historyTotals.totalLoss)} G
                  </span>
                </div>
                <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-red-900/30 border border-[#785600]/20 dark:border-red-700/30">
                  <span className="text-[#785600] dark:text-red-400">⚠️</span>
                </div>
              </div>
            </div>
          </div>

          <GenericTable
            data={getFilteredHistory()}
            columns={historyColumns}
            emptyMessage={
              dateRange.length === 2
                ? `No history records found for the selected date range (${new Date(dateRange[0]).toLocaleDateString('en-IN')} to ${new Date(dateRange[1]).toLocaleDateString('en-IN')})`
                : "No history records found. Complete a cutting process to see history."
            }
            isLoading={historyLoading}
            showSrNo={true}
            srNoLabel="Sr No."
            className="shadow-sm"
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                  <Save className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-center text-lg font-bold text-[#1a1c1b] dark:text-white mb-2">
                Confirm Action
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this cutting entry and send it to <strong>{actionType === 'stock' ? 'Stock' : 'S Kunda'}</strong>?
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
                  onClick={actionType === 'stock' ? confirmSaveStock : confirmSaveKunda}
                  disabled={isLoading}
                  className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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