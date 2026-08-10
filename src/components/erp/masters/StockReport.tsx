import { useNavigate, useParams } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Search, Printer, Calendar } from "lucide-react";
import { GenericTable, Column } from "@/components/Forms/Table/GenericTable";
import { useReactToPrint } from "react-to-print";
import PDFHeader from "@/components/Forms/Common/PDFHeader";
import { Route } from "@/routes/_app/stock/stockreport.$d";
import { useGetStockReport } from "@/lib/api/reportapi";
import GenericButton from "@/components/Forms/Buttons/GenericButton";
import GenericDatePicker from "@/components/Forms/DatePicker/GenericDatePicker";

interface StockReportEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: string;
  remark: string;
  wt: number;
  amount?: number;
}

interface ApiDataItem {
  id: string;
  adminId: string;
  itemId: string;
  sizeId: string | null;
  purity: number;
  remark: string;
  weight: number;
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

interface ApiResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: {
    history: ApiDataItem[];
  };
  errors: null;
}

export default function StockReport() {
  const navigate = useNavigate();
  const { d } = Route.useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: stockData, isLoading, isError, refetch } = useGetStockReport(d);

  // State for transformed data
  const [reportData, setReportData] = useState<StockReportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Transform API data to match our table structure
  useEffect(() => {
    if (stockData) {
      const responseData = stockData as ApiResponse;

      if (responseData?.history && Array.isArray(responseData.history)) {
        const transformedData: StockReportEntry[] = responseData.history.map((item: ApiDataItem, index: number) => {
          // Format date
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

          // Use the actual remark from API
          const remark = item.remark || 'N/A';

          return {
            id: item.id,
            srNo: index + 1,
            dateTime: `${formattedDate} ${formattedTime}`,
            item: item.item?.name || 'Unknown Item',
            size: item.size?.size || 'N/A',
            purity: item.purity ? item.purity.toString() : 'N/A',
            remark: remark,
            wt: item.weight || 0
          };
        });
        setReportData(transformedData);
      }
      setLoading(false);
    }
  }, [stockData]);

  // Filter data based on search term and date range
  const filteredData = reportData.filter(entry => {
    // Search filter
    const matchesSearch = searchTerm === "" ||
      entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.purity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.remark.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.wt.toString().includes(searchTerm);

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

  // Calculate totals
  const totalWt = filteredData.reduce((sum, entry) => sum + entry.wt, 0);
  const totalEntries = filteredData.length;

  // Format number with 3 decimals
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return "0";
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, "");
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

  // Reset date filters
  const handleResetDates = () => {
    setFromDate(null);
    setToDate(null);
  };

  // Get remark color - handles any remark string
  const getRemarkColor = (remark: string) => {
    const remarkLower = remark?.toLowerCase() || '';
    
    if (remarkLower.includes('inward')) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    } else if (remarkLower.includes('outward')) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    } else if (remarkLower.includes('scale') || remarkLower.includes('manufactured')) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    } else if (remarkLower.includes('received')) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    } else if (remarkLower.includes('given')) {
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    } else if (remarkLower.includes('sale')) {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    } else if (remarkLower.includes('settle')) {
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
    } else if (remarkLower.includes('advance')) {
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
    } else {
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Table columns
  const columns: Column<StockReportEntry>[] = [
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
      key: "item",
      header: "Item",
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.item}
        </span>
      ),
    },
    {
      key: "size",
      header: "Size",
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.size}
        </span>
      ),
    },
    {
      key: "purity",
      header: "Purity",
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {item.purity}
        </span>
      ),
    },
    {
      key: "remark",
      header: "Remark",
      render: (item) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRemarkColor(item.remark)}`}>
          {item.remark}
        </span>
      ),
    },
    {
      key: "wt",
      header: "WT (G)",
      render: (item) => (
        <span className={`text-sm font-mono font-bold ${item.wt > 0 ? 'text-green-600 dark:text-green-400' : item.wt < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
          {item.wt > 0 ? '+' : ''}{formatNumber(item.wt)}
        </span>
      ),
    },
  ];

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Stock Report',
    pageStyle: `
      @page { 
        size: A4 portrait; 
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
        <h2 className="text-lg font-bold text-gray-800">Stock Report</h2>
        <p className="text-xs text-gray-500">Stock ID: {d}</p>
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
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Sr</th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Date & Time</th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Item</th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Size</th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Purity</th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Remark</th>
            <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">WT (G)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((entry, index) => (
            <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-1.5 text-center">{entry.srNo}</td>
              <td className="border border-gray-300 px-2 py-1.5">{entry.dateTime}</td>
              <td className="border border-gray-300 px-2 py-1.5">{entry.item}</td>
              <td className="border border-gray-300 px-2 py-1.5">{entry.size}</td>
              <td className="border border-gray-300 px-2 py-1.5">{entry.purity}</td>
              <td className="border border-gray-300 px-2 py-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${getRemarkColor(entry.remark)}`}>
                  {entry.remark}
                </span>
              </td>
              <td className={`border border-gray-300 px-2 py-1.5 text-right font-mono ${entry.wt > 0 ? 'text-green-600' : entry.wt < 0 ? 'text-red-600' : ''}`}>
                {entry.wt > 0 ? '+' : ''}{formatNumber(entry.wt)}
              </td>
            </tr>
          ))}
        </tbody>
       
      </table>

    </div>
  );

  // Show loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#785600] mx-auto"></div>
          <p className="mt-4 text-[#785600] dark:text-amber-400">Loading stock report...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Error Loading Report</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Failed to fetch stock report data.</p>
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

  // Show empty state
  if (reportData.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-[#1a1c1b] dark:text-white">No Stock Records Found</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">No stock records found for this item.</p>
            <button
              onClick={() => navigate({ to: "/Stocks/stockpage" })}
              className="mt-4 px-4 py-2 bg-[#785600] text-white rounded-lg hover:bg-[#5d4200]"
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
      <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 gap-3">
          <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
            <button
              onClick={() => navigate({ to: "/Stocks/stockpage" })}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px bg-[#d3c4af]/30 dark:bg-slate-600 flex-shrink-0" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Stock Report
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

            {/* From Date */}
            <div className="w-full sm:w-40">
              <GenericDatePicker
                id="from-date-stock"
                initialDate={fromDate || undefined}
                onDateChange={handleFromDateChange}
                placeholder="From Date"
                className="w-full"
              />
            </div>

            {/* To Date */}
            <div className="w-full sm:w-40">
              <GenericDatePicker
                id="to-date-stock"
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
        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Weight
              </span>
              <span className='text-black font-bold text-lg'>
                {formatNumber(totalWt)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Entries
              </span>
              <span className='text-black font-bold text-lg'>
                {totalEntries}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={filteredData}
            columns={columns}
            onSave={(item) => console.log("Save:", item)}
            emptyMessage={searchTerm || fromDate || toDate ? "No stock entries found matching your filters." : "No stock entries found."}
            isLoading={isLoading || loading}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      </div>

      {/* Hidden Print Component */}
      <div className="hidden">
        <PrintPreview />
      </div>
    </div>
  );
}