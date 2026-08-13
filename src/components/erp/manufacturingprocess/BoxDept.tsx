import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, History, ChevronRight, ChevronDown, Printer, Calendar } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetBox, useGetBoxHistory, useSubmitBox } from '@/lib/api/box';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';

interface BoxEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: any;
  size: any;
  tarWeight: number;
  chainWeight: number;
  scrap: number;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainWeightRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

// Helper functions for safely extracting values
const getItemName = (item: any): string => {
  if (!item) return '-';
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item.name) return String(item.name);
  return '-';
};

const getSizeName = (size: any): string => {
  if (!size) return '-';
  if (typeof size === 'string') return size;
  if (typeof size === 'object' && size.size !== undefined) return String(size.size);
  return '-';
};

const BoxDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [boxEntries, setBoxEntries] = useState<BoxEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fromDate, setFromDate] = useState<Date[]>([]);
  const [toDate, setToDate] = useState<Date[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'weekly' | 'custom'>('all');
  const isInitialMount = useRef(true);

  // Fetch data from API
  const { data: boxData = [], isLoading: boxLoading, refetch } = useGetBox();
  const { data: boxHistory = [], isLoading: historyLoading, refetch: refetchHistory } = useGetBoxHistory();
  const submitBox = useSubmitBox();

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

  // Helper function to convert to number safely
  const toNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  // Helper function for 3 decimal formatted numbers (NO trailing zeroes)
  const formatNumberDisplay = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    const str = num.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  // Load data from API
  useEffect(() => {
    if (boxLoading) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (boxData.length > 0) {
      const entries: BoxEntry[] = boxData.map((box: any, index: number) => {
        const itemName = box.item?.name || box.itemId || 'N/A';
        const sizeName = box.size?.size || box.sizeId || 'N/A';

        const chainWeight = box.chainWeight || 0;
        const tarWeight = box.tarWeight || 0;
        const loss = tarWeight - chainWeight;

        const isSaved =
          box.isCompleted === true &&
          box.chainWeight !== null &&
          box.chainWeight !== undefined &&
          box.scrap !== null &&
          box.scrap !== undefined;

        const dateTime = new Date(box.createdAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        return {
          id: box.id,
          srNo: index + 1,
          dateTime: dateTime,
          item: itemName,
          size: sizeName,
          tarWeight: tarWeight,
          chainWeight: chainWeight,
          scrap: box.scrap || 0,
          loss: loss,
          isEditing: !isSaved,
          isSaved: isSaved,
          chainWeightRaw: box.chainWeight ? box.chainWeight.toString() : '',
          scrapRaw: box.scrap ? box.scrap.toString() : '',
          itemId: box.itemId,
          sizeId: box.sizeId,
          isCompleted: box.isCompleted || false,
        };
      });
      setBoxEntries(entries);
    } else {
      setBoxEntries([]);
    }
  }, [boxData, boxLoading]);

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

  // Format number helper for history
  const formatNumber = (value: any) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toFixed(0);
  };

  // Filter history by selected From-To date range.
  const getFilteredHistory = () => {
    let filtered = boxHistory;

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
    (acc: { totalTar: number; totalChain: number; totalScrap: number; totalLoss: number }, item: any) => ({
      totalTar: acc.totalTar + toNumber(item?.tarWeight),
      totalChain: acc.totalChain + toNumber(item?.chainWeight),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss: acc.totalLoss + toNumber(item?.loss ?? ((item?.tarWeight || 0) - (item?.chainWeight || 0))),
    }),
    { totalTar: 0, totalChain: 0, totalScrap: 0, totalLoss: 0 }
  );

  // Print History Function
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
            <td style="border:1px solid #861818ff;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${index + 1}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
              ${date} ${time}
            </td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getItemName(item?.item)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getSizeName(item?.size)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.tarWeight)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.chainWeight)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(
          item?.loss ?? ((item?.tarWeight || 0) - (item?.chainWeight || 0))
        )}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
              ${proceedDate} ${proceedTime}
            </td>
          </tr>
        `;
      })
      .join('');

    // Calculate totals
    const totalTar = filteredData.reduce((sum: number, item: any) => sum + (item?.tarWeight || 0), 0);
    const totalChain = filteredData.reduce((sum: number, item: any) => sum + (item?.chainWeight || 0), 0);
    const totalScrap = filteredData.reduce((sum: number, item: any) => sum + (item?.scrap || 0), 0);
    const totalLoss = filteredData.reduce((sum: number, item: any) => sum + (item?.loss ?? ((item?.tarWeight || 0) - (item?.chainWeight || 0))), 0);

    const headerInfo = getpdfheaderdata?.data?.data || (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
    const leftInvocation = headerInfo.leftInvocation || headerInfo.leftInovation || '॥ श्री गणेश प्रसन्न ॥';
    const rightInvocation = headerInfo.rightInvocation || headerInfo.rightInovation || '॥ श्री साई प्रसन्न ॥';
    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
    const description = headerInfo.description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
    const invocationColor = headerInfo.invocationColor || '#a84b20';
    const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
    const descriptionColor = headerInfo.descriptionColor || '#8b451f';
    const proprietorColor = headerInfo.proprietorColor || '#a84b20';
    const phoneColor = headerInfo.phoneColor || '#a84b20';
    const factoryFontSize = headerInfo.factoryFontSize ? `${headerInfo.factoryFontSize}px` : '20px';
    const descriptionFontSize = headerInfo.descriptionFontSize ? `${headerInfo.descriptionFontSize}px` : '9px';
    const proprietorFontSize = headerInfo.proprietorFontSize ? `${headerInfo.proprietorFontSize}px` : '9px';
    const phoneFontSize = headerInfo.phoneFontSize ? `${headerInfo.phoneFontSize}px` : '9px';

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
    Box History Report
  </h2>
  ${fromDate.length > 0 && toDate.length > 0 ? `
    <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
      From: ${new Date(fromDate[0]).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(toDate[0]).toLocaleDateString('en-IN')}
    </div>
  ` : `
    <div style="flex:1;"></div>
  `}
</div>

        <!-- Table -->
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Item</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Size</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Tar</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Wt</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Scrap</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Loss</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Proceed</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
      
        </table>

        <!-- Totals Row -->
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin:4px 0 0 0;padding:0;">
         
        </table>

        <!-- Footer -->
    
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
        #print-container tfoot tr {
          background: #f0f0f0 !important;
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
        const { date, time } = formatDate(item?.createdAt);
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
          {item?.item?.name}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item?.size?.size}
        </span>
      ),
    },
    {
      key: 'tarWeight',
      header: 'Tar (तार)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item?.tarWeight)} G
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Weight (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item?.chainWeight)} G
        </span>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item?.scrap)} G
        </span>
      ),
    },
    {
      key: 'loss',
      header: 'Loss',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item?.loss)} G
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item?.updatedAt);
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
  const handleInlineChange = useCallback(
    (index: number, field: 'chainWeight' | 'scrap', value: string) => {
      setBoxEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };

            if (field === 'chainWeight') {
              updated.chainWeightRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.chainWeight = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainWeight = isNaN(numValue) ? 0 : numValue;
              }
              updated.loss = Math.max(0, entry.tarWeight - updated.chainWeight);
            } else if (field === 'scrap') {
              updated.scrapRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.scrap = 0;
              } else {
                const numValue = parseFloat(value);
                updated.scrap = isNaN(numValue) ? 0 : numValue;
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
    (index: number) => {
      const entry = boxEntries[index];

      if (!entry.chainWeight || entry.chainWeight < 0) {
        toast.error('Please enter a valid chain weight');
        return;
      }

      if (!entry.scrap || entry.scrap < 0) {
        toast.error('Please enter a valid scrap weight');
        return;
      }

      if (entry.loss < 0) {
        toast.error(
          'Loss Weight cannot be negative. Chain weight must be less than or equal to Tar Weight.',
        );
        return;
      }

      setSaveIndex(index);
      setShowConfirmModal(true);
    },
    [boxEntries],
  );

  // Confirm and save
  const confirmSave = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = boxEntries[index];

    setIsLoading(true);

    try {
      await submitBox.mutateAsync({
        id: entry.id,
        data: {
          chainWeight: entry.chainWeight,
          scrap: entry.scrap,
          loss: entry.loss,
          isCompleted: true,
        },
      });

      setBoxEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: { selectedTab: 'soldering' },
      });
    } catch (error) {
      console.error('Error saving box:', error);
      toast.error('Failed to save box entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, boxEntries, submitBox, navigate, refetch]);

  // Check if all entries are saved
  const allSaved = boxEntries.every((entry) => entry.isSaved);

  // Check if any editable field has values
  const hasEditableValues = (entry: BoxEntry): boolean => {
    return Boolean(
      entry.chainWeightRaw?.trim() ||
      entry.scrapRaw?.trim()
    );
  };

  // Action column is shown only when at least one unsaved row is edited.
  const showActionColumn = boxEntries.some(
    (entry) => !entry.isSaved && hasEditableValues(entry)
  );

  const isSubmitting = submitBox.isPending;

  // Main table columns
  const columns: Column<BoxEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(', ') : ['', ''];
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {parts[0] || ''}
            </span>
            <span className="text-sm text-[#4f4535] dark:text-slate-400">
              {parts.slice(1).join(', ') || ''}
            </span>
          </div>
        );
      },
    },
    {
      key: 'itemName',
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
      key: 'sizeName',
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
      key: 'tarWeight',
      header: 'Tar(तार)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.tarWeight)} G
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Weight(G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                inputMode="decimal"
                value={
                  item.chainWeightRaw !== undefined
                    ? item.chainWeightRaw
                    : item.chainWeight === 0
                      ? ''
                      : item.chainWeight
                }
                onChange={(e) =>
                  handleInlineChange(index, 'chainWeight', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-slate-500">
                G
              </span>
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainWeight)} G
          </span> 
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
            <input
              type="text"
              inputMode="decimal"
              value={
                item.scrapRaw !== undefined
                  ? item.scrapRaw
                  : item.scrap === 0
                    ? ''
                    : item.scrap
              }
              onChange={(e) =>
                handleInlineChange(index, 'scrap', e.target.value)
              }
              placeholder="0.000"
              className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
             <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-slate-500">
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
      header: 'Loss',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.loss)} G
        </span>
      ),
    },

    // IMPORTANT:
    // This entire column is added only after the user edits a row.
    ...(showActionColumn
      ? [
        {
          key: 'actions',
          header: 'Action',
          render: (item: BoxEntry, index: number) => {
            if (item.isSaved || !hasEditableValues(item)) {
              return null;
            }

            return (
              <button
                type="button"
                onClick={() => handleSaveClick(index)}
                disabled={isLoading || isSubmitting}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                title="Save Entry"
              >
                <Save className="h-3 w-3" />
                <span>Soldering</span>
              </button>
            );
          },
        } as Column<BoxEntry>,
      ]
      : []),
  ];

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  // Reset date range to current week
  const resetDateRange = () => {
    const { monday, sunday } = getDefaultWeekRange();
    setDateRange([monday, sunday]);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white sm:text-base md:text-lg">
              {showHistory ? 'Box History' : 'Box Department'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Date Filters - Only show when viewing history */}
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
                      setDateRange(prev => [from, prev[1] || from]);
                    } else {
                      setDateRange(prev => [undefined as any, prev[1]]);
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
                      setDateRange(prev => [prev[0] || to, to]);
                    } else {
                      setDateRange(prev => [prev[0], undefined as any]);
                    }
                  }}
                  className="w-32 sm:w-36 md:w-40"
                />
              </div>
            )}

            {/* PRINT HISTORY */}
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

            {/* HISTORY / SHOW BOX */}
            <GenericButton
              type="button"
              onClick={toggleHistory}
              className={`flex items-center gap-1.5 whitespace-nowrap !px-3 !py-1.5 !text-xs !text-white sm:!px-4 sm:!py-2 sm:!text-sm ${showHistory
                ? '!bg-amber-600 hover:!bg-amber-700'
                : '!bg-blue-600 hover:!bg-blue-700'
                }`}
            >
              {showHistory ? (
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}

              <span>{showHistory ? 'Show Box' : 'History'}</span>
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Box Table OR History Table */}
      {!showHistory ? (
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable<BoxEntry>
            data={boxEntries}
            columns={columns}
            emptyMessage="No box entries found."
            isLoading={boxLoading || isSubmitting}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        <div className="px-3 py-4 sm:px-4 md:px-6">
          {/* History Summary Cards */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Tar
                </span>
                <span className="text-lg font-bold text-black dark:text-amber-400">
                  {formatNumberDisplay(historyTotals.totalTar)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Chain Weight
                </span>
                <span className="text-lg font-bold text-black dark:text-blue-400">
                  {formatNumberDisplay(historyTotals.totalChain)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Scrap
                </span>
                <span className="text-lg font-bold text-black dark:text-green-400">
                  {formatNumberDisplay(historyTotals.totalScrap)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Loss
                </span>
                <span className="text-lg font-bold text-black dark:text-red-400">
                  {formatNumberDisplay(historyTotals.totalLoss)} G
                </span>
              </div>
            </div>
          </div>

          <GenericTable
            data={getFilteredHistory()}
            columns={historyColumns}
            emptyMessage={
              dateRange.length === 2
                ? `No history records found for the selected date range (${new Date(dateRange[0]).toLocaleDateString('en-IN')} to ${new Date(dateRange[1]).toLocaleDateString('en-IN')})`
                : "No history records found. Complete a box process to see history."
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
                Confirm Save
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this box entry? This will move to
                the{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  Soldering Department
                </strong>
                .
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
    </div>
  );
};

export default BoxDept;