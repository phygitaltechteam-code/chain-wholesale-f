import { useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Printer, Calendar, AlertCircle, TrendingDown, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useGetLossReport } from '@/lib/api/lossreport';
import React from 'react';

// ======================================================
// INTERFACES
// ======================================================
interface LossReportEntry {
    id: string;
    srNo: number;
    dateTime: string;
    particular: string;
    loss: number;
    purity: number;
    process?: string; // Add process field
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
    type: string;
    particular: string;
    loss: number;
    purity: number;
    createdAt: string;
    process?: string; // Add process field
}

// ======================================================
// HELPER FUNCTIONS
// ======================================================
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

const formatDate = (dateString: string) => {
    if (!dateString) return { date: '-', time: '-' };
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }),
        time: date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }),
    };
};

const toNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const formatNumberDisplay = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '0';
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    const str = num.toFixed(3);
    return str.replace(/\.?0+$/, '');
};

// ======================================================
// MAIN COMPONENT
// ======================================================
const LossReport: React.FC = () => {
    const getpdfheaderdata = useGetHeader();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProcess, setSelectedProcess] = useState<string>('all'); // Add process filter state
    const [reportData, setReportData] = useState<LossReportEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState<Date[]>(() => {
        const { monday, sunday } = getDefaultWeekRange();
        return [monday, sunday];
    });

    const [fromDate, setFromDate] = useState<Date | null>(() => {
        const { monday } = getDefaultWeekRange();
        return monday;
    });
    const [toDate, setToDate] = useState<Date | null>(() => {
        const { sunday } = getDefaultWeekRange();
        return sunday;
    });

    const { data: lossReportData, isLoading, isError, refetch } = useGetLossReport();

    // Transform API data
    useEffect(() => {
        if (!lossReportData) return;

        const response = lossReportData as ApiResponse;

        // Extract data from response
        const apiItems: ApiDataItem[] = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
                ? response
                : [];

        // Filter by date range
        const filteredApiItems = apiItems.filter((item) => {
            const createdAt = new Date(item.createdAt);
            if (fromDate) {
                const from = new Date(fromDate);
                from.setHours(0, 0, 0, 0);
                if (createdAt < from) return false;
            }
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                if (createdAt > to) return false;
            }
            return true;
        });

        // Sort by date (newest first)
        const sortedItems = [...filteredApiItems].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        // Transform to LossReportEntry
        const transformedData: LossReportEntry[] = sortedItems.map((item, index) => {
            const { date, time } = formatDate(item.createdAt);
            const dateTime = `${date} ${time}`;

            return {
                id: item.id,
                srNo: index + 1,
                dateTime: dateTime,
                particular: item.particular || 'N/A',
                loss: toNumber(item.loss),
                purity: toNumber(item.purity),
                process: item.process || item.type || 'Unknown', // Get process from API
            };
        });

        setReportData(transformedData);
        setLoading(false);
    }, [lossReportData, fromDate, toDate]);

    // Get unique processes for dropdown
    const processOptions = React.useMemo(() => {
        const processes = new Set<string>();
        processes.add('all');
        reportData.forEach(item => {
            if (item.process) {
                processes.add(item.process.toLowerCase());
            }
        });
        return Array.from(processes);
    }, [reportData]);

    // Filter data by search term and process
    const filteredData = reportData.filter((entry) => {
        // Search filter
        let matchesSearch = true;
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            matchesSearch =
                entry.particular.toLowerCase().includes(query) ||
                entry.dateTime.toLowerCase().includes(query) ||
                entry.loss.toString().includes(query);
        }

        // Process filter
        let matchesProcess = true;
        if (selectedProcess !== 'all') {
            matchesProcess = entry.process?.toLowerCase() === selectedProcess.toLowerCase();
        }

        return matchesSearch && matchesProcess;
    });

    // Calculate totals
    const totalLoss = filteredData.reduce((sum, entry) => sum + entry.loss, 0);
    const totalEntries = filteredData.length;
    const positiveLoss = filteredData.filter(entry => entry.loss > 0).reduce((sum, entry) => sum + entry.loss, 0);
    const negativeLoss = filteredData.filter(entry => entry.loss < 0).reduce((sum, entry) => sum + entry.loss, 0);

    // Handle From Date Change
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

    // Handle To Date Change
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

    // Print handler (keep existing implementation)
    const handlePrint = () => {
        // ... (keep your existing print implementation)
    };

    // Define columns for GenericTable (add process column)
    const columns: Column<LossReportEntry>[] = [
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
            key: 'particular',
            header: 'Particular',
            render: (item) => (
                <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {item.particular}
                </span>
            ),
        },
        {
            key: 'process',
            header: 'Process',
            render: (item) => (
                <span className="text-sm font-medium text-[#785600] dark:text-amber-400">
                    {item.process || 'N/A'}
                </span>
            ),
        },
        {
            key: 'loss',
            header: 'Loss (G)',
            render: (item) => (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item.loss)} G
                </span>
            ),
        },
    ];

    // Show loading state
    if (isLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#785600]"></div>
                    <p className="mt-4 text-[#785600] dark:text-amber-400">
                        Loading loss report...
                    </p>
                </div>
            </div>
        );
    }

    // Show error state
    if (isError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
                <div className="text-center">
                    <div className="mb-4 text-5xl text-red-500">⚠️</div>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                        Error Loading Report
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Failed to fetch loss report data.
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

    return (
        <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
                <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
                    <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                        <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
                        <div className="flex items-center gap-2">
                            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
                                Loss Report
                            </h2>
                        </div>
                    </div>

                    <div className="flex w-full flex-col items-center gap-2 sm:w-auto xl:flex-row">
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <GenericWeeklyDatePicker
                                id="from-date-loss"
                                mode="from"
                                placeholder="DD/MM/YYYY"
                                initialDates={fromDate ? [fromDate] : []}
                                onDateChange={handleFromDateChange}
                                className="w-32 sm:w-36 md:w-40"
                            />

                            <GenericWeeklyDatePicker
                                id="to-date-loss"
                                placeholder="DD/MM/YYYY"
                                mode="to"
                                initialDates={toDate ? [toDate] : []}
                                onDateChange={handleToDateChange}
                                className="w-32 sm:w-36 md:w-40"
                            />
                        </div>

                        {/* Process Dropdown - Added after date pickers */}
                        <select
                            value={selectedProcess}
                            onChange={(e) => setSelectedProcess(e.target.value)}
                            className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="all">All </option>
                            {processOptions
                                .filter(p => p !== 'all')
                                .map((process) => (
                                    <option key={process} value={process}>
                                        {process.charAt(0).toUpperCase() + process.slice(1)}
                                    </option>
                                ))}
                        </select>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                            <input
                                type="text"
                                placeholder="Search by particular..."
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
                {/* Summary Cards - Kept same, no changes */}
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                    Total Entries
                                </span>
                                <span className="text-2xl font-bold text-black dark:text-white">
                                    {totalEntries}
                                </span>
                            </div>
                            <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                                <AlertCircle className="h-5 w-5 text-black dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                    Total Loss
                                </span>
                                <span className="text-2xl font-bold text-black dark:text-white">
                                    {formatNumberDisplay(totalLoss)} G
                                </span>
                            </div>
                            <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                                <TrendingDown className="h-5 w-5 text-black dark:text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table using GenericTable */}
                <GenericTable<LossReportEntry>
                    data={filteredData}
                    columns={columns}
                    emptyMessage="No loss entries found for the selected date range and process."
                    showSrNo={true}
                    srNoLabel="Sr No."
                    className="shadow-sm"
                />
            </div>
        </div>
    );
};

export default LossReport;