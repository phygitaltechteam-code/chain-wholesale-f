import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Loader2, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { useGetHeader } from '@/lib/api/headerapi';
import { useGetRealTimeGold } from '@/lib/api/realtimegold';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';

// ======================================================
// INTERFACES
// ======================================================
export interface GoldItem {
    id?: string | number;
    name: string;
    grossweight?: number;
    grossWeight: number;
    purity: number | null;
    fineweight?: number;
    fineWeight: number;
    category?: string;
    type?: 'stock' | 'process';
}

export interface CategoryGroup {
    id: string;
    name: string;
    type: 'Stock' | 'Process';
    items: GoldItem[];
    totalGrossWeight: number;
    totalFineWeight: number;
    count: number;
}

export interface SummaryData {
    totalStockWeight: number;
    totalStockFineWeight: number;
    totalProcessWeight: number;
    totalProcessFineWeight: number;
    totalScrapWeight?: number;
    totalScrapFineWeight?: number;
    totalCuttingScrapWeight?: number;
    totalCuttingScrapFineWeight?: number;
    grandTotalWeight: number;
    grandTotalFineWeight: number;
    stockItemsCount: number;
    processItemsCount: number;
    scrapItemsCount?: number;
    cuttingScrapItemsCount?: number;
    totalItemsCount: number;
    byProcess?: Record<string, { totalWeight: number; totalFineWeight: number; count: number }>;
}

interface ApiStockData {
    stock?: GoldItem[];
    tarStock?: GoldItem[];
    boxStock?: GoldItem[];
    scrap?: GoldItem[];
    cuttingScrap?: GoldItem[];
}

interface ApiProcessData {
    tar?: GoldItem[];
    box?: GoldItem[];
    soldering?: GoldItem[];
    joint?: GoldItem[];
    cutting?: GoldItem[];
    kunda?: GoldItem[];
    melting?: GoldItem[];
    all?: GoldItem[];
}

interface ApiResponse {
    statusCode?: number;
    status?: boolean;
    message?: string;
    data?: {
        summary?: SummaryData;
        stock?: GoldItem[];
        stocks?: ApiStockData;
        process?: ApiProcessData | GoldItem[];
        processes?: ApiProcessData;
        all?: GoldItem[];
    };
    summary?: SummaryData;
    stock?: GoldItem[];
    stocks?: ApiStockData;
    process?: ApiProcessData | GoldItem[];
    processes?: ApiProcessData;
    all?: GoldItem[];
    errors?: null;
}

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

