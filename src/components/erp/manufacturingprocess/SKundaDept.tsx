import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  Square,
  Save,
  ChevronRight,
  ChevronDown,
  Printer,
  ArrowLeft,
  Scale,
  DollarSign,
  ArrowDownToLine,
  Clock,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {
  useGetKunda,
  useGetKundaHistory,
  useSubmitKunda,
} from '@/lib/api/cutting';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {useGetHeader} from '@/lib/api/headerapi';

interface KundaEntry {
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
  chainReceivedRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
  isDirty?: boolean;
}

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

const SKundaDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [kundaEntries, setKundaEntries] = useState<KundaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const getDefaultWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
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
          const chainReceived = kunda.chainReceived || 0;
          const scrap = kunda.scrap || 0;
          const loss = Math.max(0, chainGiven - (chainReceived + scrap));

          const isSaved = kunda.isCompleted === true;

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
            chainReceived: chainReceived,
            scrap: scrap,
            loss: loss,
            isEditing: !isSaved,
            isSaved: isSaved,
            chainReceivedRaw: kunda.chainReceived
              ? kunda.chainReceived.toString()
              : '',
            scrapRaw: kunda.scrap ? kunda.scrap.toString() : '',
            purityRaw: kunda.purity ? kunda.purity.toString() : '',
            itemId: kunda.itemId,
            sizeId: kunda.sizeId,
            isCompleted: kunda.isCompleted || false,
            isDirty: false,
          };
        },
      );
      setKundaEntries(entries);
    } else {
      setKundaEntries([]);
    }
  }, [kundaData, kundaLoading, error]);

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

  const formatNumberDisplay = (value: unknown): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
      useGrouping: true,
    }).format(toNumber(value));
  };

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

  // ======================================================
  // PRINT FUNCTION - Full A4 with Date Range
  // ======================================================

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
    printContainer.id = 'print-container-history';
    printContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 210mm;
      background: white;
      padding: 0;
      z-index: 9999;
    `;
    document.body.appendChild(printContainer);

    // Build the table rows
    const rows = filteredData
      .map((item: any, index: number) => {
        const {date, time} = formatDate(item?.createdAt);
        const {date: proceedDate, time: proceedTime} = formatDate(
          item?.updatedAt,
        );

        return `
          <tr>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${index + 1}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:7.5px;color:#000;white-space:nowrap;">
              ${date} ${time}
            </td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${getItemName(item?.item)}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${getSizeName(item?.size)}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.chainWeight)}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.chainReceived)}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.loss)}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.purity)}%</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:7.5px;color:#000;white-space:nowrap;">
              ${proceedDate} ${proceedTime}
            </td>
          </tr>
        `;
      })
      .join('');

    // Format date for display
    const formatDateForDisplay = (date: Date | null) => {
      if (!date) return '';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

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

    // Set the content with PDF Header - Full A4
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

          <!-- Title and Date Range in one line -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
            <div style="flex:1;"></div>
            <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
              S Kunda History Report
            </h2>
            <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
              From: ${formatDateForDisplay(dateRange[0]) || 'Start'} 
              &nbsp;&nbsp; To: ${formatDateForDisplay(dateRange[1]) || 'End'}
            </div>
          </div>

          <!-- Table -->
          <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;">
            <thead>
              <tr style="background:#785600;color:white;font-weight:600;">
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Sr</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Date & Time</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Item</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Size</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Chain Given</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Chain Received</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Scrap</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Loss</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Purity</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Proceed Date</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        
      </div>
    `;

    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A4 portrait;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          width: 210mm;
          height: 297mm;
        }
        body * {
          visibility: hidden;
        }
        #print-container-history, #print-container-history * {
          visibility: visible;
        }
        #print-container-history {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: hidden !important;
          z-index: 9999 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-container-history > div {
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 6mm 5mm !important;
          box-sizing: border-box !important;
        }
        #print-container-history table {
          width: 100% !important;
        }
        #print-container-history tr {
          page-break-inside: avoid !important;
        }
        #print-container-history thead tr {
          background: #785600 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-container-history thead tr th {
          background: #785600 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-container-history tfoot tr {
          background: #f4f4f2 !important;
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

  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'chainReceived' | 'scrap' | 'purity',
      value: string,
    ) => {
      setKundaEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = {...entry};

            if (field === 'chainReceived') {
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

            updated.loss = Math.max(
              0,
              updated.chainGiven - (updated.chainReceived + updated.scrap),
            );
            // Show Action column only after the user actually changes an input field.
            updated.isDirty = true;
            return updated;
          }
          return entry;
        }),
      );
    },
    [],
  );

  const handleStopClick = useCallback(
    (index: number) => {
      const entry = kundaEntries[index];

      if (!entry.chainReceived || entry.chainReceived < 0) {
        toast.error('Please enter a valid chain received weight');
        return;
      }

      if (!entry.scrap || entry.scrap < 0) {
        toast.error('Please enter a valid scrap weight');
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

  const confirmStop = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = kundaEntries[index];

    setIsLoading(true);

    try {
      await submitKunda.mutateAsync({
        id: entry.id,
        data: {
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
      // toast.success('S Kunda process stopped successfully!');
      navigate({
        to: '/Stocks/stockpage',
      });
    } catch (error) {
      console.error('Error stopping S Kunda process:', error);
      toast.error('Failed to stop S Kunda process');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, kundaEntries, submitKunda, refetch]);

  // Action column is hidden initially.
  // It appears only after the user changes one of the input fields.
  const showActionColumn = kundaEntries.some(
    (entry) => entry.isDirty === true && entry.isSaved !== true,
  );

  const columns: Column<KundaEntry>[] = [
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
            {formatNumberDisplay(item.purity)}%
          </span>
        );
      },
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

    ...(showActionColumn
      ? [
          {
            key: 'actions',
            header: 'Action',
            render: (item: KundaEntry, index: number) => {
              // Only show the action button after the user has changed an input.
              if (!item.isDirty || item.isSaved || !item.isEditing) return null;

              return (
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleStopClick(index)}
                    disabled={isLoading || submitKunda.isPending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#5d4200] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    title="Stop Process"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              );
            },
          } as Column<KundaEntry>,
        ]
      : []),
  ];

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
      key: 'purity',
      header: 'Purity (%)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'chainGiven',
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

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white sm:text-base md:text-lg">
              {showHistory ? 'S Kunda History' : 'S Kunda Department'}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {showHistory && (
              <>
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

                <GenericButton
                  type="button"
                  onClick={handlePrintHistory}
                  className="flex items-center gap-1.5 whitespace-nowrap !bg-green-600 !px-3 !py-1.5 !text-xs !text-white hover:!bg-green-700 sm:!px-4 sm:!py-2 sm:!text-sm"
                >
                  <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Print</span>
                </GenericButton>
              </>
            )}

            <GenericButton
              type="button"
              onClick={toggleHistory}
              className={`flex items-center gap-1.5 whitespace-nowrap !px-3 !py-1.5 !text-xs !text-white sm:!px-4 sm:!py-2 sm:!text-sm ${
                showHistory
                  ? '!bg-amber-600 hover:!bg-amber-700'
                  : '!bg-blue-600 hover:!bg-blue-700'
              }`}
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
            />
          </div>
        ) : (
          <div>
            {/* Summary Cards - History Totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Chain Given */}
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

              {/* Chain Received */}
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

              {/* Scrap */}
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

              {/* Loss */}
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
                  : 'No history records found.'
              }
              isLoading={historyLoading}
              showSrNo={true}
              srNoLabel="Sr No."
              className="shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Confirm Stop Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-3 dark:border-amber-700/30 dark:bg-amber-900/30">
                  <Square className="h-6 w-6 fill-current text-[#785600] dark:text-amber-400" />
                </div>
              </div>
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Stop Process
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to stop the S Kunda process for this
                entry?
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
                  onClick={confirmStop}
                  disabled={isLoading}
                  className="rounded-lg bg-[#785600] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#5d4200] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Stopping...' : 'Confirm Stop'}
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
