import React, { useState, useEffect } from 'react';
import {
  Plus,
  Save,
  X,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Printer,
  Trash2,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { Column, GenericTable } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetItems, Item } from '@/lib/api/items';
import { useGetSizes, Size } from '@/lib/api/sizes';
import {
  useTar,
  useCreateTar,
  useSaveTar,
  Tar,
  useGetTarHistory,
} from '@/lib/api/tar';
import { useGetStock } from '@/lib/api/stock';
import GenericDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';

interface TarEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  fine: number;
  tar: number;
  scrap: number;
  loss: number;
  purity: number;
  grosswt: number;
  isSaved: boolean;
  tarRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  grosswtRaw?: string;
  itemId?: string;
  sizeId?: string;
}

interface TarCardForm {
  id: string;
  itemId: string;
  sizeId: string;
  grossWt: string;
  purity: string;
  fine: string;
  isSaving?: boolean;
}

const createNewCard = (initial?: Partial<TarCardForm>): TarCardForm => ({
  id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  itemId: initial?.itemId || '',
  sizeId: initial?.sizeId || '',
  grossWt: initial?.grossWt || '',
  purity: initial?.purity || '',
  fine: initial?.fine || '',
});

interface AddTarProps {
  showBack?: boolean;
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

const AddTar: React.FC<AddTarProps> = ({ showBack = false }) => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [tarEntries, setTarEntries] = useState<TarEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTarCompleted, setIsTarCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');

