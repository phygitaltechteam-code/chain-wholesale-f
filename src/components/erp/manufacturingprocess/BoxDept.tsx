import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Save,
    History,
    ChevronRight,
    ChevronDown,
    Printer,
    Plus,
    X,
    Layers,
    Sparkles,
    Box,
    Flame
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetBox, useGetBoxHistory, useSubmitBox, useCreateBox, useGetTarweight } from '@/lib/api/box';
import { useGetSizes, Size } from '@/lib/api/sizes';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useAddMelting } from '@/lib/api/tar';
import { useAddBoxMelting } from '@/lib/api/processmelting';

interface BoxEntry {
    id: string;
    srNo: number;
    dateTime: string;
    item: any;
    size: any;
    purity: number;
    tarWeight: number;
    chainWeight: number;
    scrap: number;
    loss: number;
    isEditing?: boolean;
    isSaved?: boolean;
    purityRaw?: string;
    chainWeightRaw?: string;
    scrapRaw?: string;
    itemId?: string;
    sizeId?: string;
    isCompleted?: boolean;
    isDirty?: boolean;
    status?: string;
    process?: string;
    isMelting?: boolean;
    meltingStatus?: boolean;
}

interface BoxCardForm {
    id: string;
    sizeId: string;
    purity: string;
    tarWeight: string;
    chainWeight: string;
    scrap: string;
    isSaving?: boolean;
}

const createNewBoxCard = (initial?: Partial<BoxCardForm>): BoxCardForm => ({
    id: `box-card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sizeId: initial?.sizeId || '',
    purity: initial?.purity || '',
    scrap: initial?.scrap || '',
    tarWeight: initial?.tarWeight || '',
    chainWeight: initial?.chainWeight || '',
});

// Helper functions for safely extracting values
const getItemName = (item: any): string => {
    if (!item) return '-';
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item.name) return String(item.name);
    return '-';
};

const getSizeName = (size: any): string => {
    if (!size) return '-';
    if (typeof size === 'string') return size;
    if (typeof size === 'object' && size.size !== undefined)
        return String(size.size);
    return '-';
};

const BoxDept: React.FC = () => {
    const getpdfheaderdata = useGetHeader();
    const navigate = useNavigate();
    const [boxEntries, setBoxEntries] = useState<BoxEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [saveIndex, setSaveIndex] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalCards, setModalCards] = useState<BoxCardForm[]>([createNewBoxCard()]);
    const [selectedTarCard, setSelectedTarCard] = useState<{
        purity: number;
        totalWeight: number;
    } | null>(null);
    const [fromDate, setFromDate] = useState<Date[]>([]);
    const [toDate, setToDate] = useState<Date[]>([]);
    const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(new Set());
    const isInitialMount = useRef(true);

    // Fetch data from API
    const { data: boxData = [], isLoading: boxLoading, refetch } = useGetBox();
    const { data: tarData = [], isLoading: tarLoading, refetch: tarRefetch } = useGetTarweight();
    const {
        data: boxHistory = [],
        isLoading: historyLoading,
        refetch: refetchHistory,
    } = useGetBoxHistory();
    const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();
    const submitBox = useSubmitBox();
    const createBox = useCreateBox();
    const submitMelting = useAddBoxMelting();


    const handleMelting = async (entry: BoxEntry) => {
        // Add this entry ID to loading set
        setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

        try {
            await submitMelting.mutateAsync({
                id: entry.id,
                data: {
                    purity: entry.purity,
                    tarWeight: entry.tarWeight,
                    boxId: entry.id
                },
            });

            toast.success('Melting process completed successfully');
            await refetch();
        } catch (error: any) {
            console.error('Error in melting:', error);
            const errorMessage =
                (Array.isArray(error?.response?.data?.message)
                    ? error.response.data.message.join(', ')
                    : error?.response?.data?.message) ||
                error?.response?.data?.error ||
                error?.data?.message ||
                error?.message ||
                'Failed to process melting';
            toast.error(errorMessage);
        } finally {
            setMeltingLoadingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(entry.id);
                return newSet;
            });
        }
    };

    const hasMeltingStatus = (item: any): boolean => {
        const s = String(item?.status || item?.process || '').toUpperCase();
        return (
            s === 'MELTING' ||
            item?.isMelting === true ||
            item?.meltingStatus === true
        );
    };
    // Weighing Scale table focus hook
    const { getScaleProps } = useTableScaleFocus<'chainWeight' | 'scrap'>(
        (index, field, weight) => {
            handleInlineChange(index, field, weight.toString());
        },
    );

    // Weighing Scale modal focus hook
    const { getScaleProps: getModalScaleProps } = useTableScaleFocus<
        'tarWeight' | 'chainWeight'
    >((cardIndex, field, weight) => {
        handleCardChange(cardIndex, field, weight.toString());
    });


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

    const [dateRange, setDateRange] = useState<Date[]>(() => {
        const { monday, sunday } = getDefaultWeekRange();
        return [monday, sunday];
    });

    // Helper function to convert to number safely
    const toNumber = (value: unknown): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    };

    // Helper function for 3 decimal formatted numbers (NO trailing zeroes)
    const formatNumberDisplay = (value: unknown): string => {
        if (value === null || value === undefined || value === '') return '0';
        const num = Number(value);
        if (!Number.isFinite(num)) return '0';
        const str = num.toFixed(3);
        return str.replace(/\.?0+$/, '');
    };

    // Load data from API
    useEffect(() => {
        if (boxLoading) return;

        if (isInitialMount.current) {
            isInitialMount.current = false;
        }

        if (boxData.length > 0) {
            const entries: BoxEntry[] = boxData.map((box: any, index: number) => {
                const itemName = box.item?.name || box.itemId || 'N/A';
                const sizeName = box.size?.size || box.sizeId || 'N/A';

                const chainWeight = box.chainWeight || 0;
                const tarWeight = box.tarWeight || 0;
                const scrap = box.scrap || 0;
                const loss = tarWeight - chainWeight - scrap;

                const isSaved =
                    box.isCompleted === true &&
                    box.chainWeight !== null &&
                    box.chainWeight !== undefined &&
                    box.scrap !== null &&
                    box.scrap !== undefined;

                const dateTime = new Date(box.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                });

                return {
                    id: box.id,
                    srNo: index + 1,
                    dateTime: dateTime,
                    item: itemName,
                    size: sizeName,
                    purity: box.purity || box.tar?.purity || 0,
                    tarWeight: tarWeight,
                    chainWeight: chainWeight,
                    scrap: box.scrap || 0,
                    loss: loss,
                    isEditing: !isSaved,
                    isSaved: isSaved,
                    purityRaw: box.purity ? box.purity.toString() : (box.tar?.purity ? box.tar.purity.toString() : ''),
                    chainWeightRaw: box.chainWeight ? box.chainWeight.toString() : '',
                    scrapRaw: box.scrap ? box.scrap.toString() : '',
                    itemId: box.itemId,
                    sizeId: box.sizeId,
                    isCompleted: box.isCompleted || false,
                    isDirty: false,
                    status: box.status,
                    process: box.process,
                    isMelting: box.isMelting,
                    meltingStatus: box.meltingStatus,
                };
            });
            setBoxEntries(entries);
        } else {
            setBoxEntries([]);
        }
    }, [boxData, boxLoading]);

    // Format date helper for history
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

    // Format number helper for history
    const formatNumber = (value: any) => {
        if (value === null || value === undefined) return '0';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return '0';
        return num.toFixed(0);
    };

    // Filter history by selected From-To date range.
    const getFilteredHistory = () => {
        let filtered = boxHistory;

        if (dateRange && dateRange.length > 0) {
            if (dateRange[0]) {
                const from = new Date(dateRange[0]);
                from.setHours(0, 0, 0, 0);
                filtered = filtered.filter((item: any) => {
                    if (!item?.createdAt) return false;
                    const itemDate = new Date(item.createdAt);
                    if (Number.isNaN(itemDate.getTime())) return false;
                    return itemDate >= from;
                });
            }
            if (dateRange[1]) {
                const to = new Date(dateRange[1]);
                to.setHours(23, 59, 59, 999);
                filtered = filtered.filter((item: any) => {
                    if (!item?.createdAt) return false;
                    const itemDate = new Date(item.createdAt);
                    if (Number.isNaN(itemDate.getTime())) return false;
                    return itemDate <= to;
                });
            }
        }

        return filtered;
    };

    // Calculate history totals
    const filteredHistory = getFilteredHistory();
    const historyTotals = filteredHistory.reduce(
        (
            acc: {
                totalTar: number;
                totalChain: number;
                totalScrap: number;
                totalLoss: number;
            },
            item: any,
        ) => ({
            totalTar: acc.totalTar + toNumber(item?.tarWeight),
            totalChain: acc.totalChain + toNumber(item?.chainWeight),
            totalScrap: acc.totalScrap + toNumber(item?.scrap),
            totalLoss:
                acc.totalLoss +
                toNumber(
                    item?.loss ?? (item?.tarWeight || 0) - (item?.chainWeight || 0) - (item?.scrap || 0),
                ),
        }),
        { totalTar: 0, totalChain: 0, totalScrap: 0, totalLoss: 0 },
    );

    // Tar stock list from /admin/tar/stock
    const tarStockList = Array.isArray(tarData?.data)
        ? tarData.data
        : Array.isArray(tarData)
            ? tarData
            : [];

    // Helper to get available Tar stock for a purity
    const getAvailableTarQty = (purity?: string): number => {
        if (!tarStockList || tarStockList.length === 0) return 0;
        if (purity && parseFloat(purity) > 0) {
            const pNum = parseFloat(purity);
            const match = tarStockList.filter(
                (t: any) => parseFloat(t.purity) === pNum,
            );
            const total = match.reduce(
                (sum: number, t: any) => sum + Number(t.tarWeight || 0),
                0,
            );
            return Math.round(total * 1000) / 1000;
        }
        const total = tarStockList.reduce(
            (sum: number, t: any) => sum + Number(t.tarWeight || 0),
            0,
        );
        return Math.round(total * 1000) / 1000;
    };

    // Top Tar for Box Cards (Purity & Tar Weight from /admin/tar/stock)
    const tarCards = React.useMemo(() => {
        const cardMap = new Map<
            number,
            { totalWeight: number; count: number; stockId?: string }
        >();
        tarStockList.forEach((item: any) => {
            const p = parseFloat(item.purity) || 0;
            const wt = Number(item.tarWeight || 0);
            if (p > 0 && wt > 0) {
                const current = cardMap.get(p) || {
                    totalWeight: 0,
                    count: 0,
                    stockId: item.id,
                };
                cardMap.set(p, {
                    totalWeight: current.totalWeight + wt,
                    count: current.count + 1,
                    stockId: current.stockId || item.id,
                });
            }
        });

        return Array.from(cardMap.entries()).map(([purity, data]) => ({
            purity,
            totalWeight: Math.round(data.totalWeight * 1000) / 1000,
            count: data.count,
            stockId: data.stockId,
        }));
    }, [tarStockList]);

    // Print History Function
    const handlePrintHistory = () => {
        const filteredData = getFilteredHistory();

        if (!filteredData || filteredData.length === 0) {
            toast.error(
                'No history records available to print for the selected date range',
            );
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

        const rows = filteredData
            .map((item: any, index: number) => {
                const { date, time } = formatDate(item?.createdAt);
                const { date: proceedDate, time: proceedTime } = formatDate(
                    item?.updatedAt,
                );
                const isMelting = hasMeltingStatus(item);

                return `
            <tr style="${isMelting ? 'opacity:0.6;background-color:#fafafa;' : ''}">
                <td style="border:1px solid #861818ff;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${index + 1}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                    ${date} ${time}
                </td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${getSizeName(item?.size)}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.purity)}%</td>
                ${isMelting
                        ? `<td colspan="3" style="border:1px solid #000;padding:1px 2px;text-align:center;font-weight:bold;font-size:11px;color:#785600;background-color:#fffbeb;">Melting</td>`
                        : `
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.tarWeight)}</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.chainWeight)}</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
                        <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumberDisplay(
                            item?.loss ?? (item?.tarWeight || 0) - (item?.chainWeight || 0),
                        )}</td>
                    `}
                <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                    ${proceedDate} ${proceedTime}
                </td>
            </tr>
        `;
            })
            .join('');

        const headerInfo =
            getpdfheaderdata?.data?.data ||
            (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
        const leftInvocation =
            headerInfo.leftInvocation ||
            headerInfo.leftInovation ||
            '॥ श्री गणेश प्रसन्न ॥';
        const rightInvocation =
            headerInfo.rightInvocation ||
            headerInfo.rightInovation ||
            '॥ श्री साई प्रसन्न ॥';
        const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
        const description =
            headerInfo.description ||
            'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
        const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
        const phoneNumbers =
            headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
        const invocationColor = headerInfo.invocationColor || '#a84b20';
        const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
        const descriptionColor = headerInfo.descriptionColor || '#8b451f';
        const proprietorColor = headerInfo.proprietorColor || '#a84b20';
        const phoneColor = headerInfo.phoneColor || '#a84b20';
        const factoryFontSize = headerInfo.factoryFontSize
            ? `${headerInfo.factoryFontSize}px`
            : '20px';
        const descriptionFontSize = headerInfo.descriptionFontSize
            ? `${headerInfo.descriptionFontSize}px`
            : '9px';
        const proprietorFontSize = headerInfo.proprietorFontSize
            ? `${headerInfo.proprietorFontSize}px`
            : '9px';
        const phoneFontSize = headerInfo.phoneFontSize
            ? `${headerInfo.phoneFontSize}px`
            : '9px';

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
            Box History Report
          </h2>
          ${fromDate.length > 0 && toDate.length > 0
                ? `
            <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
              From: ${new Date(fromDate[0]).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(toDate[0]).toLocaleDateString('en-IN')}
            </div>
          `
                : `
            <div style="flex:1;"></div>
          `
            }
        </div>

        <!-- Table -->
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
          <thead>
    <tr style="background:#785600;color:white;font-weight:600;">
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Size</th>
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Purity %</th>
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Tar</th>
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain Wt</th>
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Scrap</th>
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Loss</th>
        <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Proceed</th>
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
        #print-container tfoot tr {
          background: #f0f0f0 !important;
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

    const historyColumns: Column<any>[] = [
        {
            key: 'createdAt',
            header: 'Date & Time',
            render: (item) => {
                const { date, time } = formatDate(item?.createdAt);
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {date}
                        </span>
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {time}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'size',
            header: 'Size',
            render: (item) => (
                <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {item?.size?.size}
                </span>
            ),
        },
        {
            key: 'purity',
            header: 'Purity %',
            render: (item) => (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumber(item.purity)}%
                </span>
            ),
        },
        {
            key: 'tarWeight',
            header: 'Tar (तार)',
            colSpan: (item) => (hasMeltingStatus(item) ? 3 : 1),
            render: (item) => {
                if (hasMeltingStatus(item)) {
                    return (
                        <div className="flex items-center justify-center py-0.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                Melting
                            </span>
                        </div>
                    );
                }
                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(item?.tarWeight)} G
                    </span>
                );
            },
        },
        {
            key: 'chainWeight',
            header: 'Chain Weight (G)',
            colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
            render: (item) => {
                if (hasMeltingStatus(item)) {
                    return null;
                }
                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(item?.chainWeight)} G
                    </span>
                );
            },
        },
        {
            key: 'scrap',
            header: 'Scrap (स्क्रॅप)',
            colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
            render: (item) => {
                if (hasMeltingStatus(item)) {
                    return null;
                }
                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(item?.scrap)} G
                    </span>
                );
            },
        },
        {
            key: 'loss',
            header: 'Loss',
            colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
            render: (item) => {
                if (hasMeltingStatus(item)) {
                    return null;
                }
                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(item?.loss)} G
                    </span>
                );
            },
        },
        {
            key: 'updatedAt',
            header: 'Proceed Date & Time',
            render: (item) => {
                const { date, time } = formatDate(item?.updatedAt);
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {date}
                        </span>
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {time}
                        </span>
                    </div>
                );
            },
        },
    ];

    // Handle inline field change
    const handleInlineChange = useCallback(
        (
            index: number,
            field: 'chainWeight' | 'scrap' | 'purity',
            value: string,
        ) => {
            setBoxEntries((prev) =>
                prev.map((entry, i) => {
                    if (i === index) {
                        const updated = { ...entry };

                        if (field === 'chainWeight') {
                            updated.chainWeightRaw = value;
                            if (value === '' || value === '.' || value === '-') {
                                updated.chainWeight = 0;
                            } else {
                                const numValue = parseFloat(value);
                                updated.chainWeight = isNaN(numValue) ? 0 : numValue;
                            }
                        } else if (field === 'scrap') {
                            updated.scrapRaw = value;
                            if (value === '' || value === '.' || value === '-') {
                                updated.scrap = 0;
                            } else {
                                const numValue = parseFloat(value);
                                updated.scrap = isNaN(numValue) ? 0 : numValue;
                            }
                        } else if (field === 'purity') {
                            updated.purityRaw = value;
                            if (value === '' || value === '.' || value === '-') {
                                updated.purity = 0;
                            } else {
                                const numValue = parseFloat(value);
                                updated.purity = isNaN(numValue) ? 0 : numValue;
                            }
                        }
                        updated.loss = Math.max(
                            0,
                            Math.round((entry.tarWeight - updated.chainWeight - updated.scrap) * 1000) / 1000,
                        );

                        updated.isDirty = true;
                        return updated;
                    }
                    return entry;
                }),
            );
        },
        [],
    );

    // Open confirmation popup before saving
    const handleSaveClick = useCallback(
        (index: number) => {
            const entry = boxEntries[index];

            if (!entry.chainWeight || entry.chainWeight < 0) {
                toast.error('Please enter a valid chain weight');
                return;
            }

            if (entry.loss < 0) {
                toast.error(
                    'Loss Weight cannot be negative. Chain weight must be less than or equal to Tar Weight.',
                );
                return;
            }

            setSaveIndex(index);
            setShowConfirmModal(true);
        },
        [boxEntries],
    );

    // Confirm and save
    const confirmSave = useCallback(async () => {
        if (saveIndex === null) return;

        const index = saveIndex;
        const entry = boxEntries[index];

        setIsLoading(true);

        try {
            await submitBox.mutateAsync({
                id: entry.id,
                data: {
                    chainWeight: entry.chainWeight,
                    scrap: entry.scrap,
                    loss: entry.loss,
                    purity: entry.purity,
                    isCompleted: true,
                },
            });

            setBoxEntries((prev) =>
                prev.map((s, i) =>
                    i === index
                        ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
                        : s,
                ),
            );

            setIsLoading(false);
            setShowConfirmModal(false);
            setSaveIndex(null);
            await refetch();

            // navigate({
            //     to: '/manufacturingprocess/process',
            //     state: { selectedTab: 'soldering' },
            // });
        } catch (error: any) {
            console.error('Error saving box:', error);
            const errorMessage =
                (Array.isArray(error?.response?.data?.message)
                    ? error.response.data.message.join(', ')
                    : error?.response?.data?.message) ||
                error?.response?.data?.error ||
                error?.message ||
                'Failed to save box entry';
            toast.error(errorMessage);
            setIsLoading(false);
            setShowConfirmModal(false);
            setSaveIndex(null);
        }
    }, [saveIndex, boxEntries, submitBox, navigate, refetch]);

    const handleCardChange = (
        cardIndex: number,
        field: 'sizeId' | 'purity' | 'tarWeight' | 'chainWeight',
        value: string,
    ) => {
        setModalCards((prev) =>
            prev.map((card, idx) => {
                if (idx !== cardIndex) return card;
                const sanitized =
                    field === 'sizeId' ? value : value.replace(/[^0-9.]/g, '');
                return { ...card, [field]: sanitized };
            }),
        );
    };


    const handleRemoveCard = (cardIndex: number) => {
        setModalCards((prev) => {
            const next = prev.filter((_, idx) => idx !== cardIndex);
            if (next.length === 0) {
                setIsModalOpen(false);
                return [createNewBoxCard()];
            }
            return next;
        });
    };

    const handlePuritySelect = (cardIndex: number, selectedPurity: string) => {
        setModalCards((prev) =>
            prev.map((c, idx) => {
                if (idx !== cardIndex) return c;
                return {
                    ...c,
                    purity: selectedPurity,
                };
            }),
        );
    };

    const handleOpenModal = () => {
        setModalCards([createNewBoxCard()]);
        setIsModalOpen(true);
    };

    const handleSaveCard = async (cardIndex: number) => {
        const card = modalCards[cardIndex];
        if (!card) return;

        if (!card.sizeId) {
            toast.error(`Please select a size for Box Item #${cardIndex + 1}`);
            return;
        }

        const tarWeightVal = parseFloat(card.tarWeight) || 0;
        const purityVal = parseFloat(card.purity) || 0;
        const chainWeightVal = parseFloat(card.chainWeight) || 0;
        const scrapVal = parseFloat(card.scrap) || 0;

        if (tarWeightVal <= 0) {
            toast.error(`Please enter a valid Tar weight for Box Item #${cardIndex + 1}`);
            return;
        }

        setModalCards((prev) =>
            prev.map((c, idx) => (idx === cardIndex ? { ...c, isSaving: true } : c)),
        );

        try {
            const selectedSize = sizes.find((s) => s.id === card.sizeId);
            const lossVal = Math.max(0, Math.round((tarWeightVal - chainWeightVal - scrapVal) * 1000) / 1000);

            const payload = {
                sizeId: card.sizeId,
                size: selectedSize?.size || '',
                purity: purityVal,
                tarWeight: tarWeightVal,
                chainWeight: chainWeightVal,
                scrap: 0,
                loss: lossVal,
                isCompleted: false,
            };

            await createBox.mutateAsync(payload);
            toast.success(`Box Item #${cardIndex + 1} added successfully`);

            setModalCards((prev) => {
                const next = prev.filter((_, idx) => idx !== cardIndex);
                if (next.length === 0) {
                    setIsModalOpen(false);
                    return [createNewBoxCard()];
                }
                return next;
            });

            await tarRefetch();
            await refetch();
        } catch (error: any) {
            console.error('Error saving box item:', error);
            const backendMessage =
                (Array.isArray(error?.response?.data?.message)
                    ? error.response.data.message.join(', ')
                    : error?.response?.data?.message) ||
                error?.response?.data?.error ||
                error?.data?.message ||
                error?.message ||
                'Failed to save box entry';
            toast.error(backendMessage);
            setModalCards((prev) =>
                prev.map((c, idx) =>
                    idx === cardIndex ? { ...c, isSaving: false } : c,
                ),
            );
        }
    };


    // Check if any editable field has values
    const hasEditableValues = (entry: BoxEntry): boolean => {
        return Boolean(entry.isDirty);
    };

    // Action column is shown only when at least one unsaved row is edited.
    const showActionColumn = boxEntries.some(
        (entry) => !entry.isSaved && Boolean(entry.isDirty),
    );

    const isSubmitting = submitBox.isPending;

    // Main table columns
    const columns: Column<BoxEntry>[] = [
        {
            key: 'dateTime',
            header: 'Date & Time',
            render: (item) => {
                const parts = item.dateTime ? item.dateTime.split(', ') : ['', ''];
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {parts[0] || ''}
                        </span>
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {parts.slice(1).join(', ') || ''}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'sizeName',
            header: 'Size',
            render: (item) => (
                <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {typeof item?.size === 'object'
                        ? (item?.size?.size ?? '-')
                        : (item?.size ?? '-')}
                </span>
            ),
        },
        {
            key: 'purity',
            header: 'Purity % (टंच)',
            render: (item) => (
                <div className="flex w-24 items-center justify-center gap-1 whitespace-nowrap  bg-gray-50/50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/50">
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(item.purity)}%
                    </span>
                </div>
            ),
        },
        {
            key: 'tarWeight',
            header: 'Tar(तार)',
            render: (item) => (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item.tarWeight)} G
                </span>
            ),
        },
        {
            key: 'chainWeight',
            header: 'Chain Weight(G)',
            render: (item, index) => {
                if (item.isEditing) {
                    return (
                        <div className="relative inline-block">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={
                                    item.chainWeightRaw !== undefined
                                        ? item.chainWeightRaw
                                        : item.chainWeight === 0
                                            ? ''
                                            : item.chainWeight
                                }
                                {...getScaleProps(index, 'chainWeight')}
                                onChange={(e) =>
                                    handleInlineChange(index, 'chainWeight', e.target.value)
                                }
                                placeholder="0.000"
                                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                            />
                            <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                                G
                            </span>
                        </div>
                    );
                }

                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(item.chainWeight)} G
                    </span>
                );
            },
        },
        {
            key: 'scrap',
            header: 'Scrap (स्क्रॅप)',
            render: (item, index) => {
                if (item.isEditing) {
                    return (
                        <div className="relative inline-block">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={
                                    item.scrapRaw !== undefined
                                        ? item.scrapRaw
                                        : item.scrap === 0
                                            ? ''
                                            : item.scrap
                                }
                                {...getScaleProps(index, 'scrap')}
                                onChange={(e) =>
                                    handleInlineChange(index, 'scrap', e.target.value)
                                }
                                placeholder="0.000"
                                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                            />
                            <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                                G
                            </span>
                        </div>
                    );
                }

                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(item.scrap)} G
                    </span>
                );
            },
        },
        {
            key: 'loss',
            header: 'Loss',
            render: (item) => (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumberDisplay(item.loss)} G
                </span>
            ),
        },

        {
            key: 'actions',
            header: 'Action',
            render: (item: BoxEntry, index: number) => {
                const isMeltingLoading = meltingLoadingIds.has(item.id);

                return (
                    <div className="flex items-center justify-center gap-1.5">
                        {/* Soldering Button - Only show if entry is not saved and has editable values */}
                        {!item.isSaved && hasEditableValues(item) && (
                            <button
                                type="button"
                                onClick={() => handleSaveClick(index)}
                                disabled={isLoading || isSubmitting || isMeltingLoading}
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                title="Move to Soldering"
                            >
                                <Save className="h-3 w-3" />
                                <span>Soldering</span>
                            </button>
                        )}

                        {/* Melting Button - Always visible for all entries */}
                        <button
                            type="button"
                            onClick={() => handleMelting(item)}
                            disabled={isLoading || isSubmitting || isMeltingLoading}
                            className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${isMeltingLoading
                                ? 'bg-gray-400 cursor-wait'
                                : 'bg-gradient-to-br from-[#785600] to-[#986d00]'
                                }`}
                            title="Send to Melting"
                        >
                            {isMeltingLoading ? (
                                <>
                                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <span>Melting</span>
                            )}
                        </button>
                    </div>
                );
            },
        } as Column<BoxEntry>,
    ];

    const toggleHistory = () => {
        if (showHistory) {
            setShowHistory(false);
            refetch();
        } else {
            setShowHistory(true);
            refetchHistory();
        }
    };

    // Reset date range to current week
    const resetDateRange = () => {
        const { monday, sunday } = getDefaultWeekRange();
        setDateRange([monday, sunday]);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top Tar Cards Bar with Smooth Scrollbar */}
            {tarCards.length > 0 && !showHistory && (
                <div className="w-full">
                    <div className="mb-2 flex items-center gap-2 px-1">
                        <Box className="h-4 w-4 text-[#785600] dark:text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                            Available Tar Stock
                        </span>
                    </div>

                    {/* Scrollable Container */}
                    <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600">
                        {tarCards.map((card, idx) => (
                            <div
                                key={idx}
                                className="flex min-w-[90px] flex-col rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                                <span className="font-mono text-[11px] font-bold text-black dark:text-white">
                                    Tar ({card.purity}%)
                                </span>
                                <span className="font-mono text-[11px] font-bold text-black dark:text-white">
                                    {formatNumberDisplay(card.totalWeight)} G
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                        {showHistory ? 'Box History' : 'Box Department'}
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Filters - Only show when viewing history */}
                    {showHistory && (
                        <div className="flex flex-wrap items-center gap-2">
                            {/* From Date - Defaults to Monday */}
                            <GenericWeeklyDatePicker
                                id="from-date-box"
                                placeholder="DD/MM/YYYY"
                                mode="from"
                                initialDates={dateRange}
                                onDateChange={(dates) => {
                                    if (dates && dates.length > 0) {
                                        const from = new Date(dates[0]);
                                        from.setHours(0, 0, 0, 0);
                                        setDateRange((prev) => [from, prev[1] || from]);
                                    } else {
                                        setDateRange((prev) => [undefined as any, prev[1]]);
                                    }
                                }}
                                className="w-32 sm:w-36 md:w-40"
                            />

                            {/* To Date - Defaults to Sunday */}
                            <GenericWeeklyDatePicker
                                id="to-date-box"
                                placeholder="DD/MM/YYYY"
                                mode="to"
                                initialDates={dateRange}
                                onDateChange={(dates) => {
                                    if (dates && dates.length > 0) {
                                        const to = new Date(dates[0]);
                                        to.setHours(23, 59, 59, 999);
                                        setDateRange((prev) => [prev[0] || to, to]);
                                    } else {
                                        setDateRange((prev) => [prev[0], undefined as any]);
                                    }
                                }}
                                className="w-32 sm:w-36 md:w-40"
                            />
                        </div>
                    )}

                    {/* PRINT HISTORY */}
                    {showHistory && (
                        <GenericButton
                            type="button"
                            onClick={handlePrintHistory}
                            variant="primary"
                        >
                            <Printer className="h-4 w-4" />
                            <span>Print</span>
                        </GenericButton>
                    )}

                    {!showHistory && (
                        <GenericButton
                            type="button"
                            onClick={handleOpenModal}
                            variant="primary"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Box</span>
                        </GenericButton>
                    )}

                    {/* HISTORY / SHOW BOX */}
                    <GenericButton
                        type="button"
                        onClick={toggleHistory}
                        variant="primary"
                    >
                        {showHistory ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                        <span>{showHistory ? 'Show Box' : 'History'}</span>
                    </GenericButton>
                </div>
            </div>

            {/* Table Section */}
            {!showHistory ? (
                <div>
                    <GenericTable<BoxEntry>
                        data={boxEntries}
                        columns={columns}
                        emptyMessage="No box entries found."
                        isLoading={boxLoading || isSubmitting}
                        showSrNo={true}
                        srNoLabel="Sr No."
                    />
                </div>
            ) : (
                <div>
                    {/* History Summary Cards */}
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                    Total Tar
                                </span>
                                <span className="text-lg font-bold text-black dark:text-amber-400">
                                    {formatNumberDisplay(historyTotals.totalTar)} G
                                </span>
                            </div>
                        </div>
                        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                    Total Chain Weight
                                </span>
                                <span className="text-lg font-bold text-black dark:text-blue-400">
                                    {formatNumberDisplay(historyTotals.totalChain)} G
                                </span>
                            </div>
                        </div>
                        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                    Total Scrap
                                </span>
                                <span className="text-lg font-bold text-black dark:text-green-400">
                                    {formatNumberDisplay(historyTotals.totalScrap)} G
                                </span>
                            </div>
                        </div>
                        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                    Total Loss
                                </span>
                                <span className="text-lg font-bold text-black dark:text-red-400">
                                    {formatNumberDisplay(historyTotals.totalLoss)} G
                                </span>
                            </div>
                        </div>
                    </div>

                    <GenericTable
                        data={getFilteredHistory()}
                        columns={historyColumns}
                        emptyMessage={
                            dateRange.length === 2
                                ? `No history records found for the selected date range (${new Date(dateRange[0]).toLocaleDateString('en-IN')} to ${new Date(dateRange[1]).toLocaleDateString('en-IN')})`
                                : 'No history records found. Complete a box process to see history.'
                        }
                        isLoading={historyLoading}
                        showSrNo={true}
                        srNoLabel="Sr No."
                        className="shadow-sm"
                        rowClassName={(item) =>
                            hasMeltingStatus(item)
                                ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
                                : ''
                        }
                    />
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
                        <div className="p-6">
                            <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                                Confirm Save
                            </h3>
                            <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                                Are you sure you want to save this box entry? This will move to
                                the{' '}
                                <strong className="text-[#785600] dark:text-amber-400">
                                    Soldering Department
                                </strong>
                                .
                            </p>
                            <div className="mt-6 flex justify-center gap-3">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSaveIndex(null);
                                    }}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSave}
                                    disabled={isLoading}
                                    className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Confirm Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Box Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
                    <div
                        className={`w-full ${modalCards.length > 1 ? 'max-w-4xl' : 'max-w-lg'
                            } flex max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-[#d3c4af]/30 dark:border-slate-700`}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                                        Add Box Process
                                    </h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Cards Container */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div
                                className={`grid gap-4 ${modalCards.length > 1
                                    ? 'grid-cols-1 md:grid-cols-2'
                                    : 'grid-cols-1'
                                    }`}
                            >
                                {modalCards.map((card, idx) => {
                                    const isCardSaving = card.isSaving || false;
                                    return (
                                        <div
                                            key={card.id || idx}
                                            className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
                                        >
                                            {/* Card Top / Header */}
                                            {modalCards.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCard(idx)}
                                                    disabled={isCardSaving}
                                                    className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                                                    title="Remove this card"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Card Inputs */}
                                            <div className="space-y-3">


                                                {/* Purity Dropdown & Available Tar Wt */}
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    <div>
                                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                                            Purity (%) <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={card.purity}
                                                            onChange={(e) =>
                                                                handlePuritySelect(idx, e.target.value)
                                                            }
                                                            className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                        >
                                                            <option value="">Select Purity</option>
                                                            {tarCards.map((opt) => (
                                                                <option key={opt.purity} value={opt.purity}>
                                                                    Tar {opt.purity}%
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                                            Available Tar Wt (G)
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value={
                                                                    card.purity
                                                                        ? formatNumberDisplay(getAvailableTarQty(card.purity))
                                                                        : '0'
                                                                }
                                                                className="font-mono w-full rounded-lg border border-[#d3c4af]/20 bg-amber-50/50 px-3 py-2 pr-7 text-sm font-bold text-[#785600] outline-none cursor-not-allowed dark:bg-amber-950/20 dark:text-amber-400"
                                                            />
                                                            <span className="text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                                                                G
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tar Wt & Chain Weight */}
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    {/* Size */}
                                                    <div>
                                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                                            Size <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={card.sizeId}
                                                            onChange={(e) =>
                                                                handleCardChange(idx, 'sizeId', e.target.value)
                                                            }
                                                            className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                        >
                                                            <option value="">Select Size</option>
                                                            {sizes.map((size) => (
                                                                <option key={size.id} value={size.id}>
                                                                    {size.size || JSON.stringify(size)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                                                            Tar Weight (G) <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={card.tarWeight}
                                                                {...getModalScaleProps(idx, 'tarWeight')}
                                                                onChange={(e) =>
                                                                    handleCardChange(
                                                                        idx,
                                                                        'tarWeight',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                placeholder="0.000"
                                                                className="font-mono w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 pr-7 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                            />
                                                            <span className="text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                                                                G
                                                            </span>
                                                        </div>
                                                    </div>


                                                </div>
                                            </div>

                                            {/* Card Action Button */}
                                            <div className="mt-4 border-t border-[#d3c4af]/20 pt-3 dark:border-slate-700">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveCard(idx)}
                                                    disabled={isCardSaving}
                                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50"
                                                >
                                                    <Save className="h-3.5 w-3.5" />
                                                    <span>
                                                        {isCardSaving ? 'Saving...' : 'Save'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoxDept;
