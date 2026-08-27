import { useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Printer, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetManufacturingData } from '@/lib/api/reportapi';
import GenericWeeklyDatePicker from '../Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';

interface ManufacturingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: number;
  weight: number;
  scrap: number;
  loss: number;
  currentWeight: number;
  groupId: string;
  isFirstInGroup: boolean;
  groupRowSpan: number;
  displaySrNo: string;
}

interface ApiResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: {
    totals: {
      totalWeight: number;
      totalScrap: number;
      totalLoss: number;
      currentWeight: number;
    };
    history: ApiDataItem[];
  };
  errors: null;
}

interface ApiDataItem {
  id: string;
  adminId: string;
  itemId: string;
  sizeId: string | null;
  purity: number;
  weight: number;
  scrap: number;
  loss: number;
  currentWeight: number;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    name: string;
    adminId: string;
    createdAt: string;
    updatedAt: string;
  };
  size: {
    id: string;
    size: string;
    adminId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export default function ManufacturingReport() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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

    return { monday, sunday };
  };

  const [fromDate, setFromDate] = useState<Date | null>(
    () => getDefaultWeekRange().monday,
  );
  const [toDate, setToDate] = useState<Date | null>(
    () => getDefaultWeekRange().sunday,
  );
  const {
    data: manufacturingData,
    isLoading,
    isError,
    refetch,
  } = useGetManufacturingData();
  const getpdfheaderdata = useGetHeader();

  // Derive transformed data from manufacturingData
  const reportData = useMemo<ManufacturingEntry[]>(() => {
    if (!manufacturingData) return [];
    const responseData = manufacturingData as ApiResponse;

    if (!responseData?.history || !Array.isArray(responseData.history)) {
      return [];
    }

    // Group by Item + Size + Purity combination
    const groupedItems: { [key: string]: ApiDataItem[] } = {};
    responseData.history.forEach((item: ApiDataItem) => {
      const itemName = item.item?.name || 'Unknown Item';
      const sizeName = item.size?.size || 'N/A';
      const purityValue = item.purity || 0;
      // Create a unique key from Item + Size + Purity
      const groupKey = `${itemName}|${sizeName}|${purityValue}`;
      
      if (!groupedItems[groupKey]) {
        groupedItems[groupKey] = [];
      }
      groupedItems[groupKey].push(item);
    });

    const transformedData: ManufacturingEntry[] = [];
    let srNo = 1;
    let groupId = 0;

    // Sort group keys by item name alphabetically
    const sortedGroupKeys = Object.keys(groupedItems).sort();

    sortedGroupKeys.forEach((groupKey) => {
      const items = groupedItems[groupKey];
      // Sort items by createdAt (newest first)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      groupId++;
      const groupRowSpan = items.length;
      const currentSrNo = srNo++;

      // Get the first item's details for the group
      const firstItem = items[0];
      const groupItemName = firstItem.item?.name || 'Unknown Item';
      const groupSize = firstItem.size?.size || 'N/A';
      const groupPurity = firstItem.purity || 0;

      items.forEach((item, index) => {
        const isFirstInGroup = index === 0;
        const date = new Date(item.createdAt);
        const formattedDate = !isNaN(date.getTime())
          ? date.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '';
        const formattedTime = !isNaN(date.getTime())
          ? date.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : '';

        transformedData.push({
          id: item.id,
          srNo: currentSrNo,
          dateTime: `${formattedDate} ${formattedTime}`.trim(),
          item: groupItemName,
          size: groupSize,
          purity: groupPurity,
          weight: item.weight || 0,
          scrap: item.scrap || 0,
          loss: item.loss || 0,
          currentWeight: item.currentWeight || 0,
          groupId: `group-${groupId}`,
          isFirstInGroup,
          groupRowSpan,
          displaySrNo: isFirstInGroup ? currentSrNo.toString() : '',
        });
      });
    });

    return transformedData;
  }, [manufacturingData]);

  // Filter data based on search term and date range
  const filteredData = useMemo(() => {
    return reportData.filter((entry) => {
      const matchesSearch =
        searchTerm === '' ||
        entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.purity.toString().includes(searchTerm) ||
        entry.weight.toString().includes(searchTerm) ||
        entry.currentWeight.toString().includes(searchTerm);

      let matchesDate = true;

      if (fromDate || toDate) {
        const dateParts = entry.dateTime.split(' ')[0].split('/');

        if (dateParts.length === 3) {
          const entryDate = new Date(
            Number(dateParts[2]),
            Number(dateParts[1]) - 1,
            Number(dateParts[0]),
          );
          entryDate.setHours(12, 0, 0, 0);

          if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (entryDate < from) {
              matchesDate = false;
            }
          }

          if (toDate && matchesDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (entryDate > to) {
              matchesDate = false;
            }
          }
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [reportData, searchTerm, fromDate, toDate]);

  // Calculate filtered totals
  const filteredTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, entry) => ({
        totalWeight: acc.totalWeight + entry.weight,
        totalScrap: acc.totalScrap + entry.scrap,
        totalLoss: acc.totalLoss + entry.loss,
        currentWeight: acc.currentWeight + entry.currentWeight,
      }),
      { totalWeight: 0, totalScrap: 0, totalLoss: 0, currentWeight: 0 },
    );
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fromDate, toDate]);

  // Format number with 3 decimals
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  // Format date for display
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Handle From Date
  const handleFromDateChange = (selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(0, 0, 0, 0);
      setFromDate(selected);
    } else {
      setFromDate(null);
    }
  };

  // Handle To Date
  const handleToDateChange = (selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(23, 59, 59, 999);
      setToDate(selected);
    } else {
      setToDate(null);
    }
  };

  const fromInitialDates = useMemo(
    () => (fromDate ? [fromDate] : []),
    [fromDate],
  );
  const toInitialDates = useMemo(() => (toDate ? [toDate] : []), [toDate]);

  const handlePrint = () => {
    if (!filteredData || filteredData.length === 0) {
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

    const printGroupedData: { [key: string]: ManufacturingEntry[] } = {};
    filteredData.forEach((entry) => {
      if (!printGroupedData[entry.groupId]) {
        printGroupedData[entry.groupId] = [];
      }
      printGroupedData[entry.groupId].push(entry);
    });

    let rows = '';
    Object.keys(printGroupedData).forEach((groupId) => {
      const entries = printGroupedData[groupId];
      entries.forEach((item, index) => {
        const isFirst = index === 0;
        rows += `
          <tr>
            ${isFirst ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;font-weight:bold;vertical-align:middle;" rowspan="${item.groupRowSpan}">${item.srNo}</td>` : ''}
            ${isFirst ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;font-weight:bold;vertical-align:middle;" rowspan="${item.groupRowSpan}">${item.item} ${item.size !== 'N/A' ? `(${item.size})` : ''} ${item.purity > 0 ? `(${item.purity}%)` : ''}</td>` : ''}
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">${item.dateTime}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.scrap)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.loss)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.weight)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.currentWeight)}</td>
          </tr>
        `;
      });
    });

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
              Manufacturing Report
            </h2>
            ${fromDate || toDate
        ? `
            <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
              ${fromDate ? `From: ${formatDateForDisplay(fromDate)}` : ''} 
              ${fromDate && toDate ? '&nbsp;&nbsp;' : ''}
              ${toDate ? `To: ${formatDateForDisplay(toDate)}` : ''}
            </div>
            `
        : `<div style="flex:1;"></div>`
      }
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;">
            <thead>
              <tr style="background:#785600;color:white;font-weight:600;">
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Sr</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Item (Size) (Purity)</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;white-space:nowrap;">Date & Time</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Scrap</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Loss</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Wt(g)</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Current Wt</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div style="width:100%;margin-top:auto;padding-top:4px;">
          <div style="border-top:1px solid #785600;padding-top:2px;text-align:center;">
            <p style="margin:0;font-size:7px;color:#000;">
              This is a computer generated report
            </p>
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
        #print-container, #print-container * {
          visibility: visible;
        }
        #print-container {
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
        #print-container > div {
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 6mm 5mm !important;
          box-sizing: border-box !important;
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

    setTimeout(() => {
      window.print();

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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#785600]"></div>
          <p className="mt-4 text-[#785600] dark:text-amber-400">
            Loading manufacturing report...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 text-5xl text-red-500"></div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
            Error Loading Report
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Failed to fetch manufacturing report data.
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
            <button
              onClick={() => navigate({ to: '/reports/manufacturing' })}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Manufacturing Report
            </h2>
          </div>

          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GenericWeeklyDatePicker
                id="from-date-box"
                placeholder="DD/MM/YYYY"
                mode="from"
                initialDates={fromInitialDates}
                onDateChange={handleFromDateChange}
                className="w-32 sm:w-36 md:w-40"
              />

              <GenericWeeklyDatePicker
                id="to-date-box"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={toInitialDates}
                onDateChange={handleToDateChange}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>

            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4 md:px-6">
        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Total Weight
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.totalWeight)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Total Scrap
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.totalScrap)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Total Loss
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.totalLoss)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Current Weight
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.currentWeight)} G
              </span>
            </div>
          </div>
        </div>

        {/* Table with Grouping - Fixed alternating rows */}
        {filteredData.length === 0 ? (
          <div className="border border-[#d3c4af]/10 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="py-12 text-center text-[#4f4535] dark:text-slate-400">
              {searchTerm || fromDate || toDate
                ? 'No manufacturing entries found matching your filters.'
                : 'No manufacturing entries found.'}
            </div>
          </div>
        ) : (
          <>
            <div className="border border-[#d3c4af]/10 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse md:min-w-0">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-[0.15em] text-white">
                      <th className="border border-[#785600] px-3 py-3 text-center font-semibold w-14">
                        Sr No.
                      </th>
                      <th className="border border-[#785600] px-3 py-3 text-center font-semibold">
                        Item (Size) (Purity)
                      </th>
                      <th className="border border-[#785600] px-3 py-3 text-center font-semibold whitespace-nowrap">
                        Date & Time
                      </th>
                      <th className="border border-[#785600] px-3 py-3 text-center font-semibold">
                        Scrap (G)
                      </th>
                      <th className="border border-[#785600] px-3 py-3 text-center font-semibold">
                        Loss (G)
                      </th>
                      <th className="border border-[#785600] px-3 py-3 text-center font-semibold">
                        Wt. (G)
                      </th>
                      <th className="border border-[#785600] px-3 py-3 text-center font-semibold">
                        Current Wt. (G)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, index) => {
                      const isFirstRowOfGroup = item.isFirstInGroup;
                      // Calculate row index for alternating colors
                      const rowIndex = (currentPage - 1) * itemsPerPage + index;
                      // Alternate row colors - white for even, gray for odd
                      const rowColor = rowIndex % 2 === 0 
                        ? 'bg-white dark:bg-slate-900' 
                        : 'bg-gray-50 dark:bg-slate-800/60';

                      return (
                        <tr
                          key={item.id}
                          className={`${rowColor} hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50 transition-colors border-b border-[#f4f4f2] dark:border-slate-700`}
                        >
                          {isFirstRowOfGroup ? (
                            <td
                              rowSpan={item.groupRowSpan}
                              className="border-r border-[#f4f4f2] px-3 py-3 text-center align-middle text-sm font-bold text-black dark:border-slate-700 dark:text-white"
                            >
                              {item.srNo}
                            </td>
                          ) : null}

                          {isFirstRowOfGroup ? (
                            <td
                              rowSpan={item.groupRowSpan}
                              className="border-r border-[#f4f4f2] px-3 py-3 text-center align-middle text-sm font-bold text-black dark:border-slate-700 dark:text-white"
                            >
                              {item.item} 
                              {item.size !== 'N/A' ? ` (${item.size})` : ''}
                              {item.purity > 0 ? ` (${item.purity}%)` : ''}
                            </td>
                          ) : null}

                          <td className="px-3 py-3 text-center text-sm text-black dark:text-white whitespace-nowrap">
                            {item.dateTime}
                          </td>

                          <td className="font-mono px-3 py-3 text-center text-sm text-black dark:text-white">
                            {formatNumber(item.scrap)} G
                          </td>
                          <td className="font-mono px-3 py-3 text-center text-sm text-black dark:text-white">
                            {formatNumber(item.loss)} G
                          </td>
                          <td className="font-mono px-3 py-3 text-center text-sm font-medium text-black dark:text-white">
                            {formatNumber(item.weight)} G
                          </td>
                          <td className="font-mono px-3 py-3 text-center text-sm font-bold text-black dark:text-white">
                            {formatNumber(item.currentWeight)} G
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-[#d3c4af]/20 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredData.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredData.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-slate-600 dark:hover:bg-slate-700"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 10) {
                          pageNum = i + 1;
                        } else if (currentPage <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage > totalPages - 5) {
                          pageNum = totalPages - 9 + i;
                        } else {
                          pageNum = currentPage - 5 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              pageNum === currentPage
                                ? 'z-10 bg-[#785600] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#785600]'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-300 dark:ring-slate-600 dark:hover:bg-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-slate-600 dark:hover:bg-slate-700"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}