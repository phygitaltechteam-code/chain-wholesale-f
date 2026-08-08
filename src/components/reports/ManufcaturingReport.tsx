import { useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Search, Printer } from "lucide-react";
import { GenericTable, Column } from "@/components/Forms/Table/GenericTable";
import { useReactToPrint } from "react-to-print";
import PDFHeader from "@/components/Forms/Common/PDFHeader";
import { useGetManufacturingData } from "@/lib/api/reportapi";
import GenericButton from "../Forms/Buttons/GenericButton";

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

  // Filter data based on search term
  const filteredData = searchTerm
    ? reportData.filter(entry =>
      entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.purity.toString().includes(searchTerm) ||
      entry.weight.toString().includes(searchTerm) ||
      entry.currentWeight.toString().includes(searchTerm)
    )
    : reportData;

  // Format number with 3 decimals
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return "0";
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, "");
  };

  // Table columns - Simple GenericTable design
  const columns: Column<ManufacturingEntry>[] = [
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
          {item.purity}%
        </span>
      ),
    },
    {
      key: "weight",
      header: "Weight (G)",
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.weight)}
        </span>
      ),
    },
    {
      key: "scrap",
      header: "Scrap (G)",
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.scrap)}
        </span>
      ),
    },
    {
      key: "loss",
      header: "Loss (G)",
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.loss)}
        </span>
      ),
    },
    {
      key: "currentWeight",
      header: "Current WT (G)",
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.currentWeight)}
        </span>
      ),
    },
  ];

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
      </div>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-white">
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Sr</th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Date & Time</th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Item</th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Size</th>
            <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">Purity %</th>
            <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">Weight (G)</th>
            <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">Scrap (G)</th>
            <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">Loss (G)</th>
            <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">Current WT (G)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((entry, index) => (
            <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-1.5 text-center">{entry.srNo}</td>
              <td className="border border-gray-300 px-2 py-1.5">{entry.dateTime}</td>
              <td className="border border-gray-300 px-2 py-1.5">{entry.item}</td>
              <td className="border border-gray-300 px-2 py-1.5">{entry.size}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right">{entry.purity}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(entry.weight)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(entry.scrap)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(entry.loss)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(entry.currentWeight)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={5} className="border border-gray-300 px-2 py-1.5 text-right">Total:</td>
            <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(totals.totalWeight)}</td>
            <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(totals.totalScrap)}</td>
            <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(totals.totalLoss)}</td>
            <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(totals.currentWeight)}</td>
          </tr>
        </tfoot>
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
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
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

  // Show empty state
  if (reportData.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-5xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-[#1a1c1b] dark:text-white">No Manufacturing Records Found</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">No manufacturing records found.</p>
            <button
              onClick={() => navigate({ to: "/manufacturing" })}
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

            <div className="h-5 w-px bg-[#d3c4af]/30 dark:bg-slate-600 flex-shrink-0" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Manufacturing Report
            </h2>
          </div>

          {/* Right side - Search and Print Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search by item, size, purity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              />
            </div>

            {/* Print Button */}
            <GenericButton
              onClick={() => handlePrint()}
            >
              <Printer className="h-4 w-4" />
              <span >Print</span>
            </GenericButton>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 py-4">
        {/* Summary Cards using totals from API */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Weight
              </span>
              <span className="text-lg font-bold text-black">
                {formatNumber(totals.totalWeight)} g
              </span>

            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Scrap
              </span>
              <span className="text-lg font-bold text-black">
                {formatNumber(totals.totalScrap)} g
              </span>

            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Total Loss
              </span>
              <span className="text-lg font-bold text-black">
                {formatNumber(totals.totalLoss)} g
              </span>

            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                Current Weight
              </span>
              <span className="text-lg font-bold text-black">
                {formatNumber(totals.currentWeight)} g
              </span>

            </div>
          </div>
        </div>

        {/* Generic Table - Simple design */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={filteredData}
            columns={columns}
            onSave={(item) => console.log("Save:", item)}
            emptyMessage="No manufacturing entries found."
            isLoading={isLoading || loading}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#d3c4af]/10 pt-3 dark:border-slate-700">
          <span className="text-xs text-[#4f4535] dark:text-slate-400">
            Total Records: {filteredData.length}
          </span>
        </div>
      </div>

      {/* Hidden Print Component */}
      <div className="hidden">
        <PrintPreview />
      </div>
    </div>
  );
}