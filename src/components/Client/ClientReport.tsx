import {useNavigate, useParams} from '@tanstack/react-router';
import {Route} from '../../routes/_app/client/clientreport.$id';
import {useState, useRef, useEffect, type FC} from 'react';
import {ArrowLeft, Search, Printer, Calendar} from 'lucide-react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import {useGetClientReport} from '@/lib/api/reportapi';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {useGetClients} from '@/lib/api/client';
import {printClientReceipt} from '@/utils/printClientReceipt';

import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';

const formatIndianDate = (date: Date) =>
  date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const getCurrentWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

interface ClientReportEntry {
  id: string;
  srNo: number;
  dateTime: string;
  billNo: string;
  item: string;
  size: string;
  purity: string;
  remark: string;
  wt: number;
  chainWt: number | null;
  goldWt: number | null;
  isGold: boolean;
  groupId: string;
  isFirstInGroup: boolean;
  groupRowSpan: number;
  rawGroupItems?: ApiDataItem[];
}

interface ApiResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: ApiDataItem[];
  errors: null;
}

interface ApiDataItem {
  id: string;
  clientId: string;
  billNumber: string | null;
  itemId: string;
  sizeId: string | null;
  purity: number | null;
  remark: string;
  weight: number;
  receiptId: string | null;
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

export default function ClientReport() {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const routeParams = Route.useParams();
  const rawParams = useParams({strict: false}) as {id?: string; $id?: string};
  const id = routeParams?.id || rawParams?.id || rawParams?.$id || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState<ClientReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const {data: clientsData} = useGetClients();
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
  const {monday: defaultMonday, sunday: defaultSunday} = getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date | null>(defaultMonday);
  const [toDate, setToDate] = useState<Date | null>(defaultSunday);

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      const {monday, sunday} = getCurrentWeekRange();
      setDateRange([monday, sunday]);
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

  const {
    data: clientReportData,
    isLoading,
    isError,
    refetch,
  } = useGetClientReport(id);

  // Transform API data and group rows by bill number.
  useEffect(() => {
    if (!clientReportData) return;

    const response = clientReportData as ApiResponse | ApiDataItem[];

    const apiItems: ApiDataItem[] = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    const filteredApiItems = apiItems.filter((item) => {
      const createdAt = new Date(item.createdAt);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (createdAt < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (createdAt > to) return false;
      }
      return true;
    });

    const sortedItems = [...filteredApiItems].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const groupedData = sortedItems.reduce(
      (acc: Record<string, ApiDataItem[]>, item) => {
        const billKey = item.billNumber
          ? `BILL_${item.billNumber}`
          : item.receiptId
            ? `RECEIPT_${item.receiptId}`
            : `ENTRY_${item.id}`;

        if (!acc[billKey]) {
          acc[billKey] = [];
        }

        acc[billKey].push(item);
        return acc;
      },
      {},
    );

    const transformedData: ClientReportEntry[] = [];
    let srNo = 1;
    let groupId = 0;

    Object.entries(groupedData).forEach(([_, items]) => {
      groupId++;
      const groupRowSpan = items.length;
      const currentSrNo = srNo++;
      const firstItem = items[0];
      const date = new Date(firstItem.createdAt);

      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const formattedTime = date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const groupDateTime = `${formattedDate} ${formattedTime}`;
      const groupBillNo = firstItem.billNumber || '';

      items.forEach((item, index) => {
        const isFirstInBill = index === 0;
        const itemName = item.item?.name || 'Gold';
        const isGold =
          itemName.trim().toLowerCase() === 'gold' ||
          itemName.trim().toLowerCase().includes('gold');
        const sizeValue = isGold ? '' : item.size?.size || '';
        const purityValue = isGold
          ? '100'
          : item.purity !== null && item.purity !== undefined
            ? item.purity.toString()
            : 'N/A';

        // Show date/time for each item individually
        const itemDate = new Date(item.createdAt);
        const itemFormattedDate = itemDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const itemFormattedTime = itemDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const itemDateTime = `${itemFormattedDate} ${itemFormattedTime}`;

        const weightValue = item.weight || 0;

        transformedData.push({
          id: item.id || `group-${groupId}-${index}`,
          srNo: currentSrNo,
          dateTime: itemDateTime, // Individual date/time for each item
          billNo: isFirstInBill ? groupBillNo : '', // Bill number only on first row
          item: itemName,
          size: sizeValue,
          purity: purityValue,
          remark: item.remark || 'N/A',
          wt: weightValue,
          chainWt: isGold ? null : weightValue,
          goldWt: isGold ? weightValue : null,
          isGold,
          groupId: `group-${groupId}`,
          isFirstInGroup: isFirstInBill,
          groupRowSpan,
          rawGroupItems: isFirstInBill ? items : undefined,
        });
      });
    });

    setReportData(transformedData);
    setLoading(false);
  }, [clientReportData, fromDate, toDate]);

  // Search by complete bill group
  const filteredData = searchTerm
    ? reportData.filter((entry) => {
        const query = searchTerm.toLowerCase();

        return reportData.some((groupEntry) => {
          if (groupEntry.groupId !== entry.groupId) return false;

          return (
            groupEntry.item.toLowerCase().includes(query) ||
            groupEntry.billNo.toLowerCase().includes(query) ||
            groupEntry.size.toLowerCase().includes(query) ||
            groupEntry.remark.toLowerCase().includes(query) ||
            groupEntry.purity.toLowerCase().includes(query) ||
            groupEntry.wt.toString().includes(query) ||
            (groupEntry.chainWt !== null &&
              groupEntry.chainWt.toString().includes(query)) ||
            (groupEntry.goldWt !== null &&
              groupEntry.goldWt.toString().includes(query))
          );
        });
      })
    : reportData;

  // Calculate totals
  const totalWt = filteredData.reduce((sum, entry) => sum + entry.wt, 0);
  const totalReceived = filteredData
    .filter((d) => d.wt > 0)
    .reduce((sum, d) => sum + d.wt, 0);
  const totalGiven = filteredData
    .filter((d) => d.wt < 0)
    .reduce((sum, d) => sum + Math.abs(d.wt), 0);

  // Format number with 3 decimals
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  // Get remark color - now returns plain style
  const getRemarkStyle = (remark: string) => {
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const clientList = Array.isArray(clientsData?.data)
    ? clientsData.data
    : Array.isArray(clientsData)
      ? clientsData
      : [];
  const currentClient = clientList.find((c: any) => c.id === id) || {};
  const currentClientName = currentClient.fullName || currentClient.name || '';

  const handleOpenReceipt = (entry: ClientReportEntry) => {
    const rawItems = entry.rawGroupItems || [];
    const clientName = currentClientName || 'Client';
    const phoneNumber = currentClient.phoneNumber || '';
    const address = currentClient.address || '';
    const prevDue = Number(
      currentClient.openingBalance ??
        currentClient.goldBalance ??
        currentClient.balance ??
        0,
    );

    const totalWeight =
      rawItems.length > 0
        ? Math.abs(
            rawItems.reduce((acc, it) => acc + (Number(it.weight) || 0), 0),
          )
        : Math.abs(entry.wt || entry.chainWt || entry.goldWt || 0);

    const newDue = Number((prevDue + totalWeight).toFixed(3));

    printClientReceipt(
      {
        clientName,
        phoneNumber,
        address,
        billNumber: entry.billNo || undefined,
        transactionType: 'give',
        amount: totalWeight,
        previousBalance: prevDue,
        newBalance: newDue,
        dateTime: entry.dateTime,
      },
      getpdfheaderdata,
    );
  };

  // Handle From Date Change
  const handleFromDateChange = (dates: Date[]) => {
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

  // Handle To Date Change
  const handleToDateChange = (dates: Date[]) => {
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

    const printGroupedData: {[key: string]: ClientReportEntry[]} = {};
    filteredData.forEach((entry) => {
      if (!printGroupedData[entry.groupId]) {
        printGroupedData[entry.groupId] = [];
      }
      printGroupedData[entry.groupId].push(entry);
    });

    let rows = '';

    Object.keys(printGroupedData).forEach((groupId) => {
      const entries = printGroupedData[groupId];

      entries.forEach((entry, index) => {
        rows += `
                <tr>
                    ${entry.isFirstInGroup ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;vertical-align:middle;" rowspan="${entry.groupRowSpan}">${entry.srNo}</td>` : ''}
                    ${
                      entry.isFirstInGroup
                        ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;vertical-align:middle;" rowspan="${entry.groupRowSpan}">
                        ${entry.dateTime || ' '}
                    </td>`
                        : ''
                    }
                    ${
                      entry.isFirstInGroup
                        ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;vertical-align:middle;font-weight:${entry.billNo !== 'N/A' && entry.billNo !== '' ? 'bold' : 'normal'};" rowspan="${entry.groupRowSpan}">
                        ${entry.billNo || ' '}
                    </td>`
                        : ''
                    }
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
                        ${entry.item}${entry.size ? ` (${entry.size})` : ''}
                    </td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${entry.remark || 'N/A'}</td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
                        ${entry.chainWt !== null && entry.chainWt !== undefined ? `${entry.chainWt > 0 ? '+' : ''}${formatNumber(entry.chainWt)}` : '-'}
                    </td>
                    <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
                        ${entry.goldWt !== null && entry.goldWt !== undefined ? `${entry.goldWt > 0 ? '+' : ''}${formatNumber(entry.goldWt)}` : '-'}
                    </td>
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
                <div style="font-size:11px;color:#000;font-weight:bold;flex:1;text-align:left;">
                    ${currentClientName ? `Client: <span style="font-size:12px;font-weight:bold;">${currentClientName}</span>` : ''}
                </div>
                <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
                    Client Report
                </h2>
                <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
                    From: ${formatIndianDate(fromDate)} &nbsp; To: ${formatIndianDate(toDate)}
                </div>
            </div>

            <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
                <thead>
                    <tr style="background:#785600;color:white;font-weight:600;">
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Bill No</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Item (Size)</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Remark</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain WT (G)</th>
                        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Gold WT (G)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;

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
  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#785600]"></div>
          <p className="mt-4 text-[#785600] dark:text-amber-400">
            Loading client report...
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
          <div className="mb-4 text-5xl text-red-500">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
            Error Loading Report
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Failed to fetch client report data.
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

  // Show empty state
  if (reportData.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-5xl">📋</div>
            <h3 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
              No Records Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              No settlement records found for this client.
            </p>
            <button
              onClick={() => navigate({to: ''})}
              className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-white hover:bg-[#5d4200]"
            >
              Go Back
            </button>
          </div>
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
              onClick={() => navigate({to: '/setlment/settlement'})}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Client Report {currentClientName ? `- ${currentClientName}` : ''}
            </h2>
          </div>

          {/* Right side - From/To, Search and Print */}
          <div className="flex w-full flex-col items-center gap-2 sm:w-auto xl:flex-row">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <GenericWeeklyDatePicker
                id="from-date-box"
                mode="from"
                placeholder="DD/MM/YYYY"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={handleFromDateChange}
                className="w-32 sm:w-36 md:w-40"
              />

              <GenericWeeklyDatePicker
                id="to-date-box"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={toDate ? [toDate] : []}
                onDateChange={handleToDateChange}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search by bill, item, size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
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
        {/* Custom Table with Grouping */}
        <div className="-mx-3 overflow-x-auto sm:-mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="divide-gray-300 min-w-full divide-y dark:divide-slate-700">
                <thead className="bg-[#785600] dark:bg-[#5d4200]">
                  <tr>
                    <th
                      scope="col"
                      className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Sr No.
                    </th>{' '}
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Bill No.
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Date Time
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Item (Size)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Purity
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Remark
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Chain WT (G)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Gold WT (G)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
                  {filteredData.map((entry, index) => {
                    const isFirstRowOfGroup = entry.isFirstInGroup;

                    return (
                      <tr
                        key={entry.id}
                        className={
                          index % 2 === 0
                            ? 'bg-white dark:bg-slate-900'
                            : 'bg-gray-50 dark:bg-slate-800/50'
                        }
                      >
                        {isFirstRowOfGroup && (
                          <td
                            rowSpan={entry.groupRowSpan}
                            className="whitespace-nowrap border-r border-[#f4f4f2] py-3 pl-4 pr-3 text-center align-middle text-sm font-medium text-[#1a1c1b] dark:border-slate-700 dark:text-white"
                          >
                            {entry.srNo}
                          </td>
                        )}
                        {isFirstRowOfGroup && (
                          <td
                            rowSpan={entry.groupRowSpan}
                            className="whitespace-nowrap border-r border-[#f4f4f2] px-3 py-3 align-middle text-sm dark:border-slate-700"
                          >
                            <span className="text-base font-bold text-black dark:text-[#785600]">
                              {entry.billNo || ''}
                            </span>
                          </td>
                        )}
                        <td className="px-3 py-3 text-left align-middle text-sm text-[#1a1c1b] dark:text-white">
                          <div className="flex flex-col items-start leading-tight">
                            <span>{entry.dateTime.split(' ')[0]}</span>
                            <span>
                              {entry.dateTime.split(' ').slice(1).join(' ')}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#1a1c1b] dark:text-white">
                              {entry.item}
                            </span>
                            {entry.size ? (
                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                ({entry.size})
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="font-mono whitespace-nowrap px-3 py-3 text-sm text-[#1a1c1b] dark:text-white">
                          {entry.purity !== 'N/A' && entry.purity !== ''
                            ? `${entry.purity}%`
                            : 'N/A'}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getRemarkStyle(
                              entry.remark,
                            )}`}
                          >
                            {entry.remark || 'N/A'}
                          </span>
                        </td>

                        <td className="font-mono whitespace-nowrap px-3 py-3 text-center text-sm font-bold text-[#1a1c1b] dark:text-white">
                          {entry.chainWt !== null &&
                          entry.chainWt !== undefined ? (
                            <span>
                              {entry.chainWt > 0 ? '+' : ''}
                              {formatNumber(entry.chainWt)} G
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 font-normal">
                              -
                            </span>
                          )}
                        </td>

                        <td className="font-mono whitespace-nowrap px-3 py-3 text-center text-sm font-bold text-[#1a1c1b] dark:text-white">
                          {entry.goldWt !== null &&
                          entry.goldWt !== undefined ? (
                            <span>
                              {entry.goldWt > 0 ? '+' : ''}
                              {formatNumber(entry.goldWt)} G
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 font-normal">
                              -
                            </span>
                          )}
                        </td>

                        {isFirstRowOfGroup && (
                          <td
                            rowSpan={entry.groupRowSpan}
                            className="whitespace-nowrap border-l border-[#f4f4f2] px-3 py-3 text-center align-middle dark:border-slate-700"
                          >
                            {(() => {
                              const groupWeight =
                                entry.rawGroupItems &&
                                entry.rawGroupItems.length > 0
                                  ? entry.rawGroupItems.reduce(
                                      (acc, it) =>
                                        acc + (Number(it.weight) || 0),
                                      0,
                                    )
                                  : entry.wt !== undefined && entry.wt !== null
                                    ? entry.wt
                                    : (entry.chainWt ?? entry.goldWt ?? 0);
                              const isGiven = groupWeight < 0;

                              if (!isGiven) return null;

                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(entry)}
                                  title="Print Give Receipt"
                                  className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-amber-400 dark:hover:bg-amber-400/20"
                                >
                                  <Printer className="h-4 w-4" />
                                </button>
                              );
                            })()}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
