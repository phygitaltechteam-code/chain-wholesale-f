import React, { useState, useEffect } from 'react';
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
import { useGetQuantity, useBill } from '@/lib/api/bill';

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
  goldInfo: {
    karat: string;
    rate: number;
    weight: number;
    totalAmount: number;
  };
}

// Client Schema for validation
const ClientSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Address is required"),
  openingBalance: z.number().min(0, "Opening balance cannot be negative"),
});

const ReceiptAdd: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date[]>([]);
  const [formData, setFormData] = useState<ReceiptFormData>({
    clientId: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
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

  // Fetch data from API
  const { data: clients = [], refetch: refetchClients } = useGetClients();
  const { data: items = [] } = useGetItems();
  const { data: sizes = [] } = useGetSizes();
  const createClient = useCreateClient();

  // API hooks
  const getQuantity = useGetQuantity();
  const savebill = useBill();

  // Available options for dropdowns
  const purityOptions = ['24K', '22K', '18K', '14K', '916'];

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

  // Add new row
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

  // Remove row
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

  // Function to fetch quantity from API
  const fetchQuantity = async (index: number, item: string, size: string, purity: number) => {
    if (!item || !size || !purity || purity <= 0) {
      return;
    }

    // Find the item and size IDs
    const selectedItem = items.find((i: any) => i.name === item);
    const selectedSize = sizes.find((s: any) => s.size === size);

    if (!selectedItem || !selectedSize) {
      toast.error('Item or size not found');
      return;
    }

    // Set loading state
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((entry, i) =>
        i === index ? { ...entry, isLoadingQty: true } : entry
      )
    }));

    try {
      // Call the API with payload
      const response = await getQuantity.mutateAsync({
        itemId: selectedItem.id,
        sizeId: selectedSize.id,
        purity: purity
      });

      console.log('API Response:', response);

      // Handle response - getting weight from response
      let weight = 0;

      // Check different possible response structures
      if (response?.data?.weight !== undefined && response.data.weight !== null) {
        weight = response.data.weight;
      } else if (response?.weight !== undefined && response.weight !== null) {
        weight = response.weight;
      } else if (response?.data?.quantity !== undefined && response.data.quantity !== null) {
        weight = response.data.quantity;
      } else if (response?.quantity !== undefined && response.quantity !== null) {
        weight = response.quantity;
      }

      console.log('Extracted weight:', weight);

      // Update the available quantity with the weight
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

      // Show appropriate message based on weight
      if (weight > 0) {
        toast.success(`Available quantity: ${weight}`);
      } else {
        // Don't show error, just show info
        toast('No quantity available for this combination', {
          icon: 'ℹ️',
          duration: 3000,
        });
      }

    } catch (error: any) {
      console.error('Error fetching quantity:', error);
      // Only show error if it's a real error, not just "no quantity"
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

  // Calculate fine weight: fineWt = (purity% * grossWt) + srp
  const calculateFineWeight = (purity: number, grossWt: number, srp: number) => {
    const purityFactor = purity / 100;
    return (grossWt * purityFactor) + srp;
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    updatedItems[index] = {
      ...item,
      [field]: value
    };

    // Auto-calculate fine weight: fineWt = (purity% * grossWt) + srp
    if (field === 'purity' || field === 'grossWt' || field === 'srp') {
      const purity = field === 'purity' ? value : updatedItems[index].purity;
      const grossWt = field === 'grossWt' ? value : updatedItems[index].grossWt;
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

    // If purity is changed, fetch quantity
    if (field === 'purity') {
      const currentItem = updatedItems[index];
      if (currentItem.item && currentItem.size && currentItem.purity > 0) {
        // Debounce the API call
        const timeoutId = setTimeout(() => {
          fetchQuantity(index, currentItem.item, currentItem.size, currentItem.purity);
        }, 500);

        // Store timeout ID for cleanup
        (window as any)[`timeout-${index}`] = timeoutId;
      }
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.keys(window).forEach(key => {
        if (key.startsWith('timeout-')) {
          clearTimeout((window as any)[key]);
        }
      });
    };
  }, []);

  // Validate all items before submit
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

  const handleGoldInfoChange = (field: keyof typeof formData.goldInfo, value: any) => {
    const updatedGoldInfo = {
      ...formData.goldInfo,
      [field]: value
    };
    if (field === 'rate' || field === 'weight') {
      const rate = field === 'rate' ? value : formData.goldInfo.rate;
      const weight = field === 'weight' ? value : formData.goldInfo.weight;
      updatedGoldInfo.totalAmount = Number(rate) * Number(weight);
    }
    setFormData({
      ...formData,
      goldInfo: updatedGoldInfo
    });
  };

  // Calculate total bill amount
  const calculateTotalBill = () => {
    // Total Bill = Total SRP + Total Labor
    return calculateTotalSRP() + calculateTotalLabor();
  };

  const handleSaveReceipt = async () => {
    if (!formData.clientId || !formData.clientName) {
      toast.error('Please select a client');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate all items at once
    if (!validateAllItems()) {
      return;
    }

    try {
      // Calculate all totals
      const totalGrossWt = calculateTotalGrossWt();
      const totalFineWt = calculateTotalFineWt();
      const totalSRP = calculateTotalSRP();
      const totalLabor = calculateTotalLabor();
      const totalBill = calculateTotalBill();

      // Prepare data for API - exactly as requested
      const billData = {
        clientId: formData.clientId,
        datetime: formData.date,
        items: formData.items.map(item => ({
          itemId: items.find((i: any) => i.name === item.item)?.id,
          itemName: item.item,
          sizeId: sizes.find((s: any) => s.size === item.size)?.id,
          size: item.size,
          purity: item.purity,
          availableQty: item.availableQty,
          grossWt: item.grossWt,
          srp: item.srp,
          fineWt: item.fineWt,
          laborRate: item.laborRate || 0
        })),
        totals: {
          totalGrossWt: totalGrossWt,
          totalFineWt: totalFineWt,
          totalSRP: totalSRP,
          totalLabor: totalLabor,
          totalItems: formData.items.length
        }
      };

      console.log('Sending to backend:', billData);

      await savebill.mutateAsync(billData);
      toast.success(`Receipt saved successfully! Total Bill: ₹${totalBill.toFixed(2)}`);

      // Reset form after successful save
      setFormData({
        clientId: '',
        clientName: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        goldInfo: {
          karat: '22K',
          rate: 0,
          weight: 0,
          totalAmount: 0
        }
      });

      // Navigate back to billing page
      navigate({ to: '/billing' });
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast.error('Failed to save receipt');
    }
  };

  // Calculate totals
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

  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  const formatNumberThreeDecimals = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  // Custom action renderer for GenericTable - Now shows Add/Remove buttons
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

  // Define columns for GenericTable
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
        const actualIndex = formData.items.indexOf(item);
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
        const actualIndex = formData.items.indexOf(item);
        return (
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={item.purity || ''}
              onChange={(e) => handleItemChange(actualIndex, 'purity', parseFloat(e.target.value) || 0)}
              placeholder="91.6"
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
        const actualIndex = formData.items.indexOf(item);
        return (
          <input
            type="number"
            step="0.001"
            min="0"
            value={item.grossWt || ''}
            onChange={(e) => handleItemChange(actualIndex, 'grossWt', parseFloat(e.target.value) || 0)}
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
        const actualIndex = formData.items.indexOf(item);
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
        const actualIndex = formData.items.indexOf(item);
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

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 pb-32">
        {/* Header - Removed top save button */}
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
              title="Create Receipt"
              subtitle="Add new receipt with items and gold information"
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
                onDateChange={(dates) => setSelectedDate(dates)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#4f4535] dark:text-slate-300 uppercase tracking-wider">
              Items
            </h3>
            <div className="flex gap-2">
              <GenericButton
                onClick={handleAddItem}
                className="!bg-[#785600] hover:!bg-[#5d4200] !text-white !px-4 !py-2 !text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </GenericButton>
            </div>
          </div>

          <GenericTable<ReceiptItem>
            data={formData.items}
            columns={columns}
            emptyMessage="No items added yet. Click 'Add Item' to start."
            isLoading={false}
            renderActions={renderActions}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>

        {/* Totals Section */}
        {formData.items.length > 0 && (
          <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <h3 className="text-sm font-bold text-[#4f4535] dark:text-slate-300 uppercase tracking-wider mb-3">
              Receipt Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4f4535] dark:text-slate-400 mb-1">
                  Total Gross Wt
                </label>
                <div className="w-full rounded-lg bg-[#f4f4f2] px-4 py-2.5 text-sm font-bold text-[#1a1c1b] dark:bg-slate-800 dark:text-white font-mono">
                  {formatNumberThreeDecimals(calculateTotalGrossWt())} G
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4f4535] dark:text-slate-400 mb-1">
                  Total Fine Wt
                </label>
                <div className="w-full rounded-lg bg-[#f4f4f2] px-4 py-2.5 text-sm font-bold text-[#785600] dark:bg-slate-800 dark:text-amber-400 font-mono">
                  {formatNumberThreeDecimals(calculateTotalFineWt())} G
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4f4535] dark:text-slate-400 mb-1">
                  Net Weight
                </label>
                <div className="w-full rounded-lg bg-[#f4f4f2] px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatNumberThreeDecimals(calculateTotalGrossWt() - calculateTotalFineWt())} G
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4f4535] dark:text-slate-400 mb-1">
                  Total SRP
                </label>
                <div className="w-full rounded-lg bg-[#f4f4f2] px-4 py-2.5 text-sm font-bold text-[#1a1c1b] dark:bg-slate-800 dark:text-white font-mono">
                  ₹{calculateTotalSRP().toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4f4535] dark:text-slate-400 mb-1">
                  Total Labor
                </label>
                <div className="w-full rounded-lg bg-[#f4f4f2] px-4 py-2.5 text-sm font-bold text-[#1a1c1b] dark:bg-slate-800 dark:text-white font-mono">
                  ₹{calculateTotalLabor().toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4f4535] dark:text-slate-400 mb-1">
                  Total Bill
                </label>
                <div className="w-full rounded-lg bg-[#785600] px-4 py-2.5 text-sm font-bold text-white dark:bg-amber-600 font-mono">
                  ₹{calculateTotalBill().toFixed(2)}
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
              onClick={handleSaveReceipt}
              disabled={savebill.isPending}
              className="!bg-[#785600] hover:!bg-[#5d4200] !text-white !px-8 !py-3 !text-base !font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {savebill.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {savebill.isPending ? 'Saving...' : 'Save Receipt'}
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