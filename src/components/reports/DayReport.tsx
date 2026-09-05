import React, { useState, useMemo } from 'react';
import { Search, Printer, Loader2, Calendar } from 'lucide-react';
import { useGetHeader } from '@/lib/api/headerapi';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetDayReport, DayReportData, NewStockItem, ClientDueDataItem } from '@/lib/api/dayreport';

// ======================================================
// HELPER FUNCTIONS
// ======================================================
const toNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const formatNumberDisplay = (value: unknown, minDecimals = 3): string => {
    if (value === null || value === undefined || value === '') return '0.000';
    const num = Number(value);
    if (!Number.isFinite(num)) return '0.000';

    const roundedClean = Number(Math.round(Number(num + 'e+6')) + 'e-6');
    const strVal = String(roundedClean);
    const decimalPart = strVal.includes('.') ? strVal.split('.')[1] : '';
    const actualDecimals = decimalPart.length;

    const decimals = Math.max(minDecimals, Math.min(actualDecimals, 4));
    return num.toFixed(decimals);
};

const getDefaultWeekRange = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
};

const formatDateForApi = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// ======================================================
// MAIN COMPONENT
// ======================================================
const DayReport: React.FC = () => {
    const getpdfheaderdata = useGetHeader();
    const [searchTerm, setSearchTerm] = useState('');

    // Default dates
    const [fromDate, setFromDate] = useState<Date | null>(() => getDefaultWeekRange().monday);
    const [toDate, setToDate] = useState<Date | null>(() => getDefaultWeekRange().sunday);

    const fromDateStr = useMemo(() => formatDateForApi(fromDate), [fromDate]);
    const toDateStr = useMemo(() => formatDateForApi(toDate), [toDate]);

    // Fetch data from API with active date filters
    const { data: apiResponse, isLoading: reportLoading, refetch } = useGetDayReport();

    // Safely extract raw report data
    const reportData: DayReportData | null = useMemo(() => {
        if (!apiResponse) return null;
        if ((apiResponse as any)?.data?.data) return (apiResponse as any).data.data;
        if ((apiResponse as any)?.data) return (apiResponse as any).data;
        return apiResponse as any;
    }, [apiResponse]);

    const summary = reportData?.summary || {
        totalProcessWeight: 0,
        totalProcessFineWeight: 0,
        totalSettlementWeight: 0,
        totalSettlementFineWeight: 0,
        totalClientDueWeight: 0,
        totalClientDueFineWeight: 0,
        totalNewStockWeight: 0,
        totalNewStockFineWeight: 0,
        totalBillsWeight: 0,
        totalBillsCustomerWeight: 0,
        totalBillsRemainingWeight: 0,
        counts: { process: 0, settlement: 0, clientDue: 0, newStock: 0, bills: 0 },
        byProcess: {
            tar: { totalWeight: 0, totalFineWeight: 0, count: 0 },
            box: { totalWeight: 0, totalFineWeight: 0, count: 0 },
            soldering: { totalWeight: 0, totalFineWeight: 0, count: 0 },
            joint: { totalWeight: 0, totalFineWeight: 0, count: 0 },
            cutting: { totalWeight: 0, totalFineWeight: 0, count: 0 },
            kunda: { totalWeight: 0, totalFineWeight: 0, count: 0 },
            melting: { totalWeight: 0, totalFineWeight: 0, count: 0 },
        },
    };

    const byProcess = summary.byProcess || {};

    const processList = useMemo(() => [
        { key: 'tar', label: 'Tar', data: byProcess.tar || { totalWeight: 0, totalFineWeight: 0, count: 0 } },
        { key: 'box', label: 'Box', data: byProcess.box || { totalWeight: 0, totalFineWeight: 0, count: 0 } },
        { key: 'soldering', label: 'Soldering', data: byProcess.soldering || { totalWeight: 0, totalFineWeight: 0, count: 0 } },
        { key: 'joint', label: 'Joint', data: byProcess.joint || { totalWeight: 0, totalFineWeight: 0, count: 0 } },
        { key: 'cutting', label: 'Cutting', data: byProcess.cutting || { totalWeight: 0, totalFineWeight: 0, count: 0 } },
        { key: 'kunda', label: 'Kunda', data: byProcess.kunda || { totalWeight: 0, totalFineWeight: 0, count: 0 } },
        { key: 'melting', label: 'Melting', data: byProcess.melting || { totalWeight: 0, totalFineWeight: 0, count: 0 } },
    ], [byProcess]);

    const newStockList: NewStockItem[] = useMemo(() => {
        return Array.isArray(reportData?.newStock) ? reportData.newStock : [];
    }, [reportData?.newStock]);

    const clientDueList: ClientDueDataItem[] = useMemo(() => {
        return Array.isArray(reportData?.clientDue) ? reportData.clientDue : [];
    }, [reportData?.clientDue]);

    // Handle date changes
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

    // Filter client due based on search
    const filteredClientDue = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return clientDueList;

        return clientDueList.filter(client =>
            (client.name && client.name.toLowerCase().includes(term)) ||
            (client.clientName && client.clientName.toLowerCase().includes(term)) ||
            (client.phoneNumber && client.phoneNumber.includes(term)) ||
            client.due.toString().includes(term)
        );
    }, [clientDueList, searchTerm]);

    // Filter new stock based on search
    const filteredNewStock = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return newStockList;

        return newStockList.filter(item =>
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.item && item.item.toLowerCase().includes(term)) ||
            (item.size && item.size.toLowerCase().includes(term)) ||
            (item.remark && item.remark.toLowerCase().includes(term)) ||
            toNumber(item.grossweight ?? item.grossWeight).toString().includes(term) ||
            toNumber(item.fineweight ?? item.fineWeight).toString().includes(term)
        );
    }, [newStockList, searchTerm]);

    // Calculate dynamic totals for New Stock
    const newStockTotals = useMemo(() => {
        const totalGross = filteredNewStock.reduce((sum, item) => sum + toNumber(item.grossweight ?? item.grossWeight ?? 0), 0);
        const totalFine = filteredNewStock.reduce((sum, item) => sum + toNumber(item.fineweight ?? item.fineWeight ?? 0), 0);
        return { totalGross, totalFine, count: filteredNewStock.length };
    }, [filteredNewStock]);

    // Print Handler
    const handlePrint = () => {
        const headerInfo = getpdfheaderdata?.data?.data || {};
        const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
        const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
        const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
        const leftInvocation = headerInfo.leftInvocation || '॥ श्री गणेश प्रसन्न ॥';
        const rightInvocation = headerInfo.rightInvocation || '॥ श्री साई प्रसन्न ॥';
        const description = headerInfo.description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';

        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';

        const processRowsHtml = processList.map(p => `
            <tr>
                <td style="border:1px solid #000;padding:4px 6px;">${p.label}</td>
                <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${formatNumberDisplay(p.data.totalWeight)}</td>
                <td style="border:1px solid #000;padding:4px 6px;text-align:right;font-weight:600;">${formatNumberDisplay(p.data.totalFineWeight)}</td>
                <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${p.data.count}</td>
            </tr>
        `).join('');

        const newStockRowsHtml = filteredNewStock.map((item, idx) => `
            <tr>
                <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${idx + 1}</td>
                <td style="border:1px solid #000;padding:4px 6px;">${item.name || item.item || '-'}</td>
                <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${formatNumberDisplay(item.grossweight ?? item.grossWeight)}</td>
                <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${item.purity !== null && item.purity !== undefined ? item.purity + '%' : '-'}</td>
                <td style="border:1px solid #000;padding:4px 6px;text-align:right;font-weight:600;">${formatNumberDisplay(item.fineweight ?? item.fineWeight)}</td>
                <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${item.remark || '-'}</td>
            </tr>
        `).join('');

        const clientDueRowsHtml = filteredClientDue.map((c, idx) => `
            <tr>
                <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${idx + 1}</td>
                <td style="border:1px solid #000;padding:4px 6px;">${c.name || c.clientName || '-'}</td>
                <td style="border:1px solid #000;padding:4px 6px;text-align:right;font-weight:600;">${formatNumberDisplay(c.due)}</td>
            </tr>
        `).join('');

        printContainer.innerHTML = `
            <div style="width:210mm;margin:0 auto;font-family:Arial,sans-serif;padding:8mm;box-sizing:border-box;">
                <div style="text-align:center;margin-bottom:12px;border-bottom:2px solid #785600;padding-bottom:6px;">
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:bold;color:#a84b20;">
                        <span>${leftInvocation}</span>
                        <span style="font-size:20px;color:#c43d5c;">${factoryName}</span>
                        <span>${rightInvocation}</span>
                    </div>
                    <div style="font-size:10px;margin-top:2px;">${description}</div>
                    <div style="font-size:10px;font-weight:bold;">${proprietorName} &nbsp;&nbsp; ${phoneNumbers}</div>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <h2 style="margin:0;font-size:15px;color:#785600;">Day Report</h2>
                    <div style="font-size:10px;font-weight:bold;">
                        ${fromDate && toDate ? `Date: ${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(toDate)}` : `Generated: ${new Date().toLocaleDateString('en-IN')}`}
                    </div>
                </div>

                <!-- Summary Cards -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
                    <div style="border:1px solid #d3c4af;padding:6px;border-radius:4px;background:#f9f9f7;">
                        <div style="font-size:9px;color:#666;">Total Process</div>
                        <div style="font-size:13px;font-weight:bold;">${formatNumberDisplay(summary.totalProcessWeight)} G</div>
                        <div style="font-size:9px;color:#785600;">Fine: ${formatNumberDisplay(summary.totalProcessFineWeight)} G</div>
                    </div>
                    <div style="border:1px solid #d3c4af;padding:6px;border-radius:4px;background:#f9f9f7;">
                        <div style="font-size:9px;color:#666;">Total Settlement</div>
                        <div style="font-size:13px;font-weight:bold;">${formatNumberDisplay(summary.totalSettlementWeight)} G</div>
                        <div style="font-size:9px;color:#785600;">Fine: ${formatNumberDisplay(summary.totalSettlementFineWeight)} G</div>
                    </div>
                    <div style="border:1px solid #d3c4af;padding:6px;border-radius:4px;background:#f9f9f7;">
                        <div style="font-size:9px;color:#666;">Client Due</div>
                        <div style="font-size:13px;font-weight:bold;color:#e67e22;">${formatNumberDisplay(summary.totalClientDueWeight)} G</div>
                    </div>
                    <div style="border:1px solid #d3c4af;padding:6px;border-radius:4px;background:#f9f9f7;">
                        <div style="font-size:9px;color:#666;">New Stock</div>
                        <div style="font-size:13px;font-weight:bold;">${formatNumberDisplay(summary.totalNewStockWeight || newStockTotals.totalGross)} G</div>
                        <div style="font-size:9px;color:#785600;">Fine: ${formatNumberDisplay(summary.totalNewStockFineWeight || newStockTotals.totalFine)} G</div>
                    </div>
                </div>

                <!-- Process Table -->
                <div style="margin-bottom:12px;">
                    <div style="background:#785600;color:white;padding:4px 8px;font-weight:bold;font-size:11px;">
                        Today's Process
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:10px;">
                        <thead>
                            <tr style="background:#f4f1ea;">
                                <th style="border:1px solid #000;padding:3px;text-align:left;">Process</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;">Gross WT (G)</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;">Fine WT (G)</th>
                                <th style="border:1px solid #000;padding:3px;text-align:center;">Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${processRowsHtml}
                            <tr style="font-weight:bold;background:#f4f1ea;">
                                <td style="border:1px solid #000;padding:4px 6px;">Total</td>
                                <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${formatNumberDisplay(summary.totalProcessWeight)}</td>
                                <td style="border:1px solid #000;padding:4px 6px;text-align:right;color:#785600;">${formatNumberDisplay(summary.totalProcessFineWeight)}</td>
                                <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${summary.counts?.process || 0}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- New Stock Table -->
                ${filteredNewStock.length > 0 ? `
                <div style="margin-bottom:12px;">
                    <div style="background:#785600;color:white;padding:4px 8px;font-weight:bold;font-size:11px;">
                        Today's New Stock (${filteredNewStock.length} items)
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:10px;">
                        <thead>
                            <tr style="background:#f4f1ea;">
                                <th style="border:1px solid #000;padding:3px;text-align:center;width:30px;">#</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;">Item Name</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;">Gross WT (G)</th>
                                <th style="border:1px solid #000;padding:3px;text-align:center;">Purity</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;">Fine WT (G)</th>
                                <th style="border:1px solid #000;padding:3px;text-align:center;">Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${newStockRowsHtml}
                            <tr style="font-weight:bold;background:#f4f1ea;">
                                <td colspan="2" style="border:1px solid #000;padding:4px 6px;">Total New Stock</td>
                                <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${formatNumberDisplay(newStockTotals.totalGross)}</td>
                                <td style="border:1px solid #000;padding:4px 6px;text-align:center;">-</td>
                                <td style="border:1px solid #000;padding:4px 6px;text-align:right;color:#785600;">${formatNumberDisplay(newStockTotals.totalFine)}</td>
                                <td style="border:1px solid #000;padding:4px 6px;text-align:center;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                ` : ''}

                <!-- Client Due Table -->
                ${filteredClientDue.length > 0 ? `
                <div style="margin-bottom:12px;">
                    <div style="background:#e67e22;color:white;padding:4px 8px;font-weight:bold;font-size:11px;">
                        Client Due (${filteredClientDue.length} clients)
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:10px;">
                        <thead>
                            <tr style="background:#f4f1ea;">
                                <th style="border:1px solid #000;padding:3px;text-align:center;width:30px;">#</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;">Client Name</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;">Due WT (G)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientDueRowsHtml}
                            <tr style="font-weight:bold;background:#f4f1ea;">
                                <td colspan="2" style="border:1px solid #000;padding:4px 6px;">Total Due</td>
                                <td style="border:1px solid #000;padding:4px 6px;text-align:right;color:#e67e22;">${formatNumberDisplay(summary.totalClientDueWeight)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                ` : ''}

                <!-- Footer -->
                <div style="text-align:center;font-size:8px;color:#999;border-top:1px solid #ddd;padding-top:8px;margin-top:8px;">
                    Generated on ${new Date().toLocaleString('en-IN')}
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @page { margin: 4mm; }
            @media print {
                body * { visibility: hidden; }
                #print-container, #print-container * { visibility: visible; }
                #print-container {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    background: white !important;
                    z-index: 99999 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(printContainer);

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                if (document.body.contains(printContainer)) document.body.removeChild(printContainer);
                if (document.head.contains(style)) document.head.removeChild(style);
            }, 1000);
        }, 300);
    };

    if (reportLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#785600]" />
                    <p className="mt-4 font-semibold text-[#785600] dark:text-amber-400">Loading Day Report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-12">
            {/* Top Sticky Header */}
            <div className="sticky top-0 z-30 border-b border-[#d3c4af]/30 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-4 md:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Title */}
                    <div>
                        <h1 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                            Day Report
                        </h1>
                    </div>

                    {/* Right Controls */}
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        {/* Search */}
                        <div className="relative w-full sm:w-44 md:w-52">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                            <input
                                type="text"
                                placeholder="Search items, clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        {/* Date Pickers */}
                        {/* <div className="flex items-center gap-2">
                            <GenericWeeklyDatePicker
                                id="from-date-dayreport"
                                mode="from"
                                placeholder="From Date"
                                initialDates={fromDate ? [fromDate] : []}
                                onDateChange={handleFromDateChange}
                                className="w-28 sm:w-32 md:w-36"
                            />
                            <GenericWeeklyDatePicker
                                id="to-date-dayreport"
                                mode="to"
                                placeholder="To Date"
                                initialDates={toDate ? [toDate] : []}
                                onDateChange={handleToDateChange}
                                className="w-28 sm:w-32 md:w-36"
                            />
                        </div> */}

                        {/* Print Button */}
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5d4200]"
                        >
                            <Printer className="h-4 w-4" />
                            <span>Print</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-3 sm:p-4 md:p-6 space-y-4">
              

                {/* 3 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    {/* 1. PROCESS Panel */}
                    <div className="flex flex-col rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                            <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                                TODAY'S PROCESS
                            </span>
                        </div>
                        <div className="overflow-x-auto flex-1 flex flex-col">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <th className="px-3 py-2.5">Process</th>
                                        <th className="px-3 py-2.5 text-right">Gross (G)</th>
                                        <th className="px-3 py-2.5 text-right">Fine (G)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                                    {processList.map((p) => (
                                        <tr key={p.key} className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                                            <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                                                {p.label}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[#1a1c1b] dark:text-slate-100">
                                                {formatNumberDisplay(p.data.totalWeight)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono font-bold text-[#785600] dark:text-amber-400">
                                                {formatNumberDisplay(p.data.totalFineWeight)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 dark:bg-slate-800/70 font-bold">
                                        <td className="px-3 py-2.5 text-[#1a1c1b] dark:text-white">Total</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1a1c1b] dark:text-white">
                                            {formatNumberDisplay(summary.totalProcessWeight)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#785600] dark:text-amber-400">
                                            {formatNumberDisplay(summary.totalProcessFineWeight)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* 2. SETTLEMENT & NEW STOCK Panel */}
                    <div className="flex flex-col gap-4">
                        {/* Settlement Summary */}
                        <div className="flex flex-col rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                            <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                                <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                                    TODAY'S SETTLEMENT
                                </span>
                            </div>
                            <div className="overflow-x-auto flex-1 flex flex-col">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead>
                                        <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            <th className="px-3 py-2.5">Type</th>
                                            <th className="px-3 py-2.5 text-right">Weight (G)</th>
                                            <th className="px-3 py-2.5 text-right">Fine (G)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                                        <tr className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                                            <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                                                Settlement
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono font-bold text-[#1a1c1b] dark:text-slate-100">
                                                {formatNumberDisplay(summary.totalSettlementWeight)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono font-bold text-[#785600] dark:text-amber-400">
                                                {formatNumberDisplay(summary.totalSettlementFineWeight)}
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 dark:bg-slate-800/70 font-bold">
                                            <td className="px-3 py-2.5 text-[#1a1c1b] dark:text-white">Total Settlement</td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[#1a1c1b] dark:text-white">
                                                {formatNumberDisplay(summary.totalSettlementWeight)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[#785600] dark:text-amber-400">
                                                {formatNumberDisplay(summary.totalSettlementFineWeight)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* New Stock List */}
                        <div className="flex flex-col rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                            <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 flex items-center justify-between dark:bg-slate-800/60">
                                <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                                    TODAY'S NEW STOCK
                                </span>

                            </div>
                            <div className="overflow-x-auto flex-1 flex flex-col max-h-[360px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            <th className="w-6 px-2.5 py-2 text-center">Sr No.</th>
                                            <th className="px-2.5 py-2">Item</th>
                                            <th className="px-2.5 py-2 text-right">Gross (G)</th>
                                            <th className="px-2.5 py-2 text-center">Purity</th>
                                            <th className="px-2.5 py-2 text-right">Fine (G)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#d3c4af]/10 dark:divide-slate-800">
                                        {filteredNewStock.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-6 text-center text-xs text-gray-500">
                                                    No new stock records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredNewStock.map((item, idx) => (
                                                <tr key={item.id || idx} className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                                                    <td className="px-2.5 py-2 text-center text-[#817563] dark:text-slate-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-2.5 py-2 text-[#1a1c1b] dark:text-slate-200 font-medium">
                                                        <div>{item.name || item.item || '-'}</div>
                                                       
                                                    </td>
                                                    <td className="px-2.5 py-2 text-right font-mono text-[#1a1c1b] dark:text-slate-100">
                                                        {formatNumberDisplay(item.grossweight ?? item.grossWeight)}
                                                    </td>
                                                    <td className="px-2.5 py-2 text-center text-[#817563] dark:text-slate-400">
                                                        {item.purity !== null && item.purity !== undefined ? `${item.purity}%` : '-'}
                                                    </td>
                                                    <td className="px-2.5 py-2 text-right font-mono font-bold text-[#785600] dark:text-amber-400">
                                                        {formatNumberDisplay(item.fineweight ?? item.fineWeight)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 dark:bg-slate-800/70 font-bold">
                                            <td colSpan={2} className="px-2.5 py-2 text-[#1a1c1b] dark:text-white">
                                                Total New Stock
                                            </td>
                                            <td className="px-2.5 py-2 text-right font-mono text-[#1a1c1b] dark:text-white">
                                                {formatNumberDisplay(newStockTotals.totalGross)}
                                            </td>
                                            <td className="px-2.5 py-2 text-center">-</td>
                                            <td className="px-2.5 py-2 text-right font-mono text-[#785600] dark:text-amber-400">
                                                {formatNumberDisplay(newStockTotals.totalFine)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 3. CLIENT DUE & BILLS Panel */}
                    <div className="flex flex-col rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                            <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                                CLIENT DUE & BILLS
                            </span>
                        </div>
                        <div className="overflow-x-auto flex-1 flex flex-col">
                            {/* Bills Section */}
                            <div className="p-3 border-b border-[#d3c4af]/20 dark:border-slate-700 bg-white dark:bg-slate-900/40">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400 mb-2 flex items-center justify-between">
                                    <span>Today's Bills</span>

                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-[#4f4535] dark:text-slate-300 font-medium">Total Bills</span>
                                        <span className="font-bold text-[#1a1c1b] dark:text-white font-mono">
                                            {formatNumberDisplay(summary.totalBillsWeight)} G
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#4f4535] dark:text-slate-300">Customer</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400 font-mono">
                                            {formatNumberDisplay(summary.totalBillsCustomerWeight)} G
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#4f4535] dark:text-slate-300">Remaining</span>
                                        <span className="font-semibold text-red-600 dark:text-red-400 font-mono">
                                            {formatNumberDisplay(summary.totalBillsRemainingWeight)} G
                                        </span>
                                    </div>
                                </div>
                            </div>

                       
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayReport;