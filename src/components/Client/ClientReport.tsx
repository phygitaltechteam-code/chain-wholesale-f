import {useNavigate, useParams} from '@tanstack/react-router';
import {Route} from '../../routes/_app/client/clientreport.$id';
import {useState, useEffect, useRef} from 'react';
import {ArrowLeft, Search, Printer} from 'lucide-react';
import {useGetClientReport} from '@/lib/api/reportapi';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {useGetClients} from '@/lib/api/client';
import {printClientReceipt} from '@/utils/printClientReceipt';
import {
  ClientReportEntry,
  ApiResponse,
  ApiDataItem,
  getCurrentWeekRange,
} from './clientReportUtils';
import {ClientReportTable} from './ClientReportTable';
import {printClientReportDoc} from './printClientReportDoc';

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

  const [_dateRange, setDateRange] = useState<Date[]>(() => {
    const {monday, sunday} = getDefaultWeekRange();
    return [monday, sunday];
  });
  const {monday: defaultMonday, sunday: defaultSunday} = getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date | null>(defaultMonday);
  const [toDate, setToDate] = useState<Date | null>(defaultSunday);
  
  const isDateFilterActive = useRef(false);

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

  // Transform API data and group rows by bill number
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
          dateTime: itemDateTime,
          billNo: isFirstInBill ? groupBillNo : '',
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
          fineWeight: isFirstInBill ? (firstItem.clientPurchase?.totalWeight ?? firstItem.bill?.totalWeight ?? firstItem.billing?.totalWeight ?? firstItem.receipt?.totalWeight ?? firstItem.clientReceipt?.totalWeight ?? firstItem.totalFinWt ?? firstItem.totalWeight) : undefined,
          given: isFirstInBill ? (firstItem.clientPurchase?.paid ?? firstItem.bill?.paid ?? firstItem.billing?.paid ?? firstItem.receipt?.paid ?? firstItem.clientReceipt?.paid ?? firstItem.receive ?? firstItem.paid) : undefined,
          pending: isFirstInBill ? (firstItem.clientPurchase?.pending ?? firstItem.bill?.pending ?? firstItem.billing?.pending ?? firstItem.receipt?.pending ?? firstItem.clientReceipt?.pending ?? firstItem.pending) : undefined,
        });
      });
    });

    setReportData(transformedData);
    setLoading(false);
  }, [clientReportData, fromDate, toDate]);

  // Filter entries
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
        : Math.abs(Number(entry.wt ?? entry.chainWt ?? entry.goldWt ?? 0));

    const items =
      rawItems.length > 0
        ? rawItems.map((it) => {
            const itemName = it.item?.name || 'Gold';
            const isGold =
              itemName.trim().toLowerCase() === 'gold' ||
              itemName.trim().toLowerCase().includes('gold');
            const purity = isGold
              ? '100%'
              : it.purity !== null && it.purity !== undefined
                ? `${it.purity}%`
                : '100%';
            const weight = Math.abs(Number(it.weight) || 0);
            return {
              item: itemName + (it.size?.size ? ` (${it.size.size})` : ''),
              purity,
              fineWeight: weight,
              weight,
              remark: it.remark || '',
            };
          })
        : [
            {
              item: entry.item || 'Gold',
              purity:
                entry.purity && entry.purity !== 'N/A'
                  ? entry.purity.includes('%')
                    ? entry.purity
                    : `${entry.purity}%`
                  : '100%',
              fineWeight: Math.abs(
                Number(entry.wt ?? entry.chainWt ?? entry.goldWt ?? 0),
              ),
              weight: Math.abs(
                Number(entry.wt ?? entry.chainWt ?? entry.goldWt ?? 0),
              ),
              remark: entry.remark || '',
            },
          ];

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
        remark: entry.remark || undefined,
        items,
      },
      getpdfheaderdata,
    );
  };

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

  const handlePrint = () => {
    printClientReportDoc({
      filteredData,
      currentClientName,
      fromDate,
      toDate,
      headerData: getpdfheaderdata,
    });
  };

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
              onClick={() => navigate({to: '/setlment/settlement'})}
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

          {/* Controls: Datepickers, Search and Print */}
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
        <ClientReportTable
          filteredData={filteredData}
          onOpenReceipt={handleOpenReceipt}
        />
      </div>
    </div>
  );
}
