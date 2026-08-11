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

  // Default date range: current Monday -> current Sunday
  const getCurrentWeekRange = () => {
    const today = new Date();
    const day = today.getDay(); // Sunday = 0
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const { monday: defaultMonday, sunday: defaultSunday } =
    getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date | null>(defaultMonday);
  const [toDate, setToDate] = useState<Date | null>(defaultSunday);
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
      // Parse DD/MM/YYYY from entry.dateTime.
      const dateParts = entry.dateTime.split(' ')[0].split('/');

      if (dateParts.length === 3) {
        const entryDate = new Date(
          Number(dateParts[2]),
          Number(dateParts[1]) - 1,
          Number(dateParts[0])
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

  // Handle From Date
  const handleFromDateChange = (selectedDates: Date[]) => {
    if (selectedDates?.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(0, 0, 0, 0);
      setFromDate(selected);
    }
  };

  // Handle To Date
  const handleToDateChange = (selectedDates: Date[]) => {
    if (selectedDates?.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(23, 59, 59, 999);
      setToDate(selected);
    }
  };

  // Reset to current Monday -> Sunday
  const handleResetDates = () => {
    const { monday, sunday } = getCurrentWeekRange();
    setFromDate(monday);
    setToDate(sunday);
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

  // Print handler - Full A4 with PDF Header
  const handlePrint = () => {
    if (!filteredData || filteredData.length === 0) {
      return;
    }

    // Create a hidden div for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
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
      .map((item, index) => {
        return `
          <tr>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${index + 1}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:7.5px;color:#000;white-space:nowrap;">${item.dateTime}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${item.item}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${item.size}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${item.purity}</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">
              <span style="color:${item.wt > 0 ? '#16a34a' : item.wt < 0 ? '#dc2626' : '#000'};font-weight:bold;">
                ${item.remark}
              </span>
            </td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:${item.wt > 0 ? '#16a34a' : item.wt < 0 ? '#dc2626' : '#000'};">
              ${item.wt > 0 ? '+' : ''}${formatNumber(item.wt)}
            </td>
          </tr>
        `;
      })
      .join('');

    // Calculate total
    const totalWt = filteredData.reduce((sum, item) => sum + item.wt, 0);

    // Set the content with PDF Header
    printContainer.innerHTML = `
      <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
        <!-- Header Section -->
        <div>
          <!-- PDF Header - All in One Line -->
          <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
              <span style="font-size:11px;font-weight:bold;color:#a84b20;">॥ श्री गणेश प्रसन्न ॥</span>
              <span style="font-size:20px;font-weight:bold;color:#c43d5c;">मातोश्री चेन फॅक्टरी, मिरज</span>
              <span style="font-size:11px;font-weight:bold;color:#a84b20;">॥ श्री साई प्रसन्न ॥</span>
            </div>
            <div style="margin:1px 0 0 0;padding:0;font-size:9px;font-weight:bold;color:#8b451f;line-height:1.2;">
              आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
            </div>
            <div style="margin:1px 0 0 0;padding:0;font-size:9px;font-weight:bold;color:#a84b20;line-height:1.2;">
              प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ९३०९३५५१३६
            </div>
            <div style="border-bottom:2px solid #c43d5c;margin:2px 0 4px 0;"></div>
          </div>

          <!-- Title and Date Range in one line -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
            <div style="flex:1;"></div>
            <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
              Stock Report
            </h2>
            <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
              From: ${formatDateForDisplay(fromDate) || 'Start'} 
              &nbsp;&nbsp; To: ${formatDateForDisplay(toDate) || 'End'}
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
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Purity</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Remark</th>
                <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">WT (G)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
   
          </table>
        </div>

     
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
        #print-container tfoot tr {
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

            {/* From Date - current week Monday by default */}
            <div className="w-full sm:w-40">
              <GenericDatePicker
                id="from-date-stock"
                initialDate={fromDate || undefined}
                onDateChange={handleFromDateChange}
                placeholder="DD/MM/YYYY"
                dateFormat="d/m/Y"
                className="w-full"
              />
            </div>

            {/* To Date - current week Sunday by default */}
            <div className="w-full sm:w-40">
              <GenericDatePicker
                id="to-date-stock"
                initialDate={toDate || undefined}
                onDateChange={handleToDateChange}
                placeholder="DD/MM/YYYY"
                dateFormat="d/m/Y"
                className="w-full"
              />
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white hover:bg-[#5d4200] transition-colors whitespace-nowrap"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
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
    </div>
  );
}