const calculateAvgPurity = (gross: number, fine: number): string => {
    if (!gross || gross <= 0 || !fine || fine <= 0) return '0.00';
    const purity = (fine / gross) * 100;
    return purity.toFixed(2);
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

const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatDateForApi = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Map items into structured categories
const buildCategoryGroups = (data: any | undefined): CategoryGroup[] => {
    if (!data) return [];

    const groups: CategoryGroup[] = [];

    const normalizeItem = (item: any, type: 'stock' | 'process', categoryName: string): GoldItem => {
        const gw = toNumber(item.grossWeight ?? item.grossweight ?? item.due ?? 0);
        const fw = toNumber(item.fineWeight ?? item.fineweight ?? item.due ?? 0);
        const itemName = item.clientName || item.name || 'Unnamed Item';
        return {
            id: item.id || `${categoryName}-${itemName}-${gw}-${fw}`,
            name: itemName,
            grossWeight: gw,
            grossweight: gw,
            fineWeight: fw,
            fineweight: fw,
            purity: item.purity !== undefined && item.purity !== null ? toNumber(item.purity) : null,
            category: categoryName,
            type,
        };
    };

    const addGroup = (id: string, name: string, type: 'Stock' | 'Process', rawItems: any[] | undefined) => {
        if (!rawItems || rawItems.length === 0) return;
        const items = rawItems.map(i => normalizeItem(i, type === 'Stock' ? 'stock' : 'process', name));
        const totalGrossWeight = items.reduce((sum, i) => sum + i.grossWeight, 0);
        const totalFineWeight = items.reduce((sum, i) => sum + i.fineWeight, 0);

        groups.push({
            id,
            name,
            type,
            items,
            totalGrossWeight,
            totalFineWeight,
            count: items.length,
        });
    };

    // 1. Stock Data Categories
    if (data.stocks) {
        addGroup('stock-gold', 'Gold Stock', 'Stock', data.stocks.gold || data.gold);
        addGroup('stock-ready', 'Stock (Ready)', 'Stock', data.stocks.stock);
        addGroup('stock-scrap', 'Scrap', 'Stock', data.stocks.scrap);
        addGroup('stock-cutting-scrap', 'Cutting Scrap', 'Stock', data.stocks.cuttingScrap);
        addGroup('stock-tar', 'Tar Stock', 'Stock', data.stocks.tarStock);
        addGroup('stock-box', 'Box Stock', 'Stock', data.stocks.boxStock);
    } else {
        if (data.gold) {
            addGroup('stock-gold', 'Gold Stock', 'Stock', data.gold);
        }
        if (Array.isArray(data.stock)) {
            // Fallback grouping by name keywords for stock items
            const scrapItems: GoldItem[] = [];
            const cuttingScrapItems: GoldItem[] = [];
            const tarStockItems: GoldItem[] = [];
            const boxStockItems: GoldItem[] = [];
            const generalStockItems: GoldItem[] = [];

            data.stock.forEach((item: any) => {
                const upper = (item.name || '').toUpperCase();
                if (upper.includes('CUTTING SCRAP')) {
                    cuttingScrapItems.push(item);
                } else if (upper.includes('SCRAP')) {
                    scrapItems.push(item);
                } else if (upper.includes('TAR STOCK')) {
                    tarStockItems.push(item);
                } else if (upper.includes('BOX STOCK')) {
                    boxStockItems.push(item);
                } else {
                    generalStockItems.push(item);
                }
            });

            addGroup('stock-ready', 'Stock (Ready)', 'Stock', generalStockItems);
            addGroup('stock-scrap', 'Scrap', 'Stock', scrapItems);
            addGroup('stock-cutting-scrap', 'Cutting Scrap', 'Stock', cuttingScrapItems);
            addGroup('stock-tar', 'Tar Stock', 'Stock', tarStockItems);
            addGroup('stock-box', 'Box Stock', 'Stock', boxStockItems);
        }
    }

    // 2. Process Data Categories
    const processDataObj = data.processes || (typeof data.process === 'object' && !Array.isArray(data.process) ? data.process : null);

    if (processDataObj) {
        addGroup('process-melting', 'Melting Process', 'Process', processDataObj.melting);
        addGroup('process-tar', 'Tar Process', 'Process', processDataObj.tar);
        addGroup('process-box', 'Box Process', 'Process', processDataObj.box);
        addGroup('process-kunda', 'Kunda Process', 'Process', processDataObj.kunda);
        addGroup('process-soldering', 'Soldering Process', 'Process', processDataObj.soldering);
        addGroup('process-joint', 'Joint Process', 'Process', processDataObj.joint);
        addGroup('process-cutting', 'Cutting Process', 'Process', processDataObj.cutting);
    } else if (Array.isArray(data.process)) {
        // Fallback grouping by name keywords for process items
        const meltingItems: GoldItem[] = [];
        const tarItems: GoldItem[] = [];
        const boxItems: GoldItem[] = [];
        const kundaItems: GoldItem[] = [];
        const solderingItems: GoldItem[] = [];
        const jointItems: GoldItem[] = [];
        const cuttingItems: GoldItem[] = [];
        const otherProcessItems: GoldItem[] = [];

        data.process.forEach((item: any) => {
            const upper = (item.name || '').toUpperCase();
            if (upper.includes('MELTING')) meltingItems.push(item);
            else if (upper.includes('TAR')) tarItems.push(item);
            else if (upper.includes('BOX')) boxItems.push(item);
            else if (upper.includes('KUNDA')) kundaItems.push(item);
            else if (upper.includes('SOLDER')) solderingItems.push(item);
            else if (upper.includes('JOINT')) jointItems.push(item);
            else if (upper.includes('CUTTING')) cuttingItems.push(item);
            else otherProcessItems.push(item);
        });

        addGroup('process-melting', 'Melting Process', 'Process', meltingItems);
        addGroup('process-tar', 'Tar Process', 'Process', tarItems);
        addGroup('process-box', 'Box Process', 'Process', boxItems);
        addGroup('process-kunda', 'Kunda Process', 'Process', kundaItems);
        addGroup('process-soldering', 'Soldering Process', 'Process', solderingItems);
        addGroup('process-joint', 'Joint Process', 'Process', jointItems);
        addGroup('process-cutting', 'Cutting Process', 'Process', cuttingItems);
        addGroup('process-other', 'Other Process', 'Process', otherProcessItems);
    }

    // 3. Client Due Data Categories
    const clientDueItems =
        data.clientDues ||
        data.clientDue ||
        data.client_due ||
        data.stocks?.clientDues ||
        data.stocks?.clientDue;
    if (clientDueItems && Array.isArray(clientDueItems)) {
        const activeDueItems = clientDueItems
            .filter((i: any) => {
                const dueVal = toNumber(i.due ?? i.fineWeight ?? i.fineweight ?? i.grossWeight ?? i.grossweight ?? 0);
                return dueVal > 0;
            })
            .map((i: any) => {
                const dueVal = toNumber(i.due ?? i.fineWeight ?? i.fineweight ?? i.grossWeight ?? i.grossweight ?? 0);
                const clientName = i.clientName || i.name || 'Unnamed Client';
                return {
                    id: i.id || `client-due-${clientName}-${dueVal}`,
                    name: clientName,
                    grossWeight: 0,
                    grossweight: 0,
                    fineWeight: dueVal,
                    fineweight: dueVal,
                    purity: null,
                    category: 'Client Due',
                    type: 'Stock' as const,
                };
            });

        if (activeDueItems.length > 0) {
            const totalDue = activeDueItems.reduce((sum, i) => sum + i.fineWeight, 0);
            groups.push({
                id: 'client-due',
                name: 'Client Due',
                type: 'Stock',
                items: activeDueItems,
                totalGrossWeight: 0,
                totalFineWeight: totalDue,
                count: activeDueItems.length,
            });
        }
    }

    return groups;
};

// ======================================================
// MAIN COMPONENT
// ======================================================
const RealTimeGoldReport: React.FC = () => {
    const getpdfheaderdata = useGetHeader();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Default dates
    const [fromDate, setFromDate] = useState<Date | null>(() => getDefaultWeekRange().monday);
    const [toDate, setToDate] = useState<Date | null>(() => getDefaultWeekRange().sunday);

    const fromDateStr = useMemo(() => formatDateForApi(fromDate), [fromDate]);
    const toDateStr = useMemo(() => formatDateForApi(toDate), [toDate]);

    const { data: goldData, isLoading, isError, refetch } = useGetRealTimeGold(fromDateStr, toDateStr);

    // Safely extract raw data regardless of Axios response or direct payload nesting
    const rawData = useMemo(() => {
        if (!goldData) return undefined;
        if ((goldData as any)?.data?.data) return (goldData as any).data.data;
        if ((goldData as any)?.data) return (goldData as any).data;
        return goldData;
    }, [goldData]);

    const summaryFromApi = rawData?.summary;

    // Build category groups
    const categoryGroups = useMemo(() => buildCategoryGroups(rawData), [rawData]);

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

    // Toggle expansion of a category row
    const toggleRow = (groupId: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    // Filter categories and inner items based on search term
    const filteredGroups = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return categoryGroups;

        return categoryGroups
            .map(group => {
                const groupMatches = group.name.toLowerCase().includes(term);
                const matchingItems = group.items.filter(item =>
                    item.name.toLowerCase().includes(term) ||
                    item.grossWeight.toString().includes(term) ||
                    item.fineWeight.toString().includes(term) ||
                    (item.purity !== null && item.purity.toString().includes(term))
                );

                if (groupMatches) {
                    return group;
                }

                if (matchingItems.length > 0) {
                    return {
                        ...group,
                        items: matchingItems,
                        totalGrossWeight: matchingItems.reduce((s, i) => s + i.grossWeight, 0),
                        totalFineWeight: matchingItems.reduce((s, i) => s + i.fineWeight, 0),
                        count: matchingItems.length,
                    };
                }

                return null;
            })
            .filter((g): g is CategoryGroup => g !== null);
    }, [categoryGroups, searchTerm]);

    // Auto expand matching rows on search
    useEffect(() => {
        if (searchTerm.trim()) {
            const matchIds = filteredGroups.map(g => g.id);
            setExpandedRows(new Set(matchIds));
        }
    }, [searchTerm, filteredGroups]);

    // Segment into 3 columns
    const stockGroups = useMemo(() => {
        return filteredGroups.filter(g => g.type === 'Stock' && g.id !== 'client-due');
    }, [filteredGroups]);

    const processGroups = useMemo(() => {
        return filteredGroups.filter(g => g.type === 'Process');
    }, [filteredGroups]);

    const clientDueGroup = useMemo(() => {
        return filteredGroups.find(g => g.id === 'client-due');
    }, [filteredGroups]);

    const stockTotals = useMemo(() => {
        const gross = stockGroups.reduce((s, g) => s + g.totalGrossWeight, 0);
        const fine = stockGroups.reduce((s, g) => s + g.totalFineWeight, 0);
        return { gross, fine, count: stockGroups.reduce((s, g) => s + g.count, 0) };
    }, [stockGroups]);

    const processTotals = useMemo(() => {
        const gross = processGroups.reduce((s, g) => s + g.totalGrossWeight, 0);
        const fine = processGroups.reduce((s, g) => s + g.totalFineWeight, 0);
        return { gross, fine, count: processGroups.reduce((s, g) => s + g.count, 0) };
    }, [processGroups]);

    const clientDueTotal = useMemo(() => {
        const fine = clientDueGroup ? clientDueGroup.totalFineWeight : 0;
        return { fine, count: clientDueGroup ? clientDueGroup.count : 0 };
    }, [clientDueGroup]);

    // Calculate Totals & Purity
    const grandTotals = useMemo(() => {
        const totalGrossWeight = stockTotals.gross + processTotals.gross;
        const totalFineWeight = stockTotals.fine + processTotals.fine + clientDueTotal.fine;
        const totalItems = stockTotals.count + processTotals.count + clientDueTotal.count;

        return {
            totalGrossWeight,
            totalFineWeight,
            totalItems,
            stockGrossWeight: stockTotals.gross,
            stockFineWeight: stockTotals.fine,
            stockAvgPurity: calculateAvgPurity(stockTotals.gross, stockTotals.fine),
            processGrossWeight: processTotals.gross,
            processFineWeight: processTotals.fine,
            processAvgPurity: calculateAvgPurity(processTotals.gross, processTotals.fine),
            clientDueFineWeight: clientDueTotal.fine,
        };
    }, [stockTotals, processTotals, clientDueTotal]);

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

        let categoryTablesHtml = '';
        filteredGroups.forEach(group => {
            const rowsHtml = group.items.map((item, idx) => `
                <tr>
                    <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${idx + 1}</td>
                    <td style="border:1px solid #000;padding:4px 6px;text-align:left;">${item.name}</td>
                    <td style="border:1px solid #000;padding:4px 6px;text-align:right;">${group.id === 'client-due' ? '-' : formatNumberDisplay(item.grossWeight)}</td>
                    <td style="border:1px solid #000;padding:4px 6px;text-align:center;">${group.id === 'client-due' || item.purity === null ? '-' : formatNumberDisplay(item.purity, 2) + '%'}</td>
                    <td style="border:1px solid #000;padding:4px 6px;text-align:right;font-weight:600;">${formatNumberDisplay(item.fineWeight)}</td>
                </tr>
            `).join('');

            const catPurity = calculateAvgPurity(group.totalGrossWeight, group.totalFineWeight);

            categoryTablesHtml += `
                <div style="margin-bottom:12px;page-break-inside:avoid;">
                    <div style="background:#f4f4f2;padding:4px 8px;font-weight:bold;font-size:11px;border:1px solid #000;display:flex;justify-content:space-between;">
                        <span>${group.name}</span>
                        <span>${group.id === 'client-due' ? `Due: ${formatNumberDisplay(group.totalFineWeight)} G` : `Gross: ${formatNumberDisplay(group.totalGrossWeight)} G | Avg Purity: ${catPurity}% | Fine: ${formatNumberDisplay(group.totalFineWeight)} G`} | Items: ${group.count}</span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:-1px;">
                        <thead>
                            <tr style="background:#785600;color:white;">
                                <th style="border:1px solid #000;padding:3px;width:35px;text-align:center;">#</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;">Item Name</th>
                                <th style="border:1px solid #000;padding:3px;width:80px;text-align:right;">Gross WT (G)</th>
                                <th style="border:1px solid #000;padding:3px;width:60px;text-align:center;">Purity</th>
                                <th style="border:1px solid #000;padding:3px;width:80px;text-align:right;">Fine WT (G)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
        });

        const grandPurity = calculateAvgPurity(grandTotals.totalGrossWeight, grandTotals.totalFineWeight);

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
                    <h2 style="margin:0;font-size:15px;color:#785600;">Real Time Gold Report</h2>
                    <div style="font-size:10px;font-weight:bold;">
                        ${fromDate && toDate ? `Date: ${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(toDate)}` : `Generated: ${new Date().toLocaleDateString('en-IN')}`}
                    </div>
                </div>

                <!-- Grand Summary Box -->
                <div style="display:flex;justify-content:space-around;background:#fff8e6;border:1px solid #785600;padding:6px;margin-bottom:12px;font-size:11px;font-weight:bold;">
                    <div>Grand Total Gross: ${formatNumberDisplay(grandTotals.totalGrossWeight)} G</div>
                    <div>Avg Purity: ${grandPurity}%</div>
                    <div>Grand Total Fine: ${formatNumberDisplay(grandTotals.totalFineWeight)} G</div>
                    <div>Total Items: ${grandTotals.totalItems}</div>
                </div>

                ${categoryTablesHtml}
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

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#785600]" />
                    <p className="mt-4 text-[#785600] dark:text-amber-400">Loading Real Time Gold Report...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400">Failed to load Real Time Gold Report.</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d4200]"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950 pb-12">
            {/* Top Sticky Header */}
            <div className="sticky top-0 z-30 border-b border-[#d3c4af]/30 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-4 md:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Title */}
                    <div>
                        <h1 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                            Real Time Gold Report
                        </h1>
                        <p className="text-xs text-[#817563] dark:text-slate-400">
                            Live breakdown of Stock, Manufacturing processes, and Client Dues
                        </p>
                    </div>

                    {/* Right Controls: Search, Date Pickers, Print */}
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        {/* Search */}
                        <div className="relative w-full sm:w-44 md:w-52">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        {/* From & To Date Pickers */}
                        <div className="flex items-center gap-2">
                            <GenericWeeklyDatePicker
                                id="from-date-gold"
                                mode="from"
                                placeholder="From Date"
                                initialDates={fromDate ? [fromDate] : []}
                                onDateChange={handleFromDateChange}
                                className="w-28 sm:w-32 md:w-36"
                            />
                            <GenericWeeklyDatePicker
                                id="to-date-gold"
                                mode="to"
                                placeholder="To Date"
                                initialDates={toDate ? [toDate] : []}
                                onDateChange={handleToDateChange}
                                className="w-28 sm:w-32 md:w-36"
                            />
                        </div>

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
                {/* Simple Summary Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                Total Gross WT
                            </span>
                            <span className="text-lg font-bold text-black dark:text-white">
                                {formatNumberDisplay(grandTotals.totalGrossWeight)} G
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                Avg Purity
                            </span>
                            <span className="text-lg font-bold text-black dark:text-white">
                                {calculateAvgPurity(grandTotals.totalGrossWeight, grandTotals.totalFineWeight)}%
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                Total Fine WT
                            </span>
                            <span className="text-lg font-bold text-[#785600] dark:text-amber-400">
                                {formatNumberDisplay(grandTotals.totalFineWeight)} G
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3 Horizontal Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    {/* 1. GOLD & STOCK Panel */}
                    <div className="flex flex-col rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                            <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                                GOLD & STOCK
                            </span>
                        </div>
                        <div className="overflow-x-auto flex-1 flex flex-col">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <th className="w-7 px-2 py-2.5 text-center"></th>
                                        <th className="px-3 py-2.5">Category</th>
                                        <th className="px-3 py-2.5 text-right">Gross WT (G)</th>
                                        <th className="px-3 py-2.5 text-right">Fine WT (G)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                                    {stockGroups.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-6 text-center text-xs text-gray-500">
                                                No stock data found.
                                            </td>
                                        </tr>
                                    ) : (
                                        stockGroups.map((group) => {
                                            const isExpanded = expandedRows.has(group.id);
                                            return (
                                                <React.Fragment key={group.id}>
                                                    <tr
                                                        onClick={() => toggleRow(group.id)}
                                                        className={`cursor-pointer transition-colors ${
                                                            isExpanded ? 'bg-[#785600]/10 dark:bg-amber-900/20' : 'hover:bg-[#785600]/5 dark:hover:bg-slate-800/40'
                                                        }`}
                                                    >
                                                        <td className="px-2 py-2.5 text-center">
                                                            <div className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#785600]/10 text-[#785600] dark:bg-amber-400/20 dark:text-amber-400">
                                                                {isExpanded ? (
                                                                    <ChevronDown className="h-3 w-3" />
                                                                ) : (
                                                                    <ChevronRight className="h-3 w-3" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                                                            {group.name}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-[#1a1c1b] dark:text-slate-100">
                                                            {formatNumberDisplay(group.totalGrossWeight)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-[#785600] dark:text-amber-400">
                                                            {formatNumberDisplay(group.totalFineWeight)}
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Sub-rows */}
                                                    {isExpanded &&
                                                        group.items.map((item, itemIdx) => (
                                                            <tr
                                                                key={item.id || `${group.id}-${itemIdx}`}
                                                                className="border-b border-[#d3c4af]/10 bg-[#fcfbf9]/60 hover:bg-[#f5f3ef] dark:bg-slate-900/40 dark:hover:bg-slate-800/40 text-xs"
                                                            >
                                                                <td className="px-2 py-2 text-center text-[#817563] dark:text-slate-400">
                                                                    {itemIdx + 1}
                                                                </td>
                                                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                                    {item.name}
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                                                                    {formatNumberDisplay(item.grossWeight)}
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-mono font-semibold text-[#785600] dark:text-amber-400">
                                                                    {formatNumberDisplay(item.fineWeight)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 dark:bg-slate-800/70 font-bold">
                                        <td colSpan={2} className="px-3 py-2.5 text-[#1a1c1b] dark:text-white">
                                            Total Stock
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1a1c1b] dark:text-white">
                                            {formatNumberDisplay(stockTotals.gross)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#785600] dark:text-amber-400">
                                            {formatNumberDisplay(stockTotals.fine)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* 2. MANUFACTURING Panel */}
                    <div className="flex flex-col rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                            <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                                MANUFACTURING
                            </span>
                        </div>
                        <div className="overflow-x-auto flex-1 flex flex-col">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <th className="w-7 px-2 py-2.5 text-center"></th>
                                        <th className="px-3 py-2.5">Process</th>
                                        <th className="px-3 py-2.5 text-right">Gross WT (G)</th>
                                        <th className="px-3 py-2.5 text-right">Fine WT (G)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                                    {processGroups.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-6 text-center text-xs text-gray-500">
                                                No manufacturing data found.
                                            </td>
                                        </tr>
                                    ) : (
                                        processGroups.map((group) => {
                                            const isExpanded = expandedRows.has(group.id);
                                            return (
                                                <React.Fragment key={group.id}>
                                                    <tr
                                                        onClick={() => toggleRow(group.id)}
                                                        className={`cursor-pointer transition-colors ${
                                                            isExpanded ? 'bg-[#785600]/10 dark:bg-amber-900/20' : 'hover:bg-[#785600]/5 dark:hover:bg-slate-800/40'
                                                        }`}
                                                    >
                                                        <td className="px-2 py-2.5 text-center">
                                                            <div className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#785600]/10 text-[#785600] dark:bg-amber-400/20 dark:text-amber-400">
                                                                {isExpanded ? (
                                                                    <ChevronDown className="h-3 w-3" />
                                                                ) : (
                                                                    <ChevronRight className="h-3 w-3" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                                                            {group.name}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-[#1a1c1b] dark:text-slate-100">
                                                            {formatNumberDisplay(group.totalGrossWeight)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-[#785600] dark:text-amber-400">
                                                            {formatNumberDisplay(group.totalFineWeight)}
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Sub-rows */}
                                                    {isExpanded &&
                                                        group.items.map((item, itemIdx) => (
                                                            <tr
                                                                key={item.id || `${group.id}-${itemIdx}`}
                                                                className="border-b border-[#d3c4af]/10 bg-[#fcfbf9]/60 hover:bg-[#f5f3ef] dark:bg-slate-900/40 dark:hover:bg-slate-800/40 text-xs"
                                                            >
                                                                <td className="px-2 py-2 text-center text-[#817563] dark:text-slate-400">
                                                                    {itemIdx + 1}
                                                                </td>
                                                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                                                    {item.name}
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                                                                    {formatNumberDisplay(item.grossWeight)}
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-mono font-semibold text-[#785600] dark:text-amber-400">
                                                                    {formatNumberDisplay(item.fineWeight)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 dark:bg-slate-800/70 font-bold">
                                        <td colSpan={2} className="px-3 py-2.5 text-[#1a1c1b] dark:text-white">
                                            Total Process
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1a1c1b] dark:text-white">
                                            {formatNumberDisplay(processTotals.gross)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#785600] dark:text-amber-400">
                                            {formatNumberDisplay(processTotals.fine)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* 3. CLIENT DUE Panel */}
                    <div className="flex flex-col rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                            <span className="text-xs font-black tracking-widest text-[#1a1c1b] uppercase dark:text-white">
                                CLIENT DUE
                            </span>
                        </div>
                        <div className="overflow-x-auto flex-1 flex flex-col">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <th className="w-8 px-2 py-2.5 text-center">Sr.</th>
                                        <th className="px-3 py-2.5">Client Name</th>
                                        <th className="px-3 py-2.5 text-right">Due WT (G)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                                    {clientDueGroup && clientDueGroup.items.length > 0 ? (
                                        clientDueGroup.items.map((item, idx) => (
                                            <tr key={item.id || idx} className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                                                <td className="px-2 py-2.5 text-center text-xs text-[#817563] dark:text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                                                    {item.name}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-[#785600] dark:text-amber-400">
                                                    {formatNumberDisplay(item.fineWeight)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-6 text-center text-xs text-gray-500">
                                                No client due records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 dark:bg-slate-800/70 font-bold">
                                        <td colSpan={2} className="px-3 py-2.5 text-[#1a1c1b] dark:text-white">
                                            Total Due
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#785600] dark:text-amber-400">
                                            {formatNumberDisplay(clientDueTotal.fine)}
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
};

export default RealTimeGoldReport;