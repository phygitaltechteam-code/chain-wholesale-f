import { useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Search, Printer, Calendar } from "lucide-react";
import { GenericTable, Column } from "@/components/Forms/Table/GenericTable";
import { useReactToPrint } from "react-to-print";
import PDFHeader from "@/components/Forms/Common/PDFHeader";
import { useGetManufacturingData } from "@/lib/api/reportapi";
import GenericButton from "../Forms/Buttons/GenericButton";
import GenericDatePicker from "../Forms/DatePicker/GenericDatePicker";


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
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: manufacturingData, isLoading, isError, refetch } = useGetManufacturingData();

  // State for transformed data
  const [reportData, setReportData] = useState<ManufacturingEntry[]>([]);
  const [totals, setTotals] = useState({
    totalWeight: 0,
    totalScrap: 0,
    totalLoss: 0,
    currentWeight: 0
  });
  const [loading, setLoading] = useState(true);

  // Transform API data to match our table structure
  useEffect(() => {
    if (manufacturingData) {
      const responseData = manufacturingData as ApiResponse;

      if (responseData?.history && Array.isArray(responseData.history)) {
        // Set totals
        if (responseData.totals) {
          setTotals({
            totalWeight: responseData.totals.totalWeight || 0,
            totalScrap: responseData.totals.totalScrap || 0,
            totalLoss: responseData.totals.totalLoss || 0,
            currentWeight: responseData.totals.currentWeight || 0
          });
        }

        // Transform history data
        const transformedData: ManufacturingEntry[] = responseData.history.map((item: ApiDataItem, index: number) => {
          const date = new Date(item.createdAt);
          const formattedDate = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          const formattedTime = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          return {
            id: item.id,
            srNo: index + 1,
            dateTime: `${formattedDate} ${formattedTime}`,
            item: item.item?.name || 'Unknown Item',
            size: item.size?.size || 'N/A',
            purity: item.purity || 0,
            weight: item.weight || 0,
            scrap: item.scrap || 0,
            loss: item.loss || 0,
            currentWeight: item.currentWeight || 0
          };
        });
        setReportData(transformedData);
      }
      setLoading(false);
    }
  }, [manufacturingData]);

  // Filter data based on search term and date range
  const filteredData = reportData.filter(entry => {
    // Search filter
    const matchesSearch = searchTerm === "" ||
      entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.purity.toString().includes(searchTerm) ||
      entry.weight.toString().includes(searchTerm) ||
      entry.currentWeight.toString().includes(searchTerm);

    // Date range filter
    let matchesDate = true;
    if (fromDate || toDate) {
      // Parse the date from entry.dateTime (format: "DD/MM/YYYY HH:MM AM/PM")
      const dateParts = entry.dateTime.split(' ')[0].split('/');
      if (dateParts.length === 3) {
        const entryDate = new Date(
          parseInt(dateParts[2]), // year
          parseInt(dateParts[1]) - 1, // month (0-indexed)
          parseInt(dateParts[0]) // day
        );

        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          if (entryDate < from) matchesDate = false;
        }
        if (toDate && matchesDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (entryDate > to) matchesDate = false;
        }
      }
    }

    return matchesSearch && matchesDate;
  });

  // Calculate filtered totals
  const filteredTotals = filteredData.reduce((acc, entry) => ({
    totalWeight: acc.totalWeight + entry.weight,
    totalScrap: acc.totalScrap + entry.scrap,
    totalLoss: acc.totalLoss + entry.loss,
    currentWeight: acc.currentWeight + entry.currentWeight
  }), { totalWeight: 0, totalScrap: 0, totalLoss: 0, currentWeight: 0 });

  // Format number with 3 decimals
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return "0";
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, "");
  };

  // Reset date filters
  const handleResetDates = () => {
    setFromDate(null);
    setToDate(null);
  };

  // Format date for display
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Handle date change from GenericDatePicker
  const handleFromDateChange = (selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      setFromDate(selectedDates[0]);
    } else {
      setFromDate(null);
    }
  };

  const handleToDateChange = (selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      setToDate(selectedDates[0]);
    } else {
      setToDate(null);
    }
  };

  // Custom Table with proper column structure
  const CustomTable = () => {
    if (filteredData.length === 0) {
      return (
        <div className="border border-[#d3c4af]/10 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <div className="py-12 text-center text-[#4f4535] dark:text-slate-400">
            {searchTerm || fromDate || toDate ? "No manufacturing entries found matching your filters." : "No manufacturing entries found."}
          </div>
        </div>
      );
    }

    return (
      <div className="border border-[#d3c4af]/10 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px] md:min-w-0">
            <thead>
              <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-[0.15em] text-white">
                <th className="px-3 py-3 text-center font-semibold border border-[#785600]">Sr No.</th>
                <th className="px-3 py-3 text-center font-semibold border border-[#785600]">Date & Time</th>
                <th className="px-3 py-3 text-center font-semibold border border-[#785600]">Item (Size) (Purity)</th>
                <th className="px-3 py-3 text-center font-semibold border border-[#785600]">Scrap</th>
                <th className="px-3 py-3 text-center font-semibold border border-[#785600]">Loss</th>
                <th className="px-3 py-3 text-center font-semibold border border-[#785600]">Wt. (G)</th>
                <th className="px-3 py-3 text-center font-semibold border border-[#785600]">Current Wt. (G)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
              {filteredData.map((item, index) => (
                <tr
                  key={item.id}
                  className={`group transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-[#fafaf8] dark:bg-slate-900/80'} hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50`}
                >
                  <td className="px-3 py-3 text-center text-sm text-black dark:text-white">
                    {item.srNo}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-black dark:text-white">
                    <div>{item.dateTime.split(' ')[0]}</div>
                    <div className="text-xs text-[#4f4535] dark:text-slate-400">{item.dateTime.split(' ').slice(1).join(' ')}</div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-medium text-black dark:text-white">
                    {item.item} ({item.size}) {item.purity > 0 && `(${item.purity}%)`}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-mono text-black dark:text-blue-400">
                    {formatNumber(item.scrap)}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-mono text-black dark:text-red-400">
                    {formatNumber(item.loss)}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-mono font-bold text-black dark:text-amber-400">
                    {formatNumber(item.weight)}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-mono font-bold text-black dark:text-green-400">
                    {formatNumber(item.currentWeight)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* <tfoot>
              <tr className="bg-gray-100 font-bold dark:bg-slate-800">
                <td colSpan={3} className="px-3 py-3 text-right text-sm text-black dark:text-white">
                  Total:
                </td>
                <td className="px-3 py-3 text-center text-sm font-mono text-black dark:text-blue-400">
                  {formatNumber(filteredTotals.totalScrap)}
                </td>
                <td className="px-3 py-3 text-center text-sm font-mono text-black dark:text-red-400">
                  {formatNumber(filteredTotals.totalLoss)}
                </td>
                <td className="px-3 py-3 text-center text-sm font-mono font-bold text-black dark:text-amber-400">
                  {formatNumber(filteredTotals.totalWeight)}
                </td>
                <td className="px-3 py-3 text-center text-sm font-mono font-bold text-black dark:text-green-400">
                  {formatNumber(filteredTotals.currentWeight)}
                </td>
              </tr>
            </tfoot> */}
          </table>
        </div>
      </div>
    );
  };

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Manufacturing-Report`,
    pageStyle: `
      @page { 
        size: A4 landscape; 
        margin: 10mm; 
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        #report-print { 
          page-break-inside: avoid; 
          break-inside: avoid; 
        }
        .no-print { 
          display: none !important; 
        }
      }
    `,
  });

  // Print Preview Component
  const PrintPreview = () => (
    <div
      className="bg-white p-6 max-w-full mx-auto font-sans"
      ref={printRef}
      id="report-print"
      style={{ width: '297mm', minHeight: '210mm' }}
    >
      <PDFHeader />
      <div className="border-b-2 border-[#c43d5c] my-3" />

      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold text-gray-800">Manufacturing Report</h2>
        <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</p>
        {(fromDate || toDate) && (
          <p className="text-xs text-gray-500">
            Date Range: {formatDateForDisplay(fromDate) || 'Start'} to {formatDateForDisplay(toDate) || 'End'}
          </p>
        )}
      </div>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-white">
            <th className="border border-[#785600] px-2 py-1.5 text-center font-semibold">Sr</th>
            <th className="border border-[#785600] px-2 py-1.5 text-center font-semibold">Date & Time</th>
            <th className="border border-[#785600] px-2 py-1.5 text-center font-semibold">Item (Size) (Purity)</th>
            <th className="border border-[#785600] px-2 py-1.5 text-center font-semibold">Scrap</th>
            <th className="border border-[#785600] px-2 py-1.5 text-center font-semibold">Loss</th>
            <th className="border border-[#785600] px-2 py-1.5 text-center font-semibold">Wt. (G)</th>
            <th className="border border-[#785600] px-2 py-1.5 text-center font-semibold">Current Wt. (G)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((entry, index) => (
            <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-1.5 text-center">{entry.srNo}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center">{entry.dateTime}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center">
                {entry.item} ({entry.size}) {entry.purity > 0 && `(${entry.purity}%)`}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-center font-mono">{formatNumber(entry.scrap)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center font-mono">{formatNumber(entry.loss)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center font-mono">{formatNumber(entry.weight)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center font-mono">{formatNumber(entry.currentWeight)}</td>
            </tr>
          ))}
        </tbody>
      
      </table>

      <div className="mt-3 pt-2 border-t-2 border-[#785600] text-center">
        <p className="text-xs text-gray-500">This is a system-generated report</p>
        <div className="mt-0.5 flex justify-center gap-3 text-[10px] text-gray-400">
          <span>Powered by Matoshree Gold</span>
          <span>|</span>
          <span>Generated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  // Show loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#785600] mx-auto"></div>
          <p className="mt-4 text-[#785600] dark:text-amber-400">Loading manufacturing report...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4"></div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Error Loading Report</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Failed to fetch manufacturing report data.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-[#785600] text-white rounded-lg hover:bg-[#5d4200]"
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
      <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 gap-3">
          <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
            <button
              onClick={() => navigate({ to: '/reports' })}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px bg-[#d3c4af]/30 dark:bg-slate-600 flex-shrink-0" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Manufacturing Report
            </h2>
          </div>

          {/* Right side - Search, Date Pickers and Print Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
            </div>

            {/* From Date - Using your existing DatePicker */}
            <div className="w-full sm:w-40">
              <GenericDatePicker
                id="from-date"
                initialDate={fromDate || undefined}
                onDateChange={handleFromDateChange}
                placeholder="From Date"
                className="w-full"
              />
            </div>

            {/* To Date - Using your existing DatePicker */}
            <div className="w-full sm:w-40">
              <GenericDatePicker
                id="to-date"
                initialDate={toDate || undefined}
                onDateChange={handleToDateChange}
                placeholder="To Date"
                className="w-full"
              />
            </div>

            {/* Reset Button (shows when dates are selected) */}
            {(fromDate || toDate) && (
              <button
                onClick={handleResetDates}
                className="px-3 py-2 text-sm text-[#785600] hover:text-[#5d4200] hover:bg-[#785600]/10 rounded-lg transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}

            {/* Print Button */}
            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-1.5 rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white hover:bg-[#5d4200] transition-colors whitespace-nowrap"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print Report</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 py-4">
        {/* Summary Cards - Using filtered totals */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Weight
              </span>
              <span className="text-lg font-bold text-black dark:text-amber-400">
                {formatNumber(filteredTotals.totalWeight)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Scrap
              </span>
              <span className="text-lg font-bold text-black dark:text-blue-400">
                {formatNumber(filteredTotals.totalScrap)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Loss
              </span>
              <span className="text-lg font-bold text-black dark:text-red-400">
                {formatNumber(filteredTotals.totalLoss)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Current Weight
              </span>
              <span className="text-lg font-bold text-black dark:text-green-400">
                {formatNumber(filteredTotals.currentWeight)} G
              </span>
            </div>
          </div>
        </div>

        {/* Custom Table with proper column structure */}
        <CustomTable />
      </div>

      {/* Hidden Print Component */}
      <div className="hidden">
        <PrintPreview />
      </div>
    </div>
  );
}