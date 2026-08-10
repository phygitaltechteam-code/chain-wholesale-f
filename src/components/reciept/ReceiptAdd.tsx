import React, { useState, useEffect, useRef } from 'react';
import {
  X, Save, Edit, Trash2,
  Plus, Minus, ArrowLeft, Loader2,
  FileText, CheckCircle, AlertCircle, Search, UserPlus
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
import { useGetQuantity, useBill } from '@/lib/api/bill';
import GenericInputField from '../Forms/Input/GenericInputField';
import { ClientSearch } from './ClientSearch';

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
}

interface ReceiptFormData {
  clientId: string;
  clientName: string;
  date: string;
  items: ReceiptItem[];
  customerWeight: number;
  totalFine: number;
  goldInfo: {
    karat: string;
    rate: number;
    weight: number;
    totalAmount: number;
  };
}


const ReceiptAdd: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date[]>([]);
  const [formData, setFormData] = useState<ReceiptFormData>({
    clientId: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    customerWeight: 0,
    totalFine: 0,
    goldInfo: {
      karat: '22K',
      rate: 0,
      weight: 0,
      totalAmount: 0
    }
  });
  const [showClientModal, setShowClientModal] = useState(false);
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');
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

  // Refs for debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<{ item: string; size: string; purity: number } | null>(null);

  // Fetch data from API
  const { data: clients = [], refetch: refetchClients } = useGetClients();
  const { data: items = [] } = useGetItems();
  const { data: sizes = [] } = useGetSizes();
  const createClient = useCreateClient();

  // API hooks
  const getQuantity = useGetQuantity();
  const savebill = useBill();

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
      isLoadingQty: false
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
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
    setFormData({
      ...formData,
      items: updatedItems
    });
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
      } else {
        setFormData(prev => ({
          ...prev,
          items: prev.items.map((entry, i) =>
            i === index ? { ...entry, isLoadingQty: false } : entry
          )
        }));
      }
    } catch (error: any) {
      console.error('Error fetching quantity:', error);
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

  // Update Total Fine calculation
  const updateTotalFine = (items: ReceiptItem[]) => {
    const total = items.reduce((sum, item) => sum + (item.fineWt || 0), 0);
    return Math.round(total * 1000) / 1000;
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
    } else if (field === 'purity') {
      // Handle purity as number
      const numValue = parseFloat(value);
      updatedItems[index] = {
        ...item,
        [field]: isNaN(numValue) ? 0 : Math.min(100, Math.max(0, numValue))
      };
    } else {
      updatedItems[index] = {
        ...item,
        [field]: value
      };
    }

    // Recalculate fine weight for the changed item
    const currentItem = updatedItems[index];
    if (field === 'purity' || field === 'grossWt' || field === 'srp') {
      const purity = field === 'purity' ? currentItem.purity : currentItem.purity;
      const grossWt = field === 'grossWt' ? currentItem.grossWt : currentItem.grossWt;
      const srp = field === 'srp' ? currentItem.srp : currentItem.srp;

      currentItem.fineWt = calculateFineWeight(
        Number(purity) || 0,
        Number(grossWt) || 0,
        Number(srp) || 0
      );
    }

    // Update total fine
    const newTotalFine = updateTotalFine(updatedItems);

    setFormData({
      ...formData,
      items: updatedItems,
      totalFine: newTotalFine
    });

    // Fetch quantity if purity changed
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

  useEffect(() => {
    if (formData.items.length === 0) {
      handleAddItem();
    }
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

  // Handle Advance (Customer Weight) change
  const handleCustomerWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFormData({ ...formData, customerWeight: 0 });
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      const roundedValue = Math.round(numValue * 1000) / 1000;
      setFormData({ ...formData, customerWeight: roundedValue });
    }
  };

  // Handle Total Fine (Issue) change - Manual edit
  const handleTotalFineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFormData({ ...formData, totalFine: 0 });
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      const roundedValue = Math.round(numValue * 1000) / 1000;
      setFormData({ ...formData, totalFine: roundedValue });
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

  const calculateTotalBill = () => {
    return calculateTotalSRP() + calculateTotalLabor();
  };

  const calculateRemainingWeight = () => {
    const advance = Number(formData.customerWeight) || 0;
    const issue = Number(formData.totalFine) || 0;
    return Math.round((advance - issue) * 1000) / 1000;
  };

  const formatNumberThreeDecimals = (value: number) => {
    if (value === 0 || !value) return '0';
    return Number(value.toFixed(3)).toString();
  };

  // Negative opening balance means the client has a due balance.
  const getClientDueBalance = (client: any) => {
    const openingBalance = Number(client?.openingBalance) || 0;
    return openingBalance < 0
      ? Math.round(Math.abs(openingBalance) * 1000) / 1000
      : 0;
  };

  // Save as Draft - Use 'DRAFT' (uppercase)
  const handleSaveAsDraft = async () => {
    if (!formData.clientId || !formData.clientName) {
      toast.error('Please select a client');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      const totalGrossWt = calculateTotalGrossWt();
      const remainingWeight = calculateRemainingWeight();

      const billData = {
        clientId: formData.clientId,
        receiptDate: formData.date,
        items: formData.items.map(item => ({
          itemId: items.find((i: any) => i.name === item.item)?.id,
          itemName: item.item,
          sizeId: sizes.find((s: any) => s.size === item.size)?.id,
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
        totalWeight: Number(totalGrossWt.toFixed(3)),
        type: 'DRAFT'
      };

      await savebill.mutateAsync(billData);
      toast.success('Bill saved as draft successfully!');
      navigate({ to: '/billing' });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  // Save as Completed - Use 'BILL' (uppercase)
  const handleSaveReceipt = async () => {
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

    try {
      const totalGrossWt = calculateTotalGrossWt();
      const remainingWeight = calculateRemainingWeight();

      const billData = {
        clientId: formData.clientId,
        receiptDate: formData.date,
        items: formData.items.map(item => ({
          itemId: items.find((i: any) => i.name === item.item)?.id,
          itemName: item.item,
          sizeId: sizes.find((s: any) => s.size === item.size)?.id,
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
        totalWeight: Number(totalGrossWt.toFixed(3)),
        type: 'BILL'
      };

      await savebill.mutateAsync(billData);
      toast.success(`Bill saved successfully!`);
      navigate({ to: '/billing' });
    } catch (error: any) {
      console.error('Error saving receipt:', error);

      // Show the exact backend error when stock is insufficient.
      const backendMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        '';

      if (
        typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('insufficient stock')
      ) {
        setStockErrorMessage(backendMessage);
        setShowStockErrorModal(true);
        return;
      }

      toast.error(backendMessage || 'Failed to save bill');
    }
  };

  const renderActions = (item: ReceiptItem, index: number) => {
    const actualIndex = formData.items.indexOf(item);

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
        const actualIndex = formData.items.indexOf(item);
        return (
          <select
            value={item.item}
            onChange={(e) => handleItemChange(actualIndex, 'item', e.target.value)}
            className="w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1.5 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
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
        const actualIndex = formData.items.indexOf(item);
        return (
          <select
            value={item.size}
            onChange={(e) => handleItemChange(actualIndex, 'size', e.target.value)}
            className="w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1.5 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700"
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
        const actualIndex = formData.items.indexOf(item);
        return (
          <div className="relative flex-1">
            <GenericInputField
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={item.purity || ''}
              onChange={(e) => handleItemChange(actualIndex, 'purity', parseFloat(e.target.value) || 0)}
              placeholder="0"
              suffix="%"
              className="!w-full !min-w-0 text-right !px-1.5 !py-1.5 !pr-6 text-xs"
              decimalScale={2}
            />
            {item.isLoadingQty && (
              <Loader2 className="h-4 w-4 animate-spin text-[#785600] absolute right-8 top-1/2 -translate-y-1/2" />
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
          <div className="relative w-full">
            <input
              type="number"
              step="0.001"
              min="0"
              value={item.availableQty || ''}
              placeholder="Auto"
              className="w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-gray-50 px-1.5 py-1.5 pr-6 text-right text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white dark:border-slate-700 cursor-not-allowed"
              readOnly
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 dark:text-slate-400">G</span>
          </div>
        );
      },
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item, index) => {
        const actualIndex = formData.items.indexOf(item);
        return (
          <GenericInputField
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
            suffix="G"
            className="!w-full !min-w-0 text-right !px-1.5 !py-1.5 !pr-6 text-xs"
            decimalScale={3}
          />
        );
      },
    },
    {
      key: 'srp',
      header: 'SRP (G)',
      render: (item, index) => {
        const actualIndex = formData.items.indexOf(item);
        return (
          <GenericInputField
            type="number"
            step="0.01"
            min="0"
            value={item.srp || ''}
            onChange={(e) => handleItemChange(actualIndex, 'srp', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            suffix="G"
            className="!w-full !min-w-0 text-right !px-1.5 !py-1.5 !pr-6 text-xs"
            decimalScale={2}
          />
        );
      },
    },
    {
      key: 'fineWt',
      header: 'Fine Wt (G)',
      render: (item) => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <span className="font-mono font-bold text-[#785600] dark:text-amber-400">
            {formatNumberThreeDecimals(item.fineWt)}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-slate-400">G</span>
        </div>
      ),
    },
    {
      key: 'laborRate',
      header: 'Labor Rate (G)',
      render: (item, index) => {
        const actualIndex = formData.items.indexOf(item);
        return (
          <GenericInputField
            type="number"
            step="0.01"
            min="0"
            value={item.laborRate || ''}
            onChange={(e) => handleItemChange(actualIndex, 'laborRate', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
             suffix="G"
            className="!w-full !min-w-0 text-right !px-1.5 !py-1.5 !pr-6 text-xs"
            decimalScale={2}
          />
        );
      },
    },
  ];

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950 min-h-screen">
      <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
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
              title="Create Bill"
              subtitle="Add items and generate bill"
            />
          </div>
        </div>

        {/* Client & Date Section */}
        <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                Client <span className="text-red-500">*</span>
              </label>

              <ClientSearch
                clients={clients as any[]}
                selectedClient={
                  clients.find(
                    (client: any) => client.id === formData.clientId
                  ) || null
                }
                onSelectClient={(client: any) => {
                  setFormData((prev) => ({
                    ...prev,
                    clientId: client.id,
                    clientName: client.fullName || client.fullname || '',
                  }));
                }}
                onClearClient={() => {
                  setFormData((prev) => ({
                    ...prev,
                    clientId: '',
                    clientName: '',
                  }));
                }}
                isLoading={false}
                onAddNewClient={() => setShowClientModal(true)}
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

          <div className="w-full min-w-0 overflow-hidden [&_table]:w-full [&_table]:table-fixed [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[11px] [&_td]:px-1.5 [&_td]:py-1.5 [&_td]:text-xs">
            <GenericTable<ReceiptItem>
              data={formData.items}
              columns={columns}
              emptyMessage="No items added yet."
              isLoading={false}
              renderActions={renderActions}
              showSrNo={true}
              srNoLabel="Sr No."
            />
          </div>
        </div>
        {/* Right Column - Weight Payment Details */}
        <div className="space-y-3">

          {/* Card 1: Advance & Issue */}
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              {/* Advance - Optional */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#4f4535] dark:text-slate-400">
                  Advance (Optional)
                </span>

                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.customerWeight || ''}
                    onChange={handleCustomerWeightChange}
                    placeholder="0.000"
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 pr-8 text-right text-sm font-mono text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#817563] dark:text-slate-400">
                    G
                  </span>
                </div>
              </div>

              {/* Issue - Editable */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#4f4535] dark:text-slate-400">
                  Issue
                </span>

                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.totalFine || ''}
                    onChange={handleTotalFineChange}
                    placeholder="0.000"
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 pr-8 text-right text-sm font-mono text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#817563] dark:text-slate-400">
                    G
                  </span>
                </div>
              </div>

            </div>

            {/* Due Balance + Remaining */}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">

              {/* Due Balance - Read Only */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#4f4535] dark:text-slate-400">
                  Due Balance
                </span>

                <div className="relative">
                  <input
                    type="text"
                    value={formatNumberThreeDecimals(
                      getClientDueBalance(
                        clients.find(
                          (client: any) =>
                            client.id === formData.clientId
                        )
                      )
                    )}
                    readOnly
                    className="w-full cursor-default rounded-lg border border-[#d3c4af]/20 bg-gray-50 px-3 py-1.5 pr-8 text-right text-sm font-mono text-[#1a1c1b] outline-none dark:border-slate-700 dark:bg-slate-700 dark:text-white"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#817563] dark:text-slate-400">
                    G
                  </span>
                </div>
              </div>

              {/* Remaining - Read Only */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#4f4535] dark:text-slate-400">
                  Remaining
                </span>

                <div className="relative">
                  <input
                    type="text"
                    value={formatNumberThreeDecimals(
                      calculateRemainingWeight()
                    )}
                    readOnly
                    className="w-full cursor-default rounded-lg border border-[#d3c4af]/20 bg-gray-50 px-3 py-1.5 pr-8 text-right text-sm font-mono text-[#1a1c1b] outline-none dark:border-slate-700 dark:bg-slate-700 dark:text-white"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#817563] dark:text-slate-400">
                    G
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-[#f9f9f7] dark:bg-slate-950 p-4 border-t border-[#d3c4af]/20 dark:border-slate-700 z-50">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <GenericButton
              type="button"
              onClick={handleSaveAsDraft}
              disabled={savebill.isPending}
              className="!bg-gradient-to-br from-[#d97706] to-[#92400e] hover:!bg-gray-700 !text-white"
            >
              <FileText className="h-5 w-5" />
              {savebill.isPending ? 'Saving...' : 'Save as Draft'}
            </GenericButton>

            <GenericButton
              type="button"
              onClick={handleSaveReceipt}
              disabled={savebill.isPending}
            >
              {savebill.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {savebill.isPending ? 'Saving...' : 'Save Bill'}
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Insufficient Stock Modal */}
      {showStockErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-[#d3c4af]/20 bg-red-50 px-5 py-4 dark:border-slate-700 dark:bg-red-950/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
                  Insufficient Stock
                </h3>
                <p className="text-xs text-[#817563] dark:text-slate-400">
                  This bill cannot be completed with the available stock.
                </p>
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
                <p className="break-words text-sm font-medium leading-6 text-red-700 dark:text-red-300">
                  {stockErrorMessage}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#4f4535] dark:text-slate-300">
                You can save this bill as a draft and complete it later after
                the required stock is available.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-4 sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setShowStockErrorModal(false)}
                className="rounded-lg border border-[#d3c4af]/40 px-4 py-2.5 text-sm font-medium text-[#4f4535] transition-colors hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowStockErrorModal(false);
                  void handleSaveAsDraft();
                }}
                disabled={savebill.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savebill.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {savebill.isPending ? 'Saving...' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div>
                <label className="block text-sm font-semibold text-[#4f4535] dark:text-slate-300 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientFormData.fullName}
                  onChange={(e) => setClientFormData({ ...clientFormData, fullName: e.target.value })}
                  placeholder="Enter client name"
                  className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${clientFormErrors.fullName ? 'ring-2 ring-red-500' : ''}`}
                />
                {clientFormErrors.fullName && <p className="mt-1 text-xs text-red-500">{clientFormErrors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4f4535] dark:text-slate-300 mb-1.5">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientFormData.phoneNumber}
                  onChange={(e) => setClientFormData({ ...clientFormData, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                  className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${clientFormErrors.phoneNumber ? 'ring-2 ring-red-500' : ''}`}
                />
                {clientFormErrors.phoneNumber && <p className="mt-1 text-xs text-red-500">{clientFormErrors.phoneNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4f4535] dark:text-slate-300 mb-1.5">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={clientFormData.address}
                  onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
                  placeholder="Enter address"
                  rows={2}
                  className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white resize-none ${clientFormErrors.address ? 'ring-2 ring-red-500' : ''}`}
                />
                {clientFormErrors.address && <p className="mt-1 text-xs text-red-500">{clientFormErrors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4f4535] dark:text-slate-300 mb-1.5">
                  Opening Balance (G)
                </label>
                <input
                  type="text"
                  value={clientFormData.openingBalance}
                  onChange={(e) => setClientFormData({ ...clientFormData, openingBalance: e.target.value })}
                  placeholder="0.000"
                  className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white font-mono ${clientFormErrors.openingBalance ? 'ring-2 ring-red-500' : ''}`}
                />
                {clientFormErrors.openingBalance && <p className="mt-1 text-xs text-red-500">{clientFormErrors.openingBalance}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#d3c4af]/10 p-4 dark:border-slate-700">
              <button
                onClick={() => setShowClientModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <GenericButton
                type="button"
                onClick={handleAddClientFromPopup}
                className="!bg-[#785600] hover:!bg-[#5d4200] !text-white !px-4 !py-2 !text-sm"
              >
                Add Client
              </GenericButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptAdd;