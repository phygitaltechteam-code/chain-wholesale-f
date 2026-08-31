import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Printer,
    Plus,
    Box,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetBox, useGetBoxHistory, useSubmitBox, useCreateBox, useGetTarweight } from '@/lib/api/box';
import { useGetSizes } from '@/lib/api/sizes';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useAddBoxMelting } from '@/lib/api/processmelting';

import {
    BoxEntry,
    BoxCardForm,
    createNewBoxCard,
    formatNumberDisplay,
    hasMeltingStatus,
    printBoxHistory,
    getHistoryBoxColumns,
    getBoxColumns,
} from './boxUtils';
import HistoryBox from './HistoryBox';
import AddBoxModal from './AddBoxModal';

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
        printBoxHistory(getFilteredHistory(), fromDate, toDate, getpdfheaderdata);
    };

    const historyColumns = getHistoryBoxColumns();

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
    const columns = getBoxColumns(
        getScaleProps,
        handleInlineChange,
        handleSaveClick,
        handleMelting,
        hasEditableValues,
        isLoading,
        isSubmitting,
        meltingLoadingIds,
    );


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
                <HistoryBox
                    dateRange={dateRange}
                    historyTotals={historyTotals}
                    historyData={getFilteredHistory()}
                    historyColumns={historyColumns}
                    historyLoading={historyLoading}
                />
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

            <AddBoxModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                modalCards={modalCards}
                handleRemoveCard={handleRemoveCard}
                handlePuritySelect={handlePuritySelect}
                tarCards={tarCards}
                getAvailableTarQty={getAvailableTarQty}
                sizes={sizes}
                handleCardChange={handleCardChange}
                getModalScaleProps={getModalScaleProps}
                handleSaveCard={handleSaveCard}
            />
        </div>
    );
};

export default BoxDept;