  // Default date range: Monday to Sunday of current week
  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return [monday, sunday];
  });

  const [modalCards, setModalCards] = useState<TarCardForm[]>([
    createNewCard(),
  ]);

  // Date and Time state for modal
  const [selectedDate, setSelectedDate] = useState({
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    hour: new Date().getHours(),
    minute: new Date().getMinutes(),
  });

  // Fetch items and sizes from API
  const { data: items = [], isLoading: itemsLoading } = useGetItems();
  const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();

  // Fetch existing tar data
  const { data: tarData = [], isLoading: tarLoading, refetch } = useTar();
  const {
    data: tarHistory = [],
    isLoading: tarHistoryLoading,
    refetch: refetchHistory,
  } = useGetTarHistory();

  // Mutation hooks
  const createTar = useCreateTar();
  const saveTar = useSaveTar();

  // Fetch stock data
  const { data: stockData = [] } = useGetStock();

  // Helper to get total gold available
  const getGoldAvailableWeight = (): number => {
    if (!stockData || !Array.isArray(stockData)) return 0;
    return stockData
      .filter((s: any) => {
        const item = items.find((i) => i.id === s.itemId);
        const itemName = item?.name?.trim().toLowerCase() || '';
        return itemName === 'gold' || itemName.includes('gold') || !s.sizeId;
      })
      .reduce((sum: number, s: any) => {
        const wt = Number(s.weight ?? s.grams ?? s.stockQty ?? 0);
        return sum + (isNaN(wt) ? 0 : wt);
      }, 0);
  };

  // Helper to get stock quantity for a card's item, size, and purity
  const getItemStockWeight = (
    itemId: string,
    sizeId?: string,
    purity?: string,
  ): number => {
    if (!itemId || !stockData || !Array.isArray(stockData)) return 0;

    let matching = stockData.filter((s: any) => s.itemId === itemId);
    if (matching.length === 0) return 0;

    if (sizeId) {
      const sizeMatched = matching.filter((s: any) => s.sizeId === sizeId);
      if (sizeMatched.length > 0) {
        matching = sizeMatched;
      }
    }

    if (purity && parseFloat(purity) > 0) {
      const purityNum = parseFloat(purity);
      const purityMatched = matching.filter(
        (s: any) => Number(s.purity) === purityNum,
      );
      if (purityMatched.length > 0) {
        matching = purityMatched;
      }
    }

    return matching.reduce((sum: number, s: any) => {
      const wt = Number(s.weight ?? s.grams ?? s.stockQty ?? 0);
      return sum + (isNaN(wt) ? 0 : wt);
    }, 0);
  };

  // Scale hooks for modal and table
  const { getScaleProps: getModalScaleProps } = useTableScaleFocus<
    'grossWt' | 'fine'
  >((cardIndex, field, weight) => {
    handleCardChange(cardIndex, field, weight.toString());
  });

  const { getScaleProps } = useTableScaleFocus<'tar' | 'scrap'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

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
  const formatNumber = (value: unknown): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
      useGrouping: true,
    }).format(toNumber(value));
  };

  const formatNumberDisplay = (value: unknown): string => {
    return formatNumber(value);
  };

  // Filter history by selected date range
  const getFilteredHistory = () => {
    let filtered = tarHistory;

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
        totalFine: number;
        totalTar: number;
        totalScrap: number;
        totalLoss: number;
        totalEntries: number;
      },
      item: any,
    ) => ({
      totalFine: acc.totalFine + toNumber(item?.fine),
      totalTar: acc.totalTar + toNumber(item?.tar),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss: acc.totalLoss + toNumber(item?.loss ?? item?.lossWeight),
      totalEntries: acc.totalEntries + 1,
    }),
    {
      totalFine: 0,
      totalTar: 0,
      totalScrap: 0,
      totalLoss: 0,
      totalEntries: 0,
    },
  );

  // Print History Function - Minimal Padding
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
        const { date, time } = formatDate(item?.createdAt);
        const { date: proceedDate, time: proceedTime } = formatDate(
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
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.fine)}</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.purity)}%</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.tar)}</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.scrap)}</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item?.loss)}</td>
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
    Tar History Report
  </h2>
  ${dateRange.length === 2
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
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Fine</th>
                             <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Purity %</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Tar</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Scrap</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Loss</th>
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
      key: 'fine',
      header: 'Fine (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.fine)} G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.purity)}%
        </span>
      ),
    },
    {
      key: 'tar',
      header: 'Tar (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.tar)} G
        </span>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.scrap)} G
        </span>
      ),
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.loss)} G
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

  // Initialize with existing tar data
  useEffect(() => {
    if (!tarLoading && items.length > 0 && sizes.length > 0) {
      if (tarData.length > 0) {
        const entries: TarEntry[] = tarData.map((tar, index: any) => {
          let sizeValue = tar.size;
          if (typeof tar.size === 'object' && tar.size !== null) {
            sizeValue =
              tar.size.size || tar.size.name || JSON.stringify(tar.size);
          }

          let itemValue = tar.item;
          if (typeof tar.item === 'object' && tar.item !== null) {
            itemValue =
              tar.item.name || tar.item.item || JSON.stringify(tar.item);
          }

          if (tar.isSaved) {
            setIsTarCompleted(true);
          }
          const formattedDateTime = tar.createdAt
            ? formatDateTime(new Date(tar.createdAt))
            : '-';

          return {
            id: tar.id,
            srNo: index + 1,
            dateTime: formattedDateTime,
            item: itemValue,
            size: sizeValue,
            fine: toNumber(tar.fine),
            tar: toNumber(tar.tar),
            scrap: toNumber(tar.scrap),
            loss: toNumber(tar.loss ?? tar.lossWeight),
            purity: toNumber(tar.purity),
            grosswt: toNumber(tar.grosswt ?? tar.grossWt),
            isSaved: tar.isSaved || false,
            tarRaw: toNumber(tar.tar) > 0 ? String(tar.tar) : '',
            scrapRaw: toNumber(tar.scrap) > 0 ? String(tar.scrap) : '',
            purityRaw: toNumber(tar.purity) > 0 ? String(tar.purity) : '',
            grosswtRaw:
              toNumber(tar.grosswt ?? tar.grossWt) > 0
                ? String(tar.grosswt ?? tar.grossWt)
                : '',
            itemId: tar.itemId || '',
            sizeId: tar.sizeId || '',
          };
        });
        setTarEntries(entries);
      } else {
        setTarEntries([]);
      }
    }
  }, [tarData, items, sizes, tarLoading]);

  // Check if Tar is completed when entries change
  useEffect(() => {
    const hasSaved = tarEntries.some((entry) => entry.isSaved === true);
    if (hasSaved) {
      setIsTarCompleted(true);
    }
  }, [tarEntries]);

  // Format date time helper
  const formatDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  // Auto-fill from Billing when navigated via Manufacturing action
  useEffect(() => {
    if (
      itemsLoading ||
      sizesLoading ||
      items.length === 0 ||
      sizes.length === 0
    ) {
      return;
    }

    try {
      const prefillRaw = sessionStorage.getItem(
        'manufacturing_billing_prefill',
      );
      if (prefillRaw) {
        sessionStorage.removeItem('manufacturing_billing_prefill');
        const parsed = JSON.parse(prefillRaw);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        if (list.length > 0) {
          const generatedCards: TarCardForm[] = list.map((prefill, idx) => {
            let resolvedItemId = prefill.itemId || '';
            if (!resolvedItemId && prefill.itemName) {
              const foundItem = items.find(
                (i) => i.name?.toLowerCase() === prefill.itemName.toLowerCase(),
              );
              if (foundItem) resolvedItemId = foundItem.id;
            }

            let resolvedSizeId = prefill.sizeId || '';
            if (!resolvedSizeId && prefill.sizeName) {
              const foundSize = sizes.find(
                (s) => s.size?.toLowerCase() === prefill.sizeName.toLowerCase(),
              );
              if (foundSize) resolvedSizeId = foundSize.id;
            }

            const grossNum = parseFloat(prefill.grossWt) || 0;
            const purityNum = parseFloat(prefill.purity) || 0;
            let calculatedFine = '';
            if (grossNum > 0 && purityNum > 0) {
              calculatedFine = (
                Math.round(((grossNum * purityNum) / 100) * 1000) / 1000
              ).toString();
            } else if (prefill.fine) {
              calculatedFine = String(prefill.fine);
            }

            return {
              id: `card-${Date.now()}-${idx}`,
              itemId: resolvedItemId,
              sizeId: resolvedSizeId,
              grossWt:
                prefill.grossWt !== undefined && prefill.grossWt !== null
                  ? String(prefill.grossWt)
                  : '',
              purity:
                prefill.purity !== undefined && prefill.purity !== null
                  ? String(prefill.purity)
                  : '',
              fine: calculatedFine,
            };
          });

          setModalCards(generatedCards);

          const now = new Date();
          setSelectedDate({
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            hour: now.getHours(),
            minute: now.getMinutes(),
          });

          setIsModalOpen(true);
        }
      }
    } catch (e) {
      console.error('Error loading manufacturing prefill data:', e);
    }
  }, [items, sizes, itemsLoading, sizesLoading]);

  const handleCardChange = (
    cardIndex: number,
    field: 'itemId' | 'sizeId' | 'grossWt' | 'purity' | 'fine',
    value: string,
  ) => {
    setModalCards((prev) =>
      prev.map((card, idx) => {
        if (idx !== cardIndex) return card;

        if (field === 'grossWt' || field === 'purity') {
          const sanitized = value.replace(/[^0-9.]/g, '');
          const nextCard = { ...card, [field]: sanitized };
          const grossNum = parseFloat(
            field === 'grossWt' ? sanitized : card.grossWt,
          );
          const purityNum = parseFloat(
            field === 'purity' ? sanitized : card.purity,
          );
          if (
            !isNaN(grossNum) &&
            !isNaN(purityNum) &&
            grossNum > 0 &&
            purityNum > 0
          ) {
            const autoFine =
              Math.round(((grossNum * purityNum) / 100) * 1000) / 1000;
            nextCard.fine = autoFine.toString();
          }
          return nextCard;
        } else if (field === 'fine') {
          const sanitized = value.replace(/[^0-9.]/g, '');
          return { ...card, fine: sanitized };
        } else {
          return { ...card, [field]: value };
        }
      }),
    );
  };

  const handleAddCard = () => {
    setModalCards((prev) => [...prev, createNewCard()]);
  };

  const handleRemoveCard = (cardIndex: number) => {
    setModalCards((prev) => {
      const next = prev.filter((_, idx) => idx !== cardIndex);
      if (next.length === 0) {
        setIsModalOpen(false);
        return [createNewCard()];
      }
      return next;
    });
  };

  const handleOpenModal = () => {
    if (isTarCompleted) {
      toast.error(
        'Tar process is already completed. You cannot add more entries.',
      );
      return;
    }
    const now = new Date();
    setSelectedDate({
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      hour: now.getHours(),
      minute: now.getMinutes(),
    });
    setModalCards([createNewCard()]);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (cardIndex: number) => {
    const card = modalCards[cardIndex];
    if (!card) return;

    if (!card.itemId) {
      toast.error(`Please select an item for Process Item #${cardIndex + 1}`);
      return;
    }

    if (!card.sizeId) {
      toast.error(`Please select a size for Process Item #${cardIndex + 1}`);
      return;
    }

    const fineValue = parseFloat(card.fine) || 0;
    const grossWtValue = parseFloat(card.grossWt) || 0;
    const purityValue = parseFloat(card.purity) || 0;

    if (fineValue <= 0) {
      toast.error(
        `Please enter a valid fine weight for Process Item #${cardIndex + 1}`,
      );
      return;
    }

    setModalCards((prev) =>
      prev.map((c, idx) => (idx === cardIndex ? { ...c, isSaving: true } : c)),
    );

    try {
      const selectedItem = items.find((i) => i.id === card.itemId);
      const selectedSize = sizes.find((s) => s.id === card.sizeId);

      const { day, month, year, hour, minute } = selectedDate;
      const date = new Date(year, month - 1, day, hour, minute);
      const dateTimeStr = formatDateTime(date);
      const grossVal = grossWtValue > 0 ? grossWtValue : fineValue;

      const payload = {
        itemId: card.itemId,
        sizeId: card.sizeId,
        grosswt: grossVal,
        grossWt: grossVal,
        fine: fineValue,
        item: selectedItem?.name || '',
        size: selectedSize?.size || '',
        tar: 0,
        scrap: 0,
        loss: 0,
        purity: purityValue,
        isSaved: false,
        dateTime: dateTimeStr,
      };

      const result = await createTar.mutateAsync(payload);

      const newEntry: TarEntry = {
        id: result?.data?.id || Date.now().toString(),
        srNo: tarEntries.length + 1,
        dateTime: dateTimeStr,
        item: selectedItem?.name || '',
        size: selectedSize?.size || '',
        fine: fineValue,
        tar: 0,
        scrap: 0,
        loss: 0,
        purity: purityValue,
        grosswt: grossVal,
        isSaved: false,
        tarRaw: '',
        scrapRaw: '',
        purityRaw: purityValue > 0 ? String(purityValue) : '',
        grosswtRaw: grossVal > 0 ? String(grossVal) : '',
        itemId: card.itemId,
        sizeId: card.sizeId,
      };

      setTarEntries((prev) => [...prev, newEntry]);

      // Remove this card from modal, leaving any other cards untouched
      setModalCards((prev) => {
        const next = prev.filter((_, idx) => idx !== cardIndex);
        if (next.length === 0) {
          setIsModalOpen(false);
          return [createNewCard()];
        }
        return next;
      });

      await refetch();
    } catch (error: any) {
      console.error('Error saving tar:', error);

      // Show the exact backend error when stock is insufficient.
      const backendMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        '';

      if (
        typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('insufficient stock')
      ) {
        setStockErrorMessage(backendMessage);
        setShowStockErrorModal(true);
        setModalCards((prev) =>
          prev.map((c, idx) =>
            idx === cardIndex ? { ...c, isSaving: false } : c,
          ),
        );
        return;
      }

      toast.error(backendMessage || 'Failed to save tar entry');
      setModalCards((prev) =>
        prev.map((c, idx) =>
          idx === cardIndex ? { ...c, isSaving: false } : c,
        ),
      );
    }
  };

  const handleInlineChange = (
    index: number,
    field: 'tar' | 'scrap' | 'purity' | 'grosswt',
    value: string,
  ) => {
    setTarEntries((prev) =>
      prev.map((entry, i) => {
        if (i === index) {
          const updated = { ...entry };

          if (field === 'grosswt') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            updated.grosswtRaw = sanitized;
            if (sanitized === '' || sanitized === '.' || sanitized === '-') {
              updated.grosswt = 0;
            } else {
              const numValue = parseFloat(sanitized);
              updated.grosswt = isNaN(numValue) ? 0 : numValue;
            }
          } else if (field === 'tar') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            updated.tarRaw = sanitized;
            if (sanitized === '' || sanitized === '.' || sanitized === '-') {
              updated.tar = 0;
            } else {
              const numValue = parseFloat(sanitized);
              updated.tar = isNaN(numValue) ? 0 : numValue;
            }
            updated.loss = Math.max(
              0,
              toNumber(entry.fine) - toNumber(updated.tar),
            );
          } else if (field === 'scrap') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            updated.scrapRaw = sanitized;
            if (sanitized === '' || sanitized === '.' || sanitized === '-') {
              updated.scrap = 0;
            } else {
              const numValue = parseFloat(sanitized);
              updated.scrap = isNaN(numValue) ? 0 : numValue;
            }
          } else if (field === 'purity') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            updated.purityRaw = sanitized;
            if (sanitized === '' || sanitized === '.' || sanitized === '-') {
              updated.purity = 0;
            } else {
              const numValue = parseFloat(sanitized);
              updated.purity = isNaN(numValue) ? 0 : numValue;
            }
          }

          return updated;
        }
        return entry;
      }),
    );
  };

  const handleSaveClick = (index: number) => {
    const entry = tarEntries[index];

    if (!entry.tar || entry.tar < 0) {
      toast.error('Please enter a valid tar weight');
      return;
    }

    if (!entry.purity || entry.purity <= 0) {
      toast.error('Please enter purity (टंच)');
      return;
    }

    if (entry.loss < 0) {
      toast.error(
        'Loss cannot be negative. Tar must be less than or equal to Fine.',
      );
      return;
    }

    setSaveIndex(index);
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = tarEntries[index];

    setIsLoading(true);

    try {
      await saveTar.mutateAsync({
        id: entry.id,
        data: {
          id: entry.id,
          itemId: entry.itemId || '',
          sizeId: entry.sizeId || '',
          fine: Number(entry.fine),
          item: entry.item || '',
          size: entry.size || '',
          tar: Number(entry.tar),
          scrap: Number(entry.scrap),
          purity: Number(entry.purity),
          loss: Number(entry.loss),
          isSaved: true,
        },
      });

      setTarEntries((prev) =>
        prev.map((s, i) => (i === index ? { ...s, isSaved: true } : s)),
      );

      setIsTarCompleted(true);

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: { selectedTab: 'box' },
      });
    } catch (error: any) {
      console.error('Error saving tar:', error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        '';

      if (
        typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('insufficient stock')
      ) {
        setStockErrorMessage(backendMessage);
        setShowStockErrorModal(true);
        setIsLoading(false);
        setShowConfirmModal(false);
        setSaveIndex(null);
        return;
      }

      toast.error(backendMessage || 'Failed to save tar entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  };

  const resetForm = () => {
    setModalCards([createNewCard()]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // A row is edited only when the user has entered a value.
  const hasEditableValues = (entry: TarEntry): boolean => {
    return Boolean(
      entry.tarRaw?.trim() ||
      entry.scrapRaw?.trim() ||
      entry.purityRaw?.trim() ||
      entry.grosswtRaw?.trim(),
    );
  };

  // The whole Action column is conditional.
  // Therefore the "Action" header also disappears when no row is edited.
  const showActionColumn = tarEntries.some(
    (entry) => !entry.isSaved && hasEditableValues(entry),
  );

  const isSubmitting = createTar.isPending || saveTar.isPending;

  const columns: Column<TarEntry>[] = [
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
          {typeof item.item === 'string'
            ? item.item
            : JSON.stringify(item.item)}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {typeof item.size === 'string'
            ? item.size
            : JSON.stringify(item.size)}
        </span>
      ),
    },
    {
      key: 'fine',
      header: 'Fine (लगड)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.fine)} G
      sese  </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item, index) => {
        if (!item.isSaved) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                inputMode="decimal"
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
                placeholder="98"
                className="w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                %
              </span>
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)}
          </span>
        );
      },
    },
    {
      key: 'grosswt',
      header: 'GrossWt (G)',
      render: (item, index) => {
        if (!item.isSaved) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                inputMode="decimal"
                value={
                  item.grosswtRaw !== undefined
                    ? item.grosswtRaw
                    : item.grosswt === 0
                      ? ''
                      : item.grosswt
                }
                {...getScaleProps(index, 'grosswt')}
                onChange={(e) =>
                  handleInlineChange(index, 'grosswt', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.grosswt)}
          </span>
        );
      },
    },
    {
      key: 'tar',
      header: 'Tar (G)',
      render: (item, index) => {
        if (!item.isSaved) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                inputMode="decimal"
                value={
                  item.tarRaw !== undefined
                    ? item.tarRaw
                    : item.tar === 0
                      ? ''
                      : item.tar
                }
                {...getScaleProps(index, 'tar')}
                onChange={(e) =>
                  handleInlineChange(index, 'tar', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.tar)} G
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item, index) => {
        if (!item.isSaved) {
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
                {...getScaleProps(index, 'scrap')}
                onChange={(e) =>
                  handleInlineChange(index, 'scrap', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
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
          render: (item: TarEntry, index: number) => {
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
                <span>Box</span>
              </button>
            );
          },
        } as Column<TarEntry>,
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


  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white sm:text-base md:text-lg">
              {showHistory ? 'Tar History' : 'Tar Management'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!showHistory && (
              <GenericButton
                type="button"
                onClick={handleOpenModal}
                disabled={isTarCompleted}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{isTarCompleted ? 'Completed' : 'Add Tar'}</span>
              </GenericButton>
            )}

            {showHistory && (
              <div className="flex flex-wrap items-center gap-2">
                {/* From Date - Defaults to Monday */}
                <div className="w-32 sm:w-36 md:w-40">
                  <GenericWeeklyDatePicker
                    id="from-date-tar"
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
                    className="w-full"
                  />
                </div>

                {/* To Date - Defaults to Sunday */}
                <div className="w-32 sm:w-36 md:w-40">
                  <GenericWeeklyDatePicker
                    id="to-date-tar"
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
                    className="w-full"
                  />
                </div>
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
              <span>{showHistory ? 'Show Tar' : 'History'}</span>
            </GenericButton>
          </div>
        </div>
      </div>

      {!showHistory ? (
        /* Tar Management Table */
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable<TarEntry>
            data={tarEntries}
            columns={columns}
            emptyMessage="No tar entries found. Click 'Add Tar' to create one."
            isLoading={
              tarLoading || itemsLoading || sizesLoading || isSubmitting
            }
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        /* History Section */
        <div className="px-3 py-4 sm:px-4 md:px-6">
          {/* History Summary Cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Fine
                </span>
                <span className="text-lg font-bold text-black dark:text-amber-400">
                  {formatNumberDisplay(historyTotals.totalFine)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Tar
                </span>
                <span className="text-lg font-bold text-black dark:text-blue-400">
                  {formatNumberDisplay(historyTotals.totalTar)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Scrap
                </span>
                <span className="text-lg font-bold text-black dark:text-green-400">
                  {formatNumberDisplay(historyTotals.totalScrap)} G
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Loss
                </span>
                <span className="text-lg font-bold text-black dark:text-red-400">
                  {formatNumberDisplay(historyTotals.totalLoss)} G
                </span>
              </div>
            </div>
          </div>

          {/* History Table */}
          <GenericTable
            data={getFilteredHistory()}
            columns={historyColumns}
            emptyMessage={
              dateRange.length === 2
                ? `No history records found for the selected date range (${new Date(dateRange[0]).toLocaleDateString('en-IN')} to ${new Date(dateRange[1]).toLocaleDateString('en-IN')})`
                : 'No history records found. Complete a tar process to see history.'
            }
            isLoading={tarHistoryLoading}
            showSrNo={true}
            srNoLabel="Sr No."
            className="shadow-sm"
          />
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <div
            className={`w-full ${modalCards.length > 1 ? 'max-w-4xl' : 'max-w-lg'
              } flex max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-[#d3c4af]/30 dark:border-slate-700`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                    Add Tar Process
                  </h3>
                  <p className="text-xs text-[#4f4535] dark:text-slate-400">
                    {modalCards.length}{' '}
                    {modalCards.length === 1 ? 'process item' : 'process items'}{' '}
                    to configure
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#785600]/30 bg-[#785600]/5 px-2.5 py-1.5 text-xs font-semibold text-[#785600] transition-colors hover:bg-[#785600]/15 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                  title="Add another process card"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Card</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Cards Container */}
            <div className="flex-1 overflow-y-auto p-4">
              <div
                className={`grid gap-4 ${modalCards.length > 1
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1'
                  }`}
              >
                {modalCards.map((card, idx) => {
                  const isCardSaving = card.isSaving || false;
                  return (
                    <div
                      key={card.id || idx}
                      className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      {/* Card Top / Header */}
                      <div className="mb-3 flex items-center justify-between border-b border-[#d3c4af]/20 pb-2.5 dark:border-slate-700">
                        <span className="flex items-center gap-1.5 rounded-md bg-[#785600]/10 px-2 py-0.5 text-xs font-bold text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
                          <Sparkles className="h-3 w-3" />
                          Process Item #{idx + 1}
                        </span>
                        {modalCards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(idx)}
                            disabled={isCardSaving}
                            className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                            title="Remove this card"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Card Inputs */}
                      <div className="space-y-3">
                        {/* Item */}
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Item <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={card.itemId}
                            onChange={(e) =>
                              handleCardChange(idx, 'itemId', e.target.value)
                            }
                            className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="">Select Item</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name || JSON.stringify(item)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Size */}
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Size <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={card.sizeId}
                            onChange={(e) =>
                              handleCardChange(idx, 'sizeId', e.target.value)
                            }
                            className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="">Select Size</option>
                            {sizes.map((size) => (
                              <option key={size.id} value={size.id}>
                                {size.size || JSON.stringify(size)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Gross Wt & Purity */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Gross Wt (G) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={card.grossWt}
                                {...getModalScaleProps(idx, 'grossWt')}
                                onChange={(e) =>
                                  handleCardChange(
                                    idx,
                                    'grossWt',
                                    e.target.value,
                                  )
                                }
                                placeholder="0.000"
                                className="font-mono w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 pr-7 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />
                              <span className="text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                                G
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Purity (%) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={card.purity}
                                onChange={(e) =>
                                  handleCardChange(
                                    idx,
                                    'purity',
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. 93"
                                className="font-mono w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 pr-7 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />
                              <span className="text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                                %
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Item & Size Stock Qty Banner (After Gross Wt & Purity) */}
                        <div className="flex items-center justify-between rounded-lg bg-[#785600]/10 px-2.5 py-1.5 text-xs text-[#785600] dark:bg-amber-900/30 dark:text-amber-300">
                          <span className="truncate text-[11px] font-medium">
                            {card.itemId ? (
                              <>
                                <strong className="font-bold text-[#785600] dark:text-amber-300">
                                  {items.find((i) => i.id === card.itemId)
                                    ?.name || 'Item'}
                                </strong>
                                {card.sizeId && (
                                  <span className="text-[#4f4535] dark:text-slate-400">
                                    {' '}
                                    (
                                    {sizes.find((s) => s.id === card.sizeId)
                                      ?.size || ''}
                                    )
                                  </span>
                                )}
                                {' '}Stock Qty:
                              </>
                            ) : (
                              'Item Stock Qty:'
                            )}
                          </span>
                          <span className="font-mono font-bold">
                            {formatNumber(
                              getItemStockWeight(
                                card.itemId,
                                card.sizeId,
                                card.purity,
                              ),
                            )}{' '}
                            G
                          </span>
                        </div>

                        {/* Fine Wt */}
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Fine Wt (लगड) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={card.fine}
                              {...getModalScaleProps(idx, 'fine')}
                              onChange={(e) =>
                                handleCardChange(idx, 'fine', e.target.value)
                              }
                              placeholder="0.000"
                              className="font-mono w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 pr-7 text-sm font-bold text-[#785600] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-400"
                            />
                            <span className="text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                              G
                            </span>
                          </div>

                          {/* Gold Available Qty */}
                          <div className="mt-1.5 flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-[#785600] dark:bg-amber-900/30 dark:text-amber-300">
                            <span className="text-[11px] font-medium">
                              Gold Available Qty:
                            </span>
                            <span className="font-mono font-bold">
                              {formatNumber(getGoldAvailableWeight())} G
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action */}
                      <div className="mt-4 flex justify-end border-t border-[#d3c4af]/20 pt-3 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleSaveCard(idx)}
                          disabled={isCardSaving}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{isCardSaving ? 'Adding...' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
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
                Are you sure you want to save this tar entry? This will move to
                the{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  Box Department (बॉक्स विभाग)
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
                  Cancel (रद्द करा)
                </button>
                <GenericButton
                  onClick={confirmSave}
                  disabled={isLoading}
                  variant="primary"
                >
                  {isLoading ? 'Saving...' : 'Confirm & Continue (पुष्टी करा)'}
                </GenericButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Stock Modal */}
      {showStockErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-[#d3c4af]/20 bg-red-50/80 px-5 py-3.5 dark:border-slate-700 dark:bg-red-950/30">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                Insufficient Stock (स्टॉक कम है)
              </h3>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs leading-relaxed text-[#4f4535] dark:text-slate-300">
                {stockErrorMessage ||
                  'Not enough stock available to add this tar entry.'}
              </p>
              <p className="mt-1 text-xs font-medium text-[#785600] dark:text-amber-400">
                (उपलब्ध स्टॉक कम है, कृपया स्टॉक तपासा.)
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setShowStockErrorModal(false)}
                className="rounded-lg bg-[#785600] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 dark:bg-amber-600"
              >
                OK (समजले)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTar;
