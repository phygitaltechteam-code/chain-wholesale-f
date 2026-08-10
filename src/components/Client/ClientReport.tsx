import { useNavigate, useParams } from "@tanstack/react-router";
import { Route } from "../../routes/_app/client/clientreport.$id";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Search, Printer } from "lucide-react";
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
    groupId: string;
    isFirstInGroup: boolean;
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
    const [reportData, setReportData] = useState<ClientReportEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: clientReportData, isLoading, isError, refetch } = useGetClientReport(id);

    // Transform API data to match our table structure
    useEffect(() => {
        if (clientReportData) {
            const responseData = clientReportData as ApiResponse;

            if (responseData && Array.isArray(responseData)) {
                // First, sort all items by createdAt (newest first)
                const sortedItems = [...responseData].sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                // Group by bill number
                const groupedData = sortedItems.reduce((acc: any, item: ApiDataItem) => {
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
                let groupId = 0;

                // Process each bill group
                Object.keys(groupedData).forEach((billKey) => {
                    const items = groupedData[billKey];
                    groupId++;
                    
                    // Group by remark to combine weights within the same bill
                    const remarkGroups = items.reduce((acc: any, item: ApiDataItem) => {
                        const remark = item.remark || 'N/A';
                        if (!acc[remark]) {
                            acc[remark] = {
                                weight: 0,
                                item: item.item?.name || 'Unknown Item',
                                size: item.size?.size || 'N/A',
                                purity: item.purity !== null ? item.purity.toString() : 'N/A',
                                createdAt: item.createdAt,
                                billNumber: billKey,
                                items: []
                            };
                        }
                        acc[remark].weight += item.weight || 0;
                        acc[remark].items.push(item);
                        return acc;
                    }, {});

                    // Create entries for each remark group
                    const remarkKeys = Object.keys(remarkGroups);
                    
                    remarkKeys.forEach((remark, index) => {
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

                        // Determine if this is the first entry in the bill group
                        const isFirstInBill = index === 0;

                        transformedData.push({
                            id: `group-${srNo}`,
                            srNo: srNo++,
                            dateTime: isFirstInBill ? `${formattedDate} ${formattedTime}` : '',
                            billNo: isFirstInBill ? (group.billNumber === 'N/A' ? 'N/A' : group.billNumber) : '',
                            item: group.item,
                            size: group.size,
                            purity: group.purity,
                            remark: remark,
                            wt: group.weight,
                            groupId: `group-${groupId}`,
                            isFirstInGroup: isFirstInBill
                        });
                    });
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
        const remarkLower = remark?.toLowerCase() || '';
        switch (remarkLower) {
            case "settle":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "advance":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "sale":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            case "received":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            case "given":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "inward":
                return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
            case "outward":
                return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    // Print handler
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

        // Group data for print - maintain the same grouping
        const printGroupedData: { [key: string]: ClientReportEntry[] } = {};
        filteredData.forEach(entry => {
            if (!printGroupedData[entry.groupId]) {
                printGroupedData[entry.groupId] = [];
            }
            printGroupedData[entry.groupId].push(entry);
        });

        // Build the table rows with proper grouping
        let rows = '';
        let isFirstGroup = true;

        Object.keys(printGroupedData).forEach((groupId) => {
            const entries = printGroupedData[groupId];
            
            entries.forEach((entry, index) => {
                // Show separator between groups
                if (!isFirstGroup && index === 0) {
                    rows += `
                        <tr>
                            <td colspan="7" style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;background:#f0f0f0;">
                                ───────────────────────────────────────
                            </td>
                        </tr>
                    `;
                }
                
                rows += `
                    <tr>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${entry.srNo}</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                            ${entry.dateTime || ' '}
                        </td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;font-weight:${entry.billNo && entry.billNo !== 'N/A' && entry.billNo !== '' ? 'bold' : 'normal'};">
                            ${entry.billNo || ' '}
                        </td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
                            ${entry.item} (${entry.size})
                        </td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
                            ${entry.purity !== 'N/A' ? `${entry.purity}%` : 'N/A'}
                        </td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${entry.remark || 'N/A'}</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:${entry.wt > 0 ? '#16a34a' : entry.wt < 0 ? '#dc2626' : '#000'};">
                            ${entry.wt > 0 ? '+' : ''}${formatNumber(entry.wt)}
                        </td>
                    </tr>
                `;
            });
            
            isFirstGroup = false;
        });

        // Set the content with PDF Header
        printContainer.innerHTML = `
            <div style="max-width:1200px;margin:0 auto;font-family:Arial,sans-serif;padding:0;">
                <!-- PDF Header -->
                <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin:0;padding:0;font-size:11px;font-weight:bold;color:#a84b20;">
                        <span>॥ श्री गणेश प्रसन्न ॥</span>
                        <span>॥ श्री साई प्रसन्न ॥</span>
                    </div>
                    <div style="margin:1px 0 0 0;padding:0;font-size:20px;font-weight:bold;color:#c43d5c;line-height:1.1;">
                        मातोश्री चेन फॅक्टरी
                    </div>
                    <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#8b451f;line-height:1.2;">
                        आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
                    </div>
                    <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#a84b20;line-height:1.2;">
                        प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ९३०९३५५१३६
                    </div>
                    <div style="border-bottom:2px solid #c43d5c;margin:2px 0 3px 0;"></div>
                </div>

                <!-- Title -->
                <h2 style="text-align:center;margin:2px 0 2px 0;font-size:16px;color:#000;padding:0;">Client Report</h2>
                <p style="text-align:center;font-size:10px;color:#000;margin:0 0 2px 0;">
                    Client ID: ${id} | Generated: ${new Date().toLocaleString()}
                </p>

                <!-- Table -->
                <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
                    <thead>
                        <tr style="background:#785600;color:white;font-weight:600;">
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Bill No</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Item (Size)</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Purity</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Remark</th>
                            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">WT (G)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                    <tfoot>
                        <tr style="background:#f4f4f2;font-weight:bold;">
                            <td colspan="6" style="border:1px solid #000;padding:1px 2px;text-align:right;font-size:11px;color:#000;">Total:</td>
                            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(totalWt)}</td>
                        </tr>
                    </tfoot>
                </table>

                <!-- Footer -->
                <div style="margin-top:4px;padding-top:4px;border-top:2px solid #785600;text-align:center;">
                    <p style="font-size:10px;color:#000;margin:1px 0;">This is a system-generated report</p>
                    <div style="display:flex;justify-content:center;gap:10px;font-size:9px;color:#000;margin-top:1px;">
                        <span>Powered by Matoshree Gold</span>
                        <span>|</span>
                        <span>${new Date().toLocaleString()}</span>
                    </div>
                </div>
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
                #print-container .group-separator {
                    background: #f0f0f0 !important;
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

                        {/* Print Button */}
                        <button
                            onClick={handlePrint}
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

                {/* Custom Table with Grouping */}
                <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-700">
                                <thead className="bg-[#785600] dark:bg-[#5d4200]">
                                    <tr>
                                        <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                            Sr No.
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                            Date Time
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                            Bill No.
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                            Item (Size)
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                            Purity
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                            Remark
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                                            WT (G)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
                                    {filteredData.map((entry, index) => {
                                        // Check if this is a new group (first item in group)
                                        const isNewGroup = index === 0 || filteredData[index - 1].groupId !== entry.groupId;
                                        
                                        return (
                                            <tr 
                                                key={entry.id}
                                                className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'}
                                            >
                                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-center text-[#1a1c1b] dark:text-white">
                                                    {entry.srNo}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-[#1a1c1b] dark:text-white">
                                                    {entry.isFirstInGroup ? entry.dateTime : ''}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm">
                                                    <span className={`font-medium ${entry.isFirstInGroup && entry.billNo !== 'N/A' && entry.billNo !== '' ? 'text-[#785600] dark:text-amber-400' : 'text-gray-400'}`}>
                                                        {entry.isFirstInGroup ? (entry.billNo || 'N/A') : ''}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-[#1a1c1b] dark:text-white">
                                                            {entry.item}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            ({entry.size})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm font-mono text-[#1a1c1b] dark:text-white">
                                                    {entry.purity !== 'N/A' ? `${entry.purity}%` : 'N/A'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRemarkColor(entry.remark)}`}>
                                                        {entry.remark || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm font-mono font-bold text-right">
                                                    <span className={entry.wt > 0 ? 'text-green-600 dark:text-green-400' : entry.wt < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}>
                                                        {entry.wt > 0 ? '+' : ''}{formatNumber(entry.wt)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-100 dark:bg-slate-800">
                                    <tr>
                                        <td colSpan={6} className="px-3 py-3 text-sm font-bold text-right text-[#1a1c1b] dark:text-white">
                                            Total:
                                        </td>
                                        <td className="px-3 py-3 text-sm font-mono font-bold text-right text-[#1a1c1b] dark:text-white">
                                            {formatNumber(totalWt)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}