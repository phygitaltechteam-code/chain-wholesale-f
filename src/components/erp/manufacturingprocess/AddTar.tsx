import React, { useState, useEffect } from 'react';
import { Plus, Save, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { Column, GenericTable } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetItems, Item } from '@/lib/api/items';
import { useGetSizes, Size } from '@/lib/api/sizes';
import { useTar, useCreateTar, useSaveTar, Tar } from '@/lib/api/tar';

interface TarEntry {
    id: string;
    srNo: number;
    dateTime: string;
    item: string;
    size: string;
    fine: number;
    tar: number;
    scrap: number;
    loss: number;
    purity: number;
    isSaved: boolean;
    tarRaw?: string;
    scrapRaw?: string;
    purityRaw?: string;
    itemId?: string;
    sizeId?: string;
}

interface AddTarProps {
    showBack?: boolean;
}

const AddTar: React.FC<AddTarProps> = ({ showBack = false }) => {
    const navigate = useNavigate();
    const [tarEntries, setTarEntries] = useState<TarEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [saveIndex, setSaveIndex] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isTarCompleted, setIsTarCompleted] = useState(false);

    const [formData, setFormData] = useState({
        itemId: '',
        sizeId: '',
        fine: '',
    });

    // Date and Time state for modal
    const [selectedDate, setSelectedDate] = useState({
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
    });

    // Fetch items and sizes from API
    const { data: items = [], isLoading: itemsLoading } = useGetItems();
    const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();

    // Fetch existing tar data
    const { data: tarData = [], isLoading: tarLoading, refetch } = useTar();

    // Mutation hooks
    const createTar = useCreateTar();
    const saveTar = useSaveTar();

    // Initialize with existing tar data
    useEffect(() => {
        if (!tarLoading && items.length > 0 && sizes.length > 0) {
            if (tarData.length > 0) {
                const entries: TarEntry[] = tarData.map((tar, index) => {
                    // Handle if size is an object
                    let sizeValue = tar.size;
                    if (typeof tar.size === 'object' && tar.size !== null) {
                        sizeValue = tar.size.size || tar.size.name || JSON.stringify(tar.size);
                    }

                    // Handle if item is an object
                    let itemValue = tar.item;
                    if (typeof tar.item === 'object' && tar.item !== null) {
                        itemValue = tar.item.name || tar.item.item || JSON.stringify(tar.item);
                    }

                    // Check if any tar is saved
                    if (tar.isSaved) {
                        setIsTarCompleted(true);
                    }

                    // Format date from API or create new one
                    let formattedDateTime = tar.dateTime || '';
                    if (!formattedDateTime) {
                        formattedDateTime = formatDateTime(new Date());
                    }

                    return {
                        id: tar.id,
                        srNo: index + 1,
                        dateTime: formattedDateTime,
                        item: itemValue,
                        size: sizeValue,
                        fine: tar.fine || 0,
                        tar: tar.tar || 0,
                        scrap: tar.scrap || 0,
                        loss: tar.loss || tar.lossWeight || 0,
                        purity: typeof tar.purity === 'string' ? parseFloat(tar.purity) : (tar.purity || 0),
                        isSaved: tar.isSaved || false,
                        tarRaw: tar.tar ? tar.tar.toString() : '',
                        scrapRaw: tar.scrap ? tar.scrap.toString() : '',
                        purityRaw: tar.purity ? tar.purity.toString() : '',
                        itemId: tar.itemId || '',
                        sizeId: tar.sizeId || '',
                    };
                });
                setTarEntries(entries);
            } else {
                setTarEntries([]);
            }
        }
    }, [tarData, items, sizes, tarLoading]);

    // Check if Tar is completed when entries change
    useEffect(() => {
        const hasSaved = tarEntries.some(entry => entry.isSaved === true);
        if (hasSaved) {
            setIsTarCompleted(true);
        }
    }, [tarEntries]);

    // Format date time helper
    const formatDateTime = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'fine') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            setFormData((prev) => ({ ...prev, [name]: sanitized }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (field: string, value: number) => {
        setSelectedDate(prev => ({ ...prev, [field]: value }));
    };

    const getFormattedDateTime = () => {
        const { day, month, year, hour, minute } = selectedDate;
        const date = new Date(year, month - 1, day, hour, minute);
        return formatDateTime(date);
    };

    const handleOpenModal = () => {
        if (isTarCompleted) {
            toast.error('Tar process is already completed. You cannot add more entries.');
            return;
        }
        // Reset date to current
        const now = new Date();
        setSelectedDate({
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            hour: now.getHours(),
            minute: now.getMinutes(),
        });
        setFormData({
            itemId: '',
            sizeId: '',
            fine: '',
        });
        setIsModalOpen(true);
    };

    const handleSaveFromPopup = async () => {
        // Validate form data
        if (!formData.itemId) {
            toast.error('Please select an item');
            return;
        }

        if (!formData.sizeId) {
            toast.error('Please select a size');
            return;
        }

        if (!formData.fine || parseFloat(formData.fine) <= 0) {
            toast.error('Please enter a valid fine value');
            return;
        }

        setIsLoading(true);

        try {
            const fineValue = parseFloat(formData.fine) || 0;
            const selectedItem = items.find(i => i.id === formData.itemId);
            const selectedSize = sizes.find(s => s.id === formData.sizeId);

            // Format date with time
            const { day, month, year, hour, minute } = selectedDate;
            const date = new Date(year, month - 1, day, hour, minute);
            const dateTimeStr = formatDateTime(date);

            // Prepare payload with ALL required fields - ensure fine is a number
            const payload = {
                itemId: formData.itemId,
                sizeId: formData.sizeId,
                fine: fineValue,
                item: selectedItem?.name || '',
                size: selectedSize?.size || '',
                tar: 0,
                scrap: 0,
                loss: 0,
                purity: 0,
                isSaved: false,
                dateTime: dateTimeStr,
            };

            console.log('Sending payload:', payload);

            const result = await createTar.mutateAsync(payload);

            // Add the new entry to the table
            const newEntry: TarEntry = {
                id: result?.data?.id || Date.now().toString(),
                srNo: tarEntries.length + 1,
                dateTime: dateTimeStr,
                item: selectedItem?.name || '',
                size: selectedSize?.size || '',
                fine: fineValue,
                tar: 0,
                scrap: 0,
                loss: 0,
                purity: 0,
                isSaved: false,
                tarRaw: '',
                scrapRaw: '',
                purityRaw: '',
                itemId: formData.itemId,
                sizeId: formData.sizeId,
            };

            setTarEntries(prev => [...prev, newEntry]);
            setIsModalOpen(false);
            await refetch();
        } catch (error: any) {
            console.error('Error saving tar:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save tar entry';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInlineChange = (index: number, field: 'tar' | 'scrap' | 'purity', value: string) => {
        setTarEntries(prev => prev.map((entry, i) => {
            if (i === index) {
                const updated = { ...entry };

                if (field === 'tar') {
                    const sanitized = value.replace(/[^0-9.]/g, '');
                    updated.tarRaw = sanitized;
                    if (sanitized === '' || sanitized === '.' || sanitized === '-') {
                        updated.tar = 0;
                    } else {
                        const numValue = parseFloat(sanitized);
                        updated.tar = isNaN(numValue) ? 0 : numValue;
                    }
                    updated.loss = Math.max(0, entry.fine - (updated.tar || 0));
                } else if (field === 'scrap') {
                    const sanitized = value.replace(/[^0-9.]/g, '');
                    updated.scrapRaw = sanitized;
                    if (sanitized === '' || sanitized === '.' || sanitized === '-') {
                        updated.scrap = 0;
                    } else {
                        const numValue = parseFloat(sanitized);
                        updated.scrap = isNaN(numValue) ? 0 : numValue;
                    }
                } else if (field === 'purity') {
                    const sanitized = value.replace(/[^0-9.]/g, '');
                    updated.purityRaw = sanitized;
                    if (sanitized === '' || sanitized === '.' || sanitized === '-') {
                        updated.purity = 0;
                    } else {
                        const numValue = parseFloat(sanitized);
                        updated.purity = isNaN(numValue) ? 0 : numValue;
                    }
                }

                return updated;
            }
            return entry;
        }));
    };

    // Open confirmation popup before saving
    const handleSaveClick = (index: number) => {
        const entry = tarEntries[index];

        if (!entry.tar || entry.tar < 0) {
            toast.error('Please enter a valid tar weight');
            return;
        }

        if (!entry.scrap || entry.scrap < 0) {
            toast.error('Please enter a valid scrap weight');
            return;
        }

        if (!entry.purity || entry.purity <= 0) {
            toast.error('Please enter purity (टंच)');
            return;
        }

        if (entry.loss < 0) {
            toast.error('Loss cannot be negative. Tar must be less than or equal to Fine.');
            return;
        }

        setSaveIndex(index);
        setShowConfirmModal(true);
    };

    // Confirm and save
    const confirmSave = async () => {
        if (saveIndex === null) return;

        const index = saveIndex;
        const entry = tarEntries[index];

        setIsLoading(true);

        try {
            await saveTar.mutateAsync({
                id: entry.id,
                data: {
                    id: entry.id,
                    itemId: entry.itemId || '',
                    sizeId: entry.sizeId || '',
                    fine: Number(entry.fine),
                    item: entry.item || '',
                    size: entry.size || '',
                    tar: Number(entry.tar),
                    scrap: Number(entry.scrap),
                    purity: Number(entry.purity),
                    loss: Number(entry.loss),
                    isSaved: true,
                }
            });

            setTarEntries(prev => prev.map((s, i) =>
                i === index ? { ...s, isSaved: true } : s
            ));

            setIsTarCompleted(true);

            // toast.success('Tar entry saved successfully!');
            setIsLoading(false);
            setShowConfirmModal(false);
            setSaveIndex(null);
            await refetch();

            // Navigate to the Process page with Box Department state
            navigate({
                to: '/manufacturingprocess/process',
                state: { selectedTab: 'box' }
            });
        } catch (error) {
            console.error('Error saving tar:', error);
            toast.error('Failed to save tar entry');
            setIsLoading(false);
            setShowConfirmModal(false);
            setSaveIndex(null);
        }
    };

    const resetForm = () => {
        setFormData({
            itemId: '',
            sizeId: '',
            fine: '',
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const formatNumber = (value: number) => {
        if (value === 0 || !value) return '0';
        const str = value.toString();
        if (str.includes('.')) {
            return str.replace(/\.?0+$/, '');
        }
        return str;
    };

    const columns: Column<TarEntry>[] = [
        {
            key: 'dateTime',
            header: 'Date & Time',
            render: (item) => {
                // Split dateTime into date and time parts
                const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
                const datePart = parts[0] || '';
                const timePart = parts.slice(1).join(' ') || '';

                return (
                    <div className="flex flex-col items-center">
                        <span className="text-sm text-[#1a1c1b] dark:text-white">
                            {datePart}
                        </span>
                        <span className="text-xs text-[#4f4535] dark:text-slate-400">
                            {timePart}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'item',
            header: 'Item',
            render: (item) => (
                <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                    {typeof item.item === 'string' ? item.item : JSON.stringify(item.item)}
                </span>
            ),
        },
        {
            key: 'size',
            header: 'Size',
            render: (item) => (
                <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {typeof item.size === 'string' ? item.size : JSON.stringify(item.size)}
                </span>
            ),
        },
        {
            key: 'fine',
            header: 'Fine (लगड)',
            render: (item) => (
                <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumber(item.fine)}
                </span>
            ),
        },
        {
            key: 'tar',
            header: 'Tar(तार)',
            render: (item, index) => {
                if (!item.isSaved) {
                    return (
                        <input
                            type="text"
                            value={item.tarRaw !== undefined ? item.tarRaw : (item.tar === 0 ? '' : item.tar)}
                            onChange={(e) => handleInlineChange(index, 'tar', e.target.value)}
                            placeholder="0.000"
                            className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                        />
                    );
                }
                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumber(item.tar)}
                    </span>
                );
            },
        },
        {
            key: 'scrap',
            header: 'Scrap (स्क्रॅप)',
            render: (item, index) => {
                if (!item.isSaved) {
                    return (
                        <input
                            type="text"
                            value={item.scrapRaw !== undefined ? item.scrapRaw : (item.scrap === 0 ? '' : item.scrap)}
                            onChange={(e) => handleInlineChange(index, 'scrap', e.target.value)}
                            placeholder="0.000"
                            className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                        />
                    );
                }
                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumber(item.scrap)}
                    </span>
                );
            },
        },
        {
            key: 'loss',
            header: 'Loss',
            render: (item) => (
                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumber(item.loss)}
                </span>
            ),
        },
        {
            key: 'purity',
            header: 'Purity % (टंच)',
            render: (item, index) => {
                if (!item.isSaved) {
                    return (
                        <input
                            type="text"
                            value={item.purityRaw !== undefined ? item.purityRaw : (item.purity === 0 ? '' : item.purity)}
                            onChange={(e) => handleInlineChange(index, 'purity', e.target.value)}
                            placeholder="e.g., 98"
                            className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                        />
                    );
                }
                return (
                    <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                        {formatNumber(item.purity)}
                    </span>
                );
            },
        },
    ];
    const renderActions = (item: TarEntry, index: number) => {
        if (!item.isSaved) {
            return (
                <button
                    onClick={() => handleSaveClick(index)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    title="Save Entry"
                >
                    <Save className="h-3 w-3" />
                    <span>Save</span>
                </button>
            );
        }
        return (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Saved
            </span>
        );
    };

    const isSubmitting = createTar.isPending || saveTar.isPending;

    return (
        <div className="bg-[#f9f9f7] dark:bg-slate-950">
            {/* Header with Conditional Back Button - Optimized */}
            <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
                <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#1a1c1b] dark:text-white truncate">
                            Tar Management
                        </h1>
                    </div>
                    <GenericButton
                        type="button"
                        onClick={handleOpenModal}
                        disabled={isTarCompleted}
                        className={`flex items-center gap-1.5 !px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !text-white whitespace-nowrap ${isTarCompleted
                            ? '!bg-gray-400 cursor-not-allowed opacity-60'
                            : '!bg-amber-600 hover:!bg-amber-700'
                            }`}
                    >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="xs:hidden">{isTarCompleted ? 'Completed' : 'Add Tar'}</span>
                    </GenericButton>
                </div>
            </div>

            <div>
                <GenericTable<TarEntry>
                    data={tarEntries}
                    columns={columns}
                    onSave={(item, index) => handleSaveClick(index)}
                    emptyMessage="No tar entries found. Click 'Add Tar' to create one."
                    isLoading={tarLoading || itemsLoading || sizesLoading || isSubmitting}
                    renderActions={renderActions}
                    showSrNo={true}
                    srNoLabel="Sr No."
                />
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-[#d3c4af]/10 p-4 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                                Add New Tar
                            </h3>
                            <button
                                onClick={closeModal}
                                className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-4 p-4">
                            {/* Item Select */}
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
                                    Item <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="itemId"
                                    value={formData.itemId}
                                    onChange={handleFormChange}
                                    className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="">Select Item</option>
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name || JSON.stringify(item)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Size Select */}
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
                                    Size <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="sizeId"
                                    value={formData.sizeId}
                                    onChange={handleFormChange}
                                    className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="">Select Size</option>
                                    {sizes.map((size) => (
                                        <option key={size.id} value={size.id}>
                                            {size.size || JSON.stringify(size)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fine Input */}
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
                                    Fine (लगड) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fine"
                                    value={formData.fine}
                                    onChange={handleFormChange}
                                    placeholder="e.g., 5.000"
                                    className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white font-mono"
                                    autoFocus
                                />
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 border-t border-[#d3c4af]/10 p-4 dark:border-slate-700">
                            <GenericButton
                                onClick={handleSaveFromPopup}
                                disabled={isLoading}
                                className="!bg-amber-600 hover:!bg-amber-700 !text-white"
                            >
                                {isLoading ? 'Saving...' : 'Add'}
                            </GenericButton>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
                        <div className="p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                                    <Save className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <h3 className="text-center text-lg font-bold text-[#1a1c1b] dark:text-white mb-2">
                                Confirm Save
                            </h3>
                            <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                                Are you sure you want to save this tar entry? This will move to the <strong className="text-[#785600] dark:text-amber-400">Box Department</strong>.
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
                                <GenericButton
                                    onClick={confirmSave}
                                    disabled={isLoading}
                                    className="!bg-amber-600 hover:!bg-amber-700 !text-white"
                                >
                                    {isLoading ? 'Saving...' : 'Confirm & Continue'}
                                </GenericButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddTar;