import React, { useState, useEffect, useRef } from 'react';
import {
    X, Save, Edit, Trash2,
    Plus, Minus, ArrowLeft, Loader2
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetClients, useCreateClient } from '@/lib/api/client';
import { useGetItems } from '@/lib/api/items';
import { useGetSizes } from '@/lib/api/sizes';
import toast from 'react-hot-toast';
import { z } from 'zod';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import { useGetQuantity, useBill, useGetBillByid, useBillUpdate } from '@/lib/api/bill';
import { Route } from '@/routes/_app/billiupdate.$id';

interface ReceiptItem {
    id: string;
    srNo: number;
    item: string;
    size: string;
    purity: number;
    availableQty: number;
    grossWt: number;
    wastage: number;
    srp: number;
    fineWt: number;
    laborRate: number;
    isLoadingQty?: boolean;
    itemId?: string;
    sizeId?: string;
}

interface ReceiptFormData {
    clientId: string;
    clientName: string;
    date: string;
    items: ReceiptItem[];
    customerWeight: number;
    goldInfo: {
        karat: string;
        rate: number;
        weight: number;
        totalAmount: number;
    };
}

const ClientSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    address: z.string().min(1, "Address is required"),
    openingBalance: z.number().min(0, "Opening balance cannot be negative"),
});

const BillEdit: React.FC = () => {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const [tableRenderKey, setTableRenderKey] = useState(0);

    const [formData, setFormData] = useState<ReceiptFormData>({
        clientId: '',
        clientName: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        customerWeight: 0,
        goldInfo: {
            karat: '22K',
            rate: 0,
            weight: 0,
            totalAmount: 0
        }
    });
    const [showClientModal, setShowClientModal] = useState(false);
    const [clientFormData, setClientFormData] = useState({
        fullName: '',
        phoneNumber: '',
        address: '',
        openingBalance: '',
    });
    const [clientFormErrors, setClientFormErrors] = useState<{
        fullName?: string;
        phoneNumber?: string;
        address?: string;
        openingBalance?: string;
    }>({});
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastFetchRef = useRef<{ item: string; size: string; purity: number } | null>(null);

    const { data: clients = [], refetch: refetchClients } = useGetClients();
    const { data: items = [] } = useGetItems();
    const { data: sizes = [] } = useGetSizes();
    const createClient = useCreateClient();

    const getQuantity = useGetQuantity();
    const { data: billResponse, isLoading: isLoadingBill } = useGetBillByid(id);
    const updateBill = useBillUpdate();

    // Add empty row function
    const handleAddItem = () => {
        const newItem: ReceiptItem = {
            id: `item-${Date.now()}`,
            srNo: formData.items.length + 1,
            item: '',
            size: '',
            purity: 0,
            availableQty: 0,
            grossWt: 0,
            wastage: 0,
            srp: 0,
            fineWt: 0,
            laborRate: 0,
            isLoadingQty: false,
            itemId: '',
            sizeId: '',
        };
        const updatedItems = [...formData.items, newItem];
        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));
        setTableRenderKey(prev => prev + 1);
    };

    useEffect(() => {
        if (!billResponse || isDataLoaded) return;

        console.log('=== DEBUG BILL RESPONSE ===');
        console.log('1. Full billResponse:', billResponse);
        console.log('2. billResponse.data:', billResponse?.data);
        console.log('3. billResponse.data?.receiptItems:', billResponse?.data?.receiptItems);
        console.log('4. billResponse.receiptItems:', billResponse?.receiptItems);

        let billData = billResponse.data || billResponse;

        console.log('5. Final billData:', billData);
        console.log('6. billData.receiptItems:', billData?.receiptItems);

        if (!billData || !billData.id) {
            console.log('No bill data found');
            if (formData.items.length === 0) {
                handleAddItem();
            }
            return;
        }

        console.log('Extracted Bill Data:', billData);

        setFormData(prev => ({
            ...prev,
            clientId: billData.clientID || billData.clientId || '',
            clientName: billData.client?.fullName || '',
            date: billData.receiptDate ? new Date(billData.receiptDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            customerWeight: billData.customerWeight || 0,
        }));

        const receiptItems = billData.receiptItems || [];
        console.log('7. receiptItems length:', receiptItems.length);
        console.log('8. receiptItems:', receiptItems);

        if (receiptItems.length > 0) {
            const itemsList: ReceiptItem[] = receiptItems.map((item: any, index: number) => ({
                id: item.id || `item-${Date.now()}-${index}`,
                srNo: index + 1,
                item: item.item?.name || item.itemName || '',
                size: item.size?.size || item.sizeName || '',
                purity: item.purity || 0,
                availableQty: 0,
                grossWt: item.grossWeight || 0,
                wastage: 0,
                srp: item.srp || 0,
                fineWt: item.fineWeight || 0,
                laborRate: item.laborRate || 0,
                isLoadingQty: false,
                itemId: item.itemID || item.itemId || '',
                sizeId: item.sizeID || item.sizeId || '',
            }));

            console.log('9. Mapped Items List:', itemsList);

            setFormData(prev => ({
                ...prev,
                items: itemsList
            }));
            setTableRenderKey(prev => prev + 1);
        } else {
            if (formData.items.length === 0) {
                handleAddItem();
            }
        }

        setIsDataLoaded(true);
    }, [billResponse, isDataLoaded]);

    const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        if (value === '__add_new__') {
            setShowClientModal(true);
            return;
        }

        const selected = clients.find((c: any) => c.id === value);
        if (selected) {
            setFormData({
                ...formData,
                clientId: selected.id,
                clientName: selected.fullName
            });
        }
    };

    const handleAddClientFromPopup = async () => {
        try {
            const parsed = ClientSchema.parse({
                fullName: clientFormData.fullName.trim(),
                phoneNumber: clientFormData.phoneNumber.trim(),
                address: clientFormData.address.trim(),
                openingBalance: parseFloat(clientFormData.openingBalance) || 0,
            });

            await createClient.mutateAsync({
                fullName: parsed.fullName,
                phoneNumber: parsed.phoneNumber,
                address: parsed.address,
                openingBalance: parsed.openingBalance,
            });

            setClientFormData({
                fullName: '',
                phoneNumber: '',
                address: '',
                openingBalance: '',
            });
            setClientFormErrors({});
            setShowClientModal(false);
            await refetchClients();
            toast.success('Client added successfully!');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: any = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        errors[err.path[0]] = err.message;
                    }
                });
                setClientFormErrors(errors);
                toast.error(errors[Object.keys(errors)[0]] || 'Please fix the errors');
            }
        }
    };

    const handleRemoveItem = (index: number) => {
        if (formData.items.length <= 1) {
            toast.error('At least one item is required');
            return;
        }

        const updatedItems = formData.items.filter((_, i) => i !== index);
        updatedItems.forEach((item, idx) => {
            item.srNo = idx + 1;
        });
        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));
        setTableRenderKey(prev => prev + 1);
        toast.success('Item removed');
    };

    const fetchQuantity = async (index: number, item: string, size: string, purity: number) => {
        if (!item || !size || !purity || purity <= 0) {
            return;
        }

        const selectedItem = items.find((i: any) => i.name === item);
        const selectedSize = sizes.find((s: any) => s.size === size);

        if (!selectedItem || !selectedSize) {
            toast.error('Item or size not found');
            return;
        }

        const currentFetch = { item, size, purity };
        if (lastFetchRef.current &&
            lastFetchRef.current.item === currentFetch.item &&
            lastFetchRef.current.size === currentFetch.size &&
            lastFetchRef.current.purity === currentFetch.purity) {
            console.log('Skipping duplicate fetch request');
            return;
        }
        lastFetchRef.current = currentFetch;

        setFormData(prev => ({
            ...prev,
            items: prev.items.map((entry, i) =>
                i === index ? { ...entry, isLoadingQty: true } : entry
            )
        }));

        try {
            const response = await getQuantity.mutateAsync({
                itemId: selectedItem.id,
                sizeId: selectedSize.id,
                purity: purity
            });

            console.log('API Response:', response);

            let weight = 0;

            if (response?.data?.weight !== undefined && response.data.weight !== null) {
                weight = Number(response.data.weight);
            } else if (response?.weight !== undefined && response.weight !== null) {
                weight = Number(response.weight);
            } else if (response?.data?.quantity !== undefined && response.data.quantity !== null) {
                weight = Number(response.data.quantity);
            } else if (response?.quantity !== undefined && response.quantity !== null) {
                weight = Number(response.quantity);
            }

            console.log('Extracted weight:', weight);

            if (!isNaN(weight) && weight >= 0) {
                setFormData(prev => ({
                    ...prev,
                    items: prev.items.map((entry, i) =>
                        i === index ? {
                            ...entry,
                            availableQty: weight,
                            isLoadingQty: false
                        } : entry
                    )
                }));

                if (weight > 0) {
                    toast.success(`Available quantity: ${weight}`);
                } else {
                    toast('No quantity available for this combination');
                }
            } else {
                setFormData(prev => ({
                    ...prev,
                    items: prev.items.map((entry, i) =>
                        i === index ? { ...entry, isLoadingQty: false } : entry
                    )
                }));
                toast.error('Invalid quantity received from server');
            }

        } catch (error: any) {
            console.error('Error fetching quantity:', error);
            if (error.response?.status !== 404) {
                toast.error(error.response?.data?.message || 'Failed to fetch available quantity');
            }
            setFormData(prev => ({
                ...prev,
                items: prev.items.map((entry, i) =>
                    i === index ? { ...entry, isLoadingQty: false } : entry
                )
            }));
        }
    };

    const calculateFineWeight = (purity: number, grossWt: number, srp: number) => {
        const purityFactor = purity / 100;
        return (grossWt * purityFactor) + srp;
    };

    const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
        const updatedItems = [...formData.items];
        const item = updatedItems[index];
        if (field === 'grossWt') {
            const strValue = String(value);
            if (strValue.includes('.')) {
                const decimalPlaces = strValue.split('.')[1]?.length || 0;
                if (decimalPlaces > 3) {
                    toast.error('Gross weight can have maximum 3 decimal places');
                    return;
                }
            }
            const numValue = parseFloat(strValue);
            if (!isNaN(numValue)) {
                const roundedValue = Math.round(numValue * 1000) / 1000;
                updatedItems[index] = {
                    ...item,
                    [field]: roundedValue
                };
            } else {
                updatedItems[index] = {
                    ...item,
                    [field]: 0
                };
            }
        } else {
            updatedItems[index] = {
                ...item,
                [field]: value
            };
        }

        if (field === 'purity' || field === 'grossWt' || field === 'srp') {
            const purity = field === 'purity' ? value : updatedItems[index].purity;
            const grossWt = field === 'grossWt' ? updatedItems[index].grossWt : updatedItems[index].grossWt;
            const srp = field === 'srp' ? value : updatedItems[index].srp;

            updatedItems[index].fineWt = calculateFineWeight(
                Number(purity) || 0,
                Number(grossWt) || 0,
                Number(srp) || 0
            );
        }

        setFormData({
            ...formData,
            items: updatedItems
        });
        setTableRenderKey(prev => prev + 1);
        
        if (field === 'purity') {
            const currentItem = updatedItems[index];
            if (currentItem.item && currentItem.size && currentItem.purity > 0) {
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                    fetchQuantity(index, currentItem.item, currentItem.size, currentItem.purity);
                }, 800);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const validateAllItems = (): boolean => {
        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.item || !item.size) {
                toast.error(`Row ${i + 1}: Please select item and size`);
                return false;
            }
            if (item.purity <= 0 || item.purity > 100) {
                toast.error(`Row ${i + 1}: Purity must be between 1 and 100`);
                return false;
            }
            if (item.grossWt <= 0) {
                toast.error(`Row ${i + 1}: Please enter a valid gross weight`);
                return false;
            }
            if (item.srp < 0) {
                toast.error(`Row ${i + 1}: Please enter a valid SRP`);
                return false;
            }
            if (item.isLoadingQty) {
                toast.loading(`Row ${i + 1}: Fetching available quantity...`, { duration: 2000 });
                return false;
            }
        }
        return true;
    };

    const handleCustomerWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0) {
            setFormData({
                ...formData,
                customerWeight: value
            });
        } else {
            setFormData({
                ...formData,
                customerWeight: 0
            });
        }
    };

    const calculateTotalBill = () => {
        return calculateTotalSRP() + calculateTotalLabor();
    };

    const calculateRemainingWeight = () => {
        return calculateTotalGrossWt() - formData.customerWeight;
    };

    const handleUpdateReceipt = async () => {
        if (!formData.clientId || !formData.clientName) {
            toast.error('Please select a client');
            return;
        }
        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        if (!validateAllItems()) {
            return;
        }

        if (formData.customerWeight <= 0) {
            toast.error('Please enter customer weight');
            return;
        }

        if (formData.customerWeight > calculateTotalGrossWt()) {
            toast.error('Customer weight cannot be greater than total gross weight');
            return;
        }

        try {
            const totalGrossWt = calculateTotalGrossWt();
            const totalBill = calculateTotalBill();
            const remainingWeight = calculateRemainingWeight();
            const billData = {
                clientId: formData.clientId,
                receiptDate: formData.date,
                items: formData.items.map(item => ({
                    itemId: items.find((i: any) => i.name === item.item)?.id || item.itemId,
                    itemName: item.item,
                    sizeId: sizes.find((s: any) => s.size === item.size)?.id || item.sizeId,
                    size: item.size,
                    purity: item.purity,
                    availableQty: item.availableQty,
                    grossWeight: Number(item.grossWt.toFixed(3)),
                    srp: item.srp,
                    fineWeight: Number(item.fineWt.toFixed(3)),
                    laborRate: item.laborRate || 0
                })),
                customerWeight: Number(formData.customerWeight.toFixed(3)),
                remainingWeight: Number(remainingWeight.toFixed(3)),
                totalWeight: Number(totalGrossWt.toFixed(3))
            };

            console.log('Updating backend:', billData);

            await updateBill.mutateAsync({ id, data: billData });

            navigate({ to: '/billing' });
        } catch (error) {
            console.error('Error updating receipt:', error);
            toast.error('Failed to update receipt');
        }
    };

    const calculateTotalGrossWt = () => {
        return formData.items.reduce((total, item) => total + (item.grossWt || 0), 0);
    };

    const calculateTotalFineWt = () => {
        return formData.items.reduce((total, item) => total + (item.fineWt || 0), 0);
    };

    const calculateTotalSRP = () => {
        return formData.items.reduce((total, item) => total + (item.srp || 0), 0);
    };

    const calculateTotalLabor = () => {
        return formData.items.reduce((total, item) => total + (item.laborRate || 0), 0);
    };

    const formatNumberThreeDecimals = (value: number) => {
        if (value === 0 || !value) return '0';
        const str = value.toFixed(3);
        return str.replace(/\.0+$/, '');
    };

    const handleItemSave = (item: ReceiptItem, index: number) => {
        console.log('Item saved:', item);
    };

    const renderActions = (item: ReceiptItem, index: number) => {
        const actualIndex = index;

        return (
            <div className="flex items-center justify-center gap-1">
                <button
                    onClick={() => handleRemoveItem(actualIndex)}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove row"
                    disabled={formData.items.length <= 1}
                >
                    <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={handleAddItem}
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                    title="Add row"
                >
                    <Plus className="h-3.5 w-3.5" />
                </button>
            </div>
        );
    };

    const columns: Column<ReceiptItem>[] = [
        {
            key: 'item',
            header: 'Item',
            render: (item, index) => {
                const actualIndex = index;
                return (
                    <select
                        value={item.item}
                        onChange={(e) => handleItemChange(actualIndex, 'item', e.target.value)}
                        className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    >
                        <option value="">Select Item</option>
                        {items.map((item: any) => (
                            <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                    </select>
                );
            },
        },
        {
            key: 'size',
            header: 'Size',
            render: (item, index) => {
                const actualIndex = index;
                return (
                    <select
                        value={item.size}
                        onChange={(e) => handleItemChange(actualIndex, 'size', e.target.value)}
                        className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    >
                        <option value="">Select Size</option>
                        {sizes.map((size: any) => (
                            <option key={size.id} value={size.size}>{size.size}</option>
                        ))}
                    </select>
                );
            },
        },
        {
            key: 'purity',
            header: 'Purity (%)',
            render: (item, index) => {
                const actualIndex = index;
                return (
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={item.purity || ''}
                            onChange={(e) => handleItemChange(actualIndex, 'purity', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="flex-1 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-right text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                        />
                        {item.isLoadingQty && (
                            <Loader2 className="h-4 w-4 animate-spin text-[#785600]" />
                        )}
                    </div>
                );
            },
        },
        {
            key: 'availableQty',
            header: 'Available Qty',
            render: (item) => {
                return (
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.availableQty || ''}
                        placeholder="Auto-fetched"
                        className="w-24 rounded-lg border border-[#d3c4af]/30 bg-gray-50 px-3 py-2 text-right text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white dark:border-slate-700 cursor-not-allowed"
                        readOnly
                    />
                );
            },
        },
        {
            key: 'grossWt',
            header: 'Gross Wt (G)',
            render: (item, index) => {
                const actualIndex = index;
                return (
                    <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.grossWt || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                handleItemChange(actualIndex, 'grossWt', 0);
                                return;
                            }
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                                const decimalPart = val.split('.')[1];
                                if (decimalPart && decimalPart.length > 3) {
                                    toast.error('Gross weight can have maximum 3 decimal places');
                                    return;
                                }
                                handleItemChange(actualIndex, 'grossWt', num);
                            }
                        }}
                        placeholder="0.000"
                        className="w-24 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-right text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    />
                );
            },
        },
        {
            key: 'srp',
            header: 'SRP (₹)',
            render: (item, index) => {
                const actualIndex = index;
                return (
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.srp || ''}
                        onChange={(e) => handleItemChange(actualIndex, 'srp', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-24 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-right text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    />
                );
            },
        },
        {
            key: 'fineWt',
            header: 'Fine Wt (G)',
            render: (item) => (
                <span className="font-mono font-bold text-[#785600] dark:text-amber-400">
                    {formatNumberThreeDecimals(item.fineWt)}
                </span>
            ),
        },
        {
            key: 'laborRate',
            header: 'Labor Rate (₹)',
            render: (item, index) => {
                const actualIndex = index;
                return (
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.laborRate || ''}
                        onChange={(e) => handleItemChange(actualIndex, 'laborRate', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-24 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-right text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    />
                );
            },
        },
    ];

    if (isLoadingBill) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-[#785600] border-t-transparent"></div>
                    <p className="text-[#4f4535] dark:text-slate-400">Loading bill data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f9f9f7] dark:bg-slate-950">
            <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 pb-32">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate({ to: '/billing' })}
                            className="flex items-center gap-2 text-[#785600] hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300 transition-colors flex-shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                        <PageHeader
                            title="Edit Bill"
                            subtitle="Update bill items and details"
                        />
                    </div>
                </div>

                {/* Client & Date Section */}
                <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#4f4535] dark:text-slate-300 mb-1.5">
                                Client <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.clientId}
                                onChange={handleClientSelect}
                                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-4 py-2.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                            >
                                <option value="">Select Client</option>
                                {clients.map((client: any) => (
                                    <option key={client.id} value={client.id}>
                                        {client.fullName}
                                    </option>
                                ))}
                                <option value="__add_new__" className="text-[#785600] font-bold">
                                    + Add New Client
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#4f4535] dark:text-slate-300 mb-1.5">
                                Date
                            </label>
                            <GenericDatePicker
                                id="date-picker"
                                placeholder="DD/MM/YYYY"
                                dateFormat="d/m/Y"
                                initialDate={formData.date ? new Date(formData.date) : undefined}
                                onDateChange={(dates) => {
                                    if (dates && dates.length > 0) {
                                        setFormData(prev => ({
                                            ...prev,
                                            date: dates[0].toISOString().split('T')[0]
                                        }));
                                    }
                                }}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-[#4f4535] dark:text-slate-300 uppercase tracking-wider">
                            Items
                        </h3>
                        <p className="text-xs text-[#4f4535]/60 dark:text-slate-400 mt-1">
                            Use + button to add more items, - button to remove
                        </p>
                    </div>

                    <GenericTable<ReceiptItem>
                        key={tableRenderKey}
                        data={formData.items}
                        columns={columns}
                        onSave={handleItemSave}
                        emptyMessage="No items added yet."
                        isLoading={false}
                        renderActions={renderActions}
                        showSrNo={true}
                        srNoLabel="Sr No."
                    />
                </div>

                {/* Receipt Summary */}
                {formData.items.length > 0 && (
                    <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Customer Weight - Editable Field */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <label className="text-sm font-semibold text-[#4f4535] dark:text-slate-300 whitespace-nowrap">
                                    Advance (G) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={formData.customerWeight || ''}
                                    onChange={handleCustomerWeightChange}
                                    placeholder="Enter weight"
                                    className="w-32 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                                />
                                {formData.customerWeight > 0 && formData.customerWeight > calculateTotalGrossWt() && (
                                    <p className="text-xs text-red-500 whitespace-nowrap">
                                        Exceeds total ({formatNumberThreeDecimals(calculateTotalGrossWt())}G)
                                    </p>
                                )}
                            </div>

                            {/* Summary Stats in One Line */}
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400">Total Gross:</span>
                                    <span className="text-sm font-bold text-[#1a1c1b] dark:text-white font-mono">
                                        {formatNumberThreeDecimals(calculateTotalGrossWt())} G
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400">Remaining:</span>
                                    <span className="text-sm font-bold text-[#1a1c1b] dark:text-white font-mono">
                                        {formatNumberThreeDecimals(calculateRemainingWeight())} G
                                        {calculateRemainingWeight() > 0 && (
                                            <span className="ml-1 text-xs font-normal text-[#4f4535] dark:text-slate-400">
                                                (Pending)
                                            </span>
                                        )}
                                        {calculateRemainingWeight() === 0 && (
                                            <span className="ml-1 text-xs font-normal text-[#4f4535] dark:text-slate-400">
                                                (Settled)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons - Sticky Version */}
                <div className="sticky bottom-0 bg-[#f9f9f7] dark:bg-slate-950 p-4 border-t border-[#d3c4af]/20 dark:border-slate-700 z-50">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <GenericButton
                            type="button"
                            onClick={handleUpdateReceipt}
                            disabled={updateBill.isPending}
                        >
                            {updateBill.isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            {updateBill.isPending ? 'Updating...' : 'Update Bill'}
                        </GenericButton>
                    </div>
                </div>
            </div>

            {/* Add Client Modal */}
            {showClientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-[#d3c4af]/10 p-4 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">Add New Client</h3>
                            <button
                                onClick={() => setShowClientModal(false)}
                                className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
                            </button>
                        </div>
                        <div className="space-y-4 p-4">
                            {/* ... modal content ... */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillEdit;