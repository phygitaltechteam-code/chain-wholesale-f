import { useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Search, Printer, Calendar } from "lucide-react";
import { GenericTable, Column } from "@/components/Forms/Table/GenericTable";
import { useReactToPrint } from "react-to-print";
import PDFHeader from "@/components/Forms/Common/PDFHeader";
import { useGetManufacturingData } from "@/lib/api/reportapi";
import GenericButton from "../Forms/Buttons/GenericButton";
import GenericDatePicker from "../Forms/DatePicker/GenericDatePicker";
import GenericWeeklyDatePicker from "../Forms/DatePicker/GenericWeeklyDatePicker";
import { useGetHeader } from "@/lib/api/headerapi";


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

  const [fromDate, setFromDate] = useState<Date | null>(() => getDefaultWeekRange().monday);
  const [toDate, setToDate] = useState<Date | null>(() => getDefaultWeekRange().sunday);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: manufacturingData, isLoading, isError, refetch } = useGetManufacturingData();
  const getpdfheaderdata = useGetHeader();
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

  // Reset to current Monday -> Sunday
  const handleResetDates = () => {
    const { monday, sunday } = getCurrentWeekRange();
    setFromDate(monday);
    setToDate(sunday);
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
                    <div>{item.dateTime.split(' ').slice(1).join(' ')}</div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-medium text-black dark:text-white">
                    {item.item} ({item.size}) {item.purity > 0 && `(${item.purity}%)`}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-mono text-black dark:text-blue-400">
                    {formatNumber(item.scrap)} G
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-mono text-black dark:text-red-400">
                    {formatNumber(item.loss)} G
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-mono font-bold text-black dark:text-amber-400">
                    {formatNumber(item.weight)} G
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-mono font-bold text-black dark:text-green-400">
                    {formatNumber(item.currentWeight)} G
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
      width: 100%;
      background: white;
      padding: 4px;
      z-index: 9999;
    `;
    document.body.appendChild(printContainer);

    // Build the table rows - Compact with minimum padding
    const rows = filteredData
      .map((item, index) => {
        return `
          <tr>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${index + 1}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
              ${item.dateTime}
            </td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${item.item}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${item.size}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${item.purity}%</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.weight)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.scrap)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.loss)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.currentWeight)}</td>
          </tr>
        `;
      })
      .join('');

    const headerInfo = getpdfheaderdata?.data?.data || (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
    const leftInvocation = headerInfo.leftInvocation || headerInfo.leftInovation || '॥ श्री गणेश प्रसन्न ॥';
    const rightInvocation = headerInfo.rightInvocation || headerInfo.rightInovation || '॥ श्री साई प्रसन्न ॥';
    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
    const description = headerInfo.description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
    const invocationColor = headerInfo.invocationColor || '#a84b20';
    const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
    const descriptionColor = headerInfo.descriptionColor || '#8b451f';
    const proprietorColor = headerInfo.proprietorColor || '#a84b20';
    const phoneColor = headerInfo.phoneColor || '#a84b20';
    const factoryFontSize = headerInfo.factoryFontSize ? `${headerInfo.factoryFontSize}px` : '20px';
    const descriptionFontSize = headerInfo.descriptionFontSize ? `${headerInfo.descriptionFontSize}px` : '9px';
    const proprietorFontSize = headerInfo.proprietorFontSize ? `${headerInfo.proprietorFontSize}px` : '9px';
    const phoneFontSize = headerInfo.phoneFontSize ? `${headerInfo.phoneFontSize}px` : '9px';

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

<!-- Title and Date Range in one line -->
<div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
  <div style="flex:1;"></div>
  <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
    Manufacturing Report
  </h2>
  ${fromDate || toDate ? `
    <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
      From: ${formatDateForDisplay(fromDate) || 'Start'} &nbsp; To: ${formatDateForDisplay(toDate) || 'End'}
    </div>
  ` : `
    <div style="flex:1;"></div>
  `}
</div>
        

        <!-- Table -->
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Item</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Size</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Purity %</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Weight</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Scrap</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Loss</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Current Wt.</th>
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
        <div className="flex justify-center items-center gap-4 flex-wrap">
          <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</p>
          {(fromDate || toDate) && (
            <p className="text-xs text-gray-500">
              From: {formatDateForDisplay(fromDate) || 'Start'} &nbsp; To: {formatDateForDisplay(toDate) || 'End'}
            </p>
          )}
        </div>
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
            <div className="flex flex-wrap items-center gap-2">
              {/* From Date - Defaults to Monday */}
              <GenericWeeklyDatePicker
                id="from-date-box"
                placeholder="DD/MM/YYYY"
                mode="from"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={handleFromDateChange}
                className="w-32 sm:w-36 md:w-40"
              />

              {/* To Date - Defaults to Sunday */}
              <GenericWeeklyDatePicker
                id="to-date-box"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={toDate ? [toDate] : []}
                onDateChange={handleToDateChange}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>



            {/* Print Button */}
            <button
              onClick={() => handlePrint()}
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