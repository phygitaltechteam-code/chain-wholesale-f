import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  Save,
  History,
  ChevronRight,
  ChevronDown,
  Printer,
  Calendar,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetCutting,
  useGetCuttingHistory,
  useSubmitCutting,
  useSubmitMoveKunda,
} from '@/lib/api/cutting';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';

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
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [cuttingEntries, setCuttingEntries] = useState<CuttingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEditedRow, setHasEditedRow] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'stock' | 'kunda' | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Weighing Scale table focus hook
  const {getScaleProps} = useTableScaleFocus<'chainReceived' | 'scrap'>(
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

    return {monday, sunday};
  };

  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const {monday, sunday} = getDefaultWeekRange();
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

          const chainGiven = cutting.chainWeight || 0;
          const chainReceived = cutting.chainReceived || 0;
          const loss = calculateLoss(chainGiven, chainReceived);

          const isSaved =
            cutting.isCompleted === true &&
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
              hour12: true,
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
            chainGivenRaw: cutting.chainWeight
              ? cutting.chainWeight.toString()
              : '',
            chainReceivedRaw: cutting.chainReceived
              ? cutting.chainReceived.toString()
              : '',
            scrapRaw: cutting.scrap ? cutting.scrap.toString() : '',
            purityRaw: cutting.purity ? cutting.purity.toString() : '',
            itemId: cutting.itemId,
            sizeId: cutting.sizeId,
            isCompleted: cutting.isCompleted || false,
          };
        },
      );
      setCuttingEntries(entries);
    } else {
      setCuttingEntries([]);
    }
  }, [cuttingData, cuttingLoading, error]);

  // Format date helper for history
  const formatDate = (dateString: string) => {
    if (!dateString) return {date: '-', time: '-'};
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
    {totalGiven: 0, totalReceived: 0, totalScrap: 0, totalLoss: 0},
  );

  // Print History Function with filtered data
  const handlePrintHistory = () => {
    const filteredData = getFilteredHistory();

    if (!filteredData || filteredData.length === 0) {
      toast.error(
        'No history records available to print for the selected date range',
      );
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
        const {date, time} = formatDate(item?.createdAt);
        const {date: proceedDate, time: proceedTime} = formatDate(
          item?.updatedAt,
        );

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

    const headerInfo =
      getpdfheaderdata?.data?.data ||
      (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
    const leftInvocation =
      headerInfo.leftInvocation ||
      headerInfo.leftInovation ||
      '॥ श्री गणेश प्रसन्न ॥';
    const rightInvocation =
      headerInfo.rightInvocation ||
      headerInfo.rightInovation ||
      '॥ श्री साई प्रसन्न ॥';
    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
    const description =
      headerInfo.description ||
      'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers =
      headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
    const invocationColor = headerInfo.invocationColor || '#a84b20';
    const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
    const descriptionColor = headerInfo.descriptionColor || '#8b451f';
    const proprietorColor = headerInfo.proprietorColor || '#a84b20';
    const phoneColor = headerInfo.phoneColor || '#a84b20';
    const factoryFontSize = headerInfo.factoryFontSize
      ? `${headerInfo.factoryFontSize}px`
      : '20px';
    const descriptionFontSize = headerInfo.descriptionFontSize
      ? `${headerInfo.descriptionFontSize}px`
      : '9px';
    const proprietorFontSize = headerInfo.proprietorFontSize
      ? `${headerInfo.proprietorFontSize}px`
      : '9px';
    const phoneFontSize = headerInfo.phoneFontSize
      ? `${headerInfo.phoneFontSize}px`
      : '9px';

    // Set the content with PDF Header - Minimal padding
    printContainer.innerHTML = `
       <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
        <!-- Header Section -->
        <div>
          <!-- PDF Header -->
          <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
              <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
              <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
              <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
            </div>
            <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">
              ${description}
            </div>
            <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
              ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
            </div>
            <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;"></div>
          </div>
            <!-- Title -->
            <!-- Title and Date Range in one line -->
<div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
  <div style="flex:1;"></div>
  <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
    Cutting History Report
  </h2>
  ${
    dateRange.length === 2
      ? `
    <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
      From: ${new Date(dateRange[0]).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(dateRange[1]).toLocaleDateString('en-IN')}
    </div>
  `
      : `
    <div style="flex:1;"></div>
  `
  }
</div>

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
        const {date, time} = formatDate(item.createdAt);
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
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight)} G
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainReceived)} G
        </span>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.scrap)} G
        </span>
      ),
    },

    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.loss)} G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'process',
      header: 'Status',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.process}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',
      render: (item) => {
        const {date, time} = formatDate(item.updatedAt);
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
  ];

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
            const updated = {...entry};

            if (field === 'chainGiven') {
              updated.chainGivenRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.chainGiven = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainGiven = isNaN(numValue) ? 0 : numValue;
              }
              // Recalculate loss when chainGiven changes
              updated.loss = calculateLoss(
                updated.chainGiven,
                updated.chainReceived,
              );
            } else if (field === 'chainReceived') {
              updated.chainReceivedRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.chainReceived = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainReceived = isNaN(numValue) ? 0 : numValue;
              }
              // Recalculate loss when chainReceived changes
              updated.loss = calculateLoss(
                updated.chainGiven,
                updated.chainReceived,
              );
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
            ? {...s, isEditing: false, isSaved: true, isCompleted: true}
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
      navigate({
        to: '/Stocks/stockpage',
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
        },
      });

      setCuttingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? {...s, isEditing: false, isSaved: true, isCompleted: true}
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
      navigate({
        to: '/manufacturingprocess/process',
        state: {selectedTab: 'kunda'},
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

  // Action column is hidden initially and appears only after
  // the user edits one of the input fields.
  const hasEditableValues = (entry: CuttingEntry): boolean => {
    return Boolean(
      entry.chainGivenRaw?.trim() ||
      entry.chainReceivedRaw?.trim() ||
      entry.scrapRaw?.trim() ||
      entry.purityRaw?.trim(),
    );
  };

  const showActionColumn = hasEditedRow;

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
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainGiven)} G
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                value={
                  item.chainReceivedRaw !== undefined
                    ? item.chainReceivedRaw
                    : item.chainReceived === 0
                      ? ''
                      : item.chainReceived
                }
                {...getScaleProps(index, 'chainReceived')}
                onChange={(e) =>
                  handleInlineChange(index, 'chainReceived', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainReceived)} G
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
            <div className="relative inline-block">
              <input
                type="text"
                value={
                  item.scrapRaw !== undefined
                    ? item.scrapRaw
                    : item.scrap === 0
                      ? ''
                      : item.scrap
                }
                {...getScaleProps(index, 'scrap')}
                onChange={(e) =>
                  handleInlineChange(index, 'scrap', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)} G
          </span>
        );
      },
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.loss)} G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                value={
                  item.purityRaw !== undefined
                    ? item.purityRaw
                    : item.purity === 0
                      ? ''
                      : item.purity
                }
                onChange={(e) =>
                  handleInlineChange(index, 'purity', e.target.value)
                }
                placeholder="e.g., 98"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                %
              </span>
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)} %
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
              if (item.isSaved) {
                return null;
              }

              return (
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSaveClick(index, 'stock')}
                    disabled={
                      isLoading ||
                      submitCutting.isPending ||
                      submitMoveKunda.isPending
                    }
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    title="Save to Stock"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveClick(index, 'kunda')}
                    disabled={
                      isLoading ||
                      submitCutting.isPending ||
                      submitMoveKunda.isPending
                    }
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    title="Move to S Kunda"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>S / Kunda</span>
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
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white sm:text-base md:text-lg">
              {showHistory ? 'Cutting History' : 'Cutting Department'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
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
                onClick={handlePrintHistory}
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
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    Chain Given
                  </span>
                  <span className="text-lg font-bold text-black dark:text-amber-400">
                    {formatNumberDisplay(historyTotals.totalGiven)} G
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    Chain Received
                  </span>
                  <span className="text-lg font-bold text-black dark:text-blue-400">
                    {formatNumberDisplay(historyTotals.totalReceived)} G
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    Scrap
                  </span>
                  <span className="text-lg font-bold text-black dark:text-green-400">
                    {formatNumberDisplay(historyTotals.totalScrap)} G
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    Loss
                  </span>
                  <span className="text-lg font-bold text-black dark:text-red-400">
                    {formatNumberDisplay(historyTotals.totalLoss)} G
                  </span>
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
                : 'No history records found. Complete a cutting process to see history.'
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
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                  <Save className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Action
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this cutting entry and send it to{' '}
                <strong>{actionType === 'stock' ? 'Stock' : 'S Kunda'}</strong>?
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
