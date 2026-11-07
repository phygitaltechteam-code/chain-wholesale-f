import {useNavigate} from '@tanstack/react-router';
import {useState, useEffect, useMemo, useRef} from 'react';
import {Search, Printer, AlertCircle, TrendingUp} from 'lucide-react';
import toast from 'react-hot-toast';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {useGetKarigarBill} from '@/lib/api/karigarBill';
import React from 'react';

// ======================================================
// INTERFACES
// ======================================================
interface InwardReportEntry {
  id: string;
  srNo: number;
  dateTime: string;
  karigarName: string;
  item: string;
  size: string;
  purity: number;
  wt: number;
  srp: number;
}

// ======================================================
// HELPER FUNCTIONS
// ======================================================
const getDefaultWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

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
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const str = num.toFixed(3);
  return str.replace(/\.?0+$/, '');
};

// ======================================================
// MAIN COMPONENT
// ======================================================
const InwardReport: React.FC = () => {
  const getpdfheaderdata = useGetHeader();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKarigar, setSelectedKarigar] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string>('all');
  const [reportData, setReportData] = useState<InwardReportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState<Date | null>(() => {
    const {monday} = getDefaultWeekRange();
    return monday;
  });
  const [toDate, setToDate] = useState<Date | null>(() => {
    const {sunday} = getDefaultWeekRange();
    return sunday;
  });

  const isDateFilterActive = useRef(false);

  const {data: billData, isLoading, isError, refetch} = useGetKarigarBill();

  // Listen for week cycle setting updates
  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      const {monday, sunday} = getDefaultWeekRange();
      setFromDate(monday);
      setToDate(sunday);
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, []);

  // Transform API data
  useEffect(() => {
    if (!billData || !Array.isArray(billData)) {
      setLoading(false);
      return;
    }

    const filteredBills = billData.filter((receipt: any) => {
      const rawDate =
        receipt.purchaseDate || receipt.createdAt || receipt.receiptDate;
      if (!rawDate) return false;
      const createdAt = new Date(rawDate);
      if (isDateFilterActive.current && fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (createdAt < from) return false;
      }
      if (isDateFilterActive.current && toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (createdAt > to) return false;
      }
      return true;
    });

    const allItems: any[] = [];
    filteredBills.forEach((receipt: any) => {
      const itemsList =
        receipt.karigarPurchaseItems || receipt.receiptItems || [];
      const karigarName =
        receipt.karigar?.fullName || receipt.karigarName || 'N/A';
      const rawDate =
        receipt.purchaseDate || receipt.createdAt || receipt.receiptDate;
      const {date, time} = formatDate(rawDate);

      itemsList.forEach((item: any, index: number) => {
        allItems.push({
          id: item.id || `${receipt.id}-${index}`,
          rawDate,
          dateTime: `${date} ${time}`,
          karigarName,
          item: item.item?.name || 'N/A',
          size: item.size?.size || 'N/A',
          purity: toNumber(item.purity),
          wt: toNumber(item.fineWeight),
          srp: toNumber(item.srp),
        });
      });
    });

    // Sort by date (newest first)
    allItems.sort(
      (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime(),
    );

    // Map to final structure with srNo
    const transformedData: InwardReportEntry[] = allItems.map(
      (item, index) => ({
        id: item.id,
        srNo: index + 1,
        dateTime: item.dateTime,
        karigarName: item.karigarName,
        item: item.item,
        size: item.size,
        purity: item.purity,
        wt: item.wt,
        srp: item.srp,
      }),
    );

    setReportData(transformedData);
    setLoading(false);
  }, [billData, fromDate, toDate]);

  // Dropdown options
  const karigarOptions = useMemo(() => {
    const karigars = new Set<string>();
    karigars.add('all');
    reportData.forEach((item) => {
      if (item.karigarName && item.karigarName !== 'N/A') {
        karigars.add(item.karigarName);
      }
    });
    return Array.from(karigars);
  }, [reportData]);

  const itemOptions = useMemo(() => {
    const items = new Set<string>();
    items.add('all');
    reportData.forEach((item) => {
      if (item.item && item.item !== 'N/A') {
        items.add(item.item);
      }
    });
    return Array.from(items);
  }, [reportData]);

  // Filter data
  const filteredData = reportData.filter((entry) => {
    let matchesSearch = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      matchesSearch =
        entry.karigarName.toLowerCase().includes(q) ||
        entry.item.toLowerCase().includes(q) ||
        entry.size.toLowerCase().includes(q) ||
        entry.dateTime.toLowerCase().includes(q) ||
        entry.wt.toString().includes(q);
    }

    let matchesKarigar = true;
    if (selectedKarigar !== 'all') {
      matchesKarigar = entry.karigarName === selectedKarigar;
    }

    let matchesItem = true;
    if (selectedItem !== 'all') {
      matchesItem = entry.item === selectedItem;
    }

    return matchesSearch && matchesKarigar && matchesItem;
  });

  // Totals
  const totalEntries = filteredData.length;
  const totalWt = filteredData.reduce((sum, e) => sum + e.wt, 0);
  const totalSrp = filteredData.reduce((sum, e) => sum + e.srp, 0);

  // From date change
  const handleFromDateChange = (dates: Date[]) => {
    isDateFilterActive.current = true;
    if (dates && dates.length > 0) {
      const from = new Date(dates[0]);
      from.setHours(0, 0, 0, 0);

      if (toDate && from > toDate) {
        const sunday = new Date(from);
        sunday.setDate(from.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        setFromDate(from);
        setToDate(sunday);
      } else {
        setFromDate(from);
      }
    } else {
      setFromDate(null);
    }
  };

  // To date change
  const handleToDateChange = (dates: Date[]) => {
    isDateFilterActive.current = true;
    if (dates && dates.length > 0) {
      const to = new Date(dates[0]);
      to.setHours(23, 59, 59, 999);

      if (fromDate && to < fromDate) {
        const monday = new Date(to);
        monday.setDate(to.getDate() - 6);
        monday.setHours(0, 0, 0, 0);
        setFromDate(monday);
        setToDate(to);
      } else {
        setToDate(to);
      }
    } else {
      setToDate(null);
    }
  };

  // Print handler
  const handlePrint = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.error('No inward data to print');
      return;
    }

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

    const rows = filteredData
      .map(
        (item, idx) => `
          <tr>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;color:#000;">${idx + 1}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;white-space:nowrap;color:#000;">${item.dateTime}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;color:#000;">${item.karigarName}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;color:#000;">${item.item}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;color:#000;">${item.size}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${item.purity > 0 ? `${formatNumberDisplay(item.purity)}%` : '-'}</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;font-weight:bold;color:#1a7f37;">${formatNumberDisplay(item.wt)} G</td>
            <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${formatNumberDisplay(item.srp)}</td>
          </tr>
        `,
      )
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

    const formatDateForDisplay = (date: Date | null) => {
      if (!date) return '';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    printContainer.innerHTML = `
      <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
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

          <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
            <div style="flex:1;"></div>
            <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
              Inward Report ${selectedKarigar !== 'all' ? `(${selectedKarigar})` : ''}
            </h2>
            ${
              fromDate || toDate
                ? `<div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
                    ${fromDate ? `From: ${formatDateForDisplay(fromDate)}` : ''}
                    ${fromDate && toDate ? '&nbsp;&nbsp;' : ''}
                    ${toDate ? `To: ${formatDateForDisplay(toDate)}` : ''}
                  </div>`
                : `<div style="flex:1;"></div>`
            }
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;">
            <thead>
              <tr style="background:#785600;color:white;font-weight:600;">
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Sr No.</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;white-space:nowrap;">Date & Time</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Karigar Name</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Items</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Size</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Purity</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Wt (g)</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">SRP</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr style="background:#f9f9f7;font-weight:bold;">
                <td colspan="6" style="border:1px solid #000;padding:3px 4px;text-align:right;font-size:10px;">Total:</td>
                <td style="border:1px solid #000;padding:3px 4px;text-align:center;font-size:10px;font-family:monospace;color:#1a7f37;">${formatNumberDisplay(totalWt)} G</td>
                <td style="border:1px solid #000;padding:3px 4px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${formatNumberDisplay(totalSrp)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="width:100%;margin-top:auto;padding-top:4px;">
          <div style="border-top:1px solid #785600;padding-top:2px;text-align:center;">
            <p style="margin:0;font-size:7px;color:#000;">This is a computer generated report</p>
            <div style="margin-top:1px;font-size:6.5px;color:#000;display:flex;justify-content:center;gap:10px;">
              <span>Powered by Matoshree Gold</span>
              <span>|</span>
              <span>Generated: ${new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })} ${new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @page { size: A4 portrait; margin: 0; }
      @media print {
        html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; }
        body * { visibility: hidden; }
        #print-container, #print-container * { visibility: visible; }
        #print-container {
          position: fixed !important; left: 0 !important; top: 0 !important;
          width: 210mm !important; height: 297mm !important;
          background: white !important; padding: 4px !important;
          overflow: auto !important; z-index: 9999 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-container table { width: 100% !important; }
        #print-container tr { page-break-inside: avoid !important; }
        #print-container thead tr,
        #print-container thead tr th {
          background: #785600 !important; color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (document.body.contains(printContainer))
          document.body.removeChild(printContainer);
        if (document.head.contains(style)) document.head.removeChild(style);
      }, 1000);
    }, 500);
  };

  // Columns
  const columns: Column<InwardReportEntry>[] = [
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
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'karigarName',
      header: 'Karigar Name',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.karigarName}
        </span>
      ),
    },
    {
      key: 'item',
      header: 'Items',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.item}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.size}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {item.purity > 0 ? `${formatNumberDisplay(item.purity)}%` : '-'}
        </span>
      ),
    },
    {
      key: 'wt',
      header: 'Purchase Wt(G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.wt)} G
        </span>
      ),
    },
    {
      key: 'srp',
      header: 'SRP(G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.srp)}
        </span>
      ),
    },
  ];

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#785600]"></div>
          <p className="mt-4 text-[#785600] dark:text-amber-400">
            Loading inward report...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 text-5xl text-red-500">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
            Error Loading Report
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Failed to fetch inward report data.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-white hover:bg-[#5d4200]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] dark:text-white sm:text-3xl lg:text-4xl">
                Inward Report
              </h2>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto xl:flex-row xl:items-center">
            {/* Mobile Row 1: Search + Print */}
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                <input
                  type="text"
                  placeholder="Search by karigar, item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="shrink-0 sm:hidden">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200]"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Mobile Row 2: Date Pickers + All Items + All Karigars */}
            <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-0.5 sm:w-auto sm:overflow-visible sm:pb-0">
              <GenericWeeklyDatePicker
                id="from-date-inward"
                mode="from"
                placeholder="DD/MM/YYYY"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={handleFromDateChange}
                className="xs:w-28 w-24 shrink-0 sm:w-36 md:w-40"
              />
              <GenericWeeklyDatePicker
                id="to-date-inward"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={toDate ? [toDate] : []}
                onDateChange={handleToDateChange}
                className="xs:w-28 w-24 shrink-0 sm:w-36 md:w-40"
              />

              <select
                value={selectedKarigar}
                onChange={(e) => setSelectedKarigar(e.target.value)}
                className="h-[38px] shrink-0 rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:px-3 sm:text-sm"
              >
                {karigarOptions.map((k) => (
                  <option key={k} value={k}>
                    {k === 'all' ? 'All Karigars' : k}
                  </option>
                ))}
              </select>

              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="h-[38px] shrink-0 rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:px-3 sm:text-sm"
              >
                {itemOptions.map((i) => (
                  <option key={i} value={i}>
                    {i === 'all' ? 'All Items' : i}
                  </option>
                ))}
              </select>

              <div className="hidden shrink-0 sm:block">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200]"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4 md:px-6">
        {/* Summary Cards - 2 cards in one row on mobile */}
        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Entries
                </span>
                <span className="font-mono truncate text-lg font-bold text-black dark:text-white sm:text-2xl">
                  {totalEntries}
                </span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 shrink-0 rounded-lg p-1.5 sm:p-2">
                <AlertCircle className="h-4 w-4 text-black dark:text-white sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Wt
                </span>
                <span className="font-mono truncate text-lg font-bold text-black dark:text-white sm:text-2xl">
                  {formatNumberDisplay(totalWt)} G
                </span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 shrink-0 rounded-lg p-1.5 sm:p-2">
                <TrendingUp className="h-4 w-4 text-black dark:text-white sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <GenericTable<InwardReportEntry>
          data={filteredData}
          columns={columns}
          emptyMessage="No inward entries found for the selected date range and process."
          showSrNo={true}
          srNoLabel="Sr No."
          className="shadow-sm"
        />
      </div>
    </div>
  );
};

export default InwardReport;
