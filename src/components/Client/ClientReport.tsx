import { useNavigate, useParams } from "@tanstack/react-router";
import { Route } from "../../routes/_app/client/clientreport.$id";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Search, Printer, User, Phone, MapPin } from "lucide-react";
import GenericButton from "@/components/Forms/Buttons/GenericButton";
import { GenericTable, Column } from "@/components/Forms/Table/GenericTable";
import { useReactToPrint } from "react-to-print";
import PDFHeader from "@/components/Forms/Common/PDFHeader";
import { useGetClientReport } from "@/lib/api/reportapi";

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
    const navigate = useNavigate();
    const { id } = Route.useParams();
    const [searchTerm, setSearchTerm] = useState("");
    const printRef = useRef<HTMLDivElement>(null);
    const { data: clientReportData, isLoading, isError, refetch } = useGetClientReport(id);

    // State for transformed data
    const [reportData, setReportData] = useState<ClientReportEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Transform API data to match our table structure
    useEffect(() => {
        if (clientReportData) {
            const responseData = clientReportData as ApiResponse;

            if (responseData?.data && Array.isArray(responseData.data)) {
                // Group by bill number
                const groupedData = responseData.data.reduce((acc: any, item: ApiDataItem) => {
                    const billKey = item.billNumber || 'N/A';
                    if (!acc[billKey]) {
                        acc[billKey] = [];
                    }
                    acc[billKey].push(item);
                    return acc;
                }, {});

                // Transform grouped data to entries
                const transformedData: ClientReportEntry[] = [];
                let srNo = 1;

                // Process each bill group
                Object.keys(groupedData).forEach((billKey) => {
                    const items = groupedData[billKey];
                    
                    // Group by remark to combine weights
                    const remarkGroups = items.reduce((acc: any, item: ApiDataItem) => {
                        const remark = item.remark || 'N/A';
                        if (!acc[remark]) {
                            acc[remark] = {
                                weight: 0,
                                item: item.item?.name || 'Unknown Item',
                                size: item.size?.size || 'N/A',
                                purity: item.purity !== null ? item.purity.toString() : 'N/A',
                                createdAt: item.createdAt
                            };
                        }
                        acc[remark].weight += item.weight || 0;
                        return acc;
                    }, {});

                    // Create entries for each remark group
                    Object.keys(remarkGroups).forEach((remark) => {
                        const group = remarkGroups[remark];
                        const date = new Date(group.createdAt);
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

                        transformedData.push({
                            id: `group-${srNo}`,
                            srNo: srNo++,
                            dateTime: `${formattedDate} ${formattedTime}`,
                            billNo: billKey === 'N/A' ? 'N/A' : billKey,
                            item: group.item,
                            size: group.size,
                            purity: group.purity,
                            remark: remark,
                            wt: group.weight
                        });
                    });
                });

                // Sort by date (newest first)
                transformedData.sort((a, b) => {
                    const dateA = new Date(a.dateTime);
                    const dateB = new Date(b.dateTime);
                    return dateB.getTime() - dateA.getTime();
                });

                // Reset srNo after sorting
                transformedData.forEach((item, index) => {
                    item.srNo = index + 1;
                });

                setReportData(transformedData);
            }
            setLoading(false);
        }
    }, [clientReportData]);

    // Filter data based on search term
    const filteredData = searchTerm
        ? reportData.filter(entry =>
            entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.remark.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.purity.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.wt.toString().includes(searchTerm)
        )
        : reportData;

    // Calculate totals
    const totalWt = filteredData.reduce((sum, entry) => sum + entry.wt, 0);
    const totalReceived = filteredData.filter(d => d.wt > 0).reduce((sum, d) => sum + d.wt, 0);
    const totalGiven = filteredData.filter(d => d.wt < 0).reduce((sum, d) => sum + Math.abs(d.wt), 0);

    // Format number with 3 decimals
    const formatNumber = (value: number) => {
        if (value === 0 || !value) return "0";
        const str = value.toFixed(3);
        return str.replace(/\.?0+$/, "");
    };

    // Get remark color
    const getRemarkColor = (remark: string) => {
        switch (remark) {
            case "Settle":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "Advance":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "Sale":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            case "Received":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            case "Given":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    // Table columns
    const columns: Column<ClientReportEntry>[] = [
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
            key: "billNo",
            header: "Bill No",
            render: (item) => (
                <span className={`text-sm font-medium ${item.billNo !== 'N/A' ? 'text-[#785600] dark:text-amber-400' : 'text-gray-400'}`}>
                    {item.billNo}
                </span>
            ),
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
        documentTitle: `Client-Report-${id}`,
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
                <h2 className="text-lg font-bold text-gray-800">Client Report</h2>
                <p className="text-xs text-gray-500">Client ID: {id}</p>
                <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</p>
            </div>

            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-white">
                        <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Sr</th>
                        <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Date & Time</th>
                        <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Bill No</th>
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
                            <td className="border border-gray-300 px-2 py-1.5">{entry.billNo}</td>
                            <td className="border border-gray-300 px-2 py-1.5">{entry.item}</td>
                            <td className="border border-gray-300 px-2 py-1.5">{entry.size}</td>
                            <td className="border border-gray-300 px-2 py-1.5">{entry.purity}</td>
                            <td className="border border-gray-300 px-2 py-1.5">{entry.remark}</td>
                            <td className={`border border-gray-300 px-2 py-1.5 text-right font-mono ${entry.wt > 0 ? 'text-green-600' : entry.wt < 0 ? 'text-red-600' : ''}`}>
                                {entry.wt > 0 ? '+' : ''}{formatNumber(entry.wt)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={7} className="border border-gray-300 px-2 py-1.5 text-right">Total:</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(totalWt)}</td>
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
                    <p className="mt-4 text-[#785600] dark:text-amber-400">Loading client report...</p>
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
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Failed to fetch client report data.</p>
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
                        <div className="text-5xl mb-4">📋</div>
                        <h3 className="text-xl font-bold text-[#1a1c1b] dark:text-white">No Records Found</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">No settlement records found for this client.</p>
                        <button
                            onClick={() => navigate({ to: "/client/client" })}
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
                            onClick={() => navigate({ to: "/client/client" })}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
                            title="Go Back"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="h-5 w-px bg-[#d3c4af]/30 dark:bg-slate-600 flex-shrink-0" />
                        <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
                            Client Report
                        </h2>
                    </div>

                    {/* Right side - Search and Print Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                            <input
                                type="text"
                                placeholder="Search by bill, item, size..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                            />
                        </div>

                        {/* Print Button - Right side of search bar */}
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
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                                Total WT
                            </span>
                            <span className={`text-lg font-bold ${totalWt > 0 ? 'text-green-600' : totalWt < 0 ? 'text-red-600' : 'text-[#1a1c1b]'} dark:text-amber-400`}>
                                {formatNumber(totalWt)} G
                            </span>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                                Received (+)
                            </span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                +{formatNumber(totalReceived)} G
                            </span>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                                Given (-)
                            </span>
                            <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                -{formatNumber(totalGiven)} G
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
                        emptyMessage={searchTerm ? "No entries match your search." : "No entries found for this client."}
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