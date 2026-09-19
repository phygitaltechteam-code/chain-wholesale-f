import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Save,
  Edit,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  UserPlus,
  Printer,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetKarigars,
} from '@/components/joborder/karigar/karigarapi';
import AddKarigarModal from '@/components/setllement/AddKarigarModal';
import { useGetItems } from '@/lib/api/items';
import { useGetSizes } from '@/lib/api/sizes';
import toast from 'react-hot-toast';
import { z } from 'zod';
import GenericInputField from '../Forms/Input/GenericInputField';
import { KarigarSearch } from './KarigarSearch';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { printReceipt } from '@/utils/printReceipt';
import { useKarigarBill } from '@/lib/api/karigarBill';

interface ReceiptItem {
  id: string;
  srNo: number;
  item: string;
  size: string;
  purity: number | string;
  availableQty: number | string;
  grossWt: number | string;
  wastage: number | string;
  srp: number | string;
  fineWt: number;
  laborRate: number | string;
  isLoadingQty?: boolean;
}

interface ReceiptFormData {
  KarigarId: string;
  KarigarName: string;
  date: string;
  items: ReceiptItem[];
  customerWeight: number | string;
  totalFine: number | string;
  goldInfo: {
    karat: string;
    rate: number;
    weight: number;
    totalAmount: number;
  };
}

interface BillGroup {
  id: string;
  srNo: number;
  dateTime: string;
  billNo: string;
  KarigarName: string;
  phoneNumber: string;
  receive: number;
  pending: number;
  type: 'DRAFT' | 'BILL';
  createdAt: string;
  items: {
    itemId?: string;
    sizeId?: string;
    item: string;
    size: string;
    purity: number;
    availableQty?: number;
    finWt: number;
    srp: number;
    grossWeight: number;
    laborRate?: number;
  }[];
  // Formatted display strings with line breaks
  displayItems: string;
  displaySizes: string;
  displayPurity: string;
  displayGrossWt: string;
  displayFinWt: string;
  displaySRP: string;
  totalFinWt: number;
  totalSRP: number;
}



const ReceiptAdd: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date[]>([]);
  const [formData, setFormData] = useState<ReceiptFormData>({
    KarigarId: '',
    KarigarName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    customerWeight: 0,
    totalFine: 0,
    goldInfo: {
      karat: '22K',
      rate: 0,
      weight: 0,
      totalAmount: 0,
    },
  });
  const [showKarigarModal, setShowKarigarModal] = useState(false);
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');

  const [savedBillData, setSavedBillData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState<'draft' | 'bill' | null>(
    null,
  );
  const isSubmittingRef = useRef(false);

  // Refs for debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<{
    item: string;
    size: string;
    purity: number;
  } | null>(null);

  // Fetch data from API
  const { data: Karigars = [], refetch: refetchKarigars } = useGetKarigars();
  const { data: rawItems = [] } = useGetItems();
  const items = useMemo(
    () =>
      (Array.isArray(rawItems) ? rawItems : []).filter((item: any) => {
        const name = item?.name?.trim().toLowerCase() || '';
        return name !== 'gold' && !name.includes('(s)');
      }),
    [rawItems],
  );
  const { data: sizes = [] } = useGetSizes();


  // API hooks
  const getpdfheaderdata = useGetHeader();
  const savebill = useKarigarBill();

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<keyof ReceiptItem>(
    (index, field, weight) => {
      handleItemChange(index, field, weight);
    },
  );

  const handleKarigarSuccess = async (newKarigar?: any) => {
    setShowKarigarModal(false);
    const refetched = await refetchKarigars();
    const allKarigars = (refetched?.data as any[]) || [];
    
    if (newKarigar) {
      const foundKarigar = allKarigars.find((c: any) => c.id === newKarigar.id) || newKarigar;
      handleKarigarSelect(foundKarigar);
    }
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      srNo: formData.items.length + 1,
      item: '',
      size: '',
      purity: '',
      availableQty: '',
      grossWt: '',
      wastage: '',
      srp: '',
      fineWt: 0,
      laborRate: '',
      isLoadingQty: false,
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
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
      items: updatedItems,
    });
    toast.success('Item removed');
  };



  const calculateFineWeight = (
    purity: number,
    grossWt: number,
    srp: number,
  ) => {
    const effectivePurity = (purity + srp) / 100;
    return Math.round(grossWt * effectivePurity * 1000) / 1000;
  };

  // Update Total Fine calculation (Fine Wt + Labor Rate)
  const updateTotalFine = (items: ReceiptItem[]) => {
    const total = items.reduce(
      (sum, item) => sum + (item.fineWt || 0) + (Number(item.laborRate) || 0),
      0,
    );
    return Math.round(total * 1000) / 1000;
  };

  const handleItemChange = (
    index: number,
    field: keyof ReceiptItem,
    value: any,
  ) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];

    if (
      field === 'grossWt' ||
      field === 'availableQty' ||
      field === 'purity' ||
      field === 'srp' ||
      field === 'laborRate' ||
      field === 'wastage'
    ) {
      const strValue =
        value === null || value === undefined ? '' : String(value);
      if (strValue.includes('.')) {
        const decimalPlaces = strValue.split('.')[1]?.length || 0;
        if (decimalPlaces > 3) {
          toast.error(`${field} can have maximum 3 decimal places`);
          return;
        }
      }
      updatedItems[index] = {
        ...item,
        [field]: strValue,
      };
    } else {
      updatedItems[index] = {
        ...item,
        [field]: value,
      };
    }

    // Recalculate fine weight for the changed item
    const currentItem = updatedItems[index];
    if (field === 'purity' || field === 'grossWt' || field === 'srp') {
      const purity = Number(currentItem.purity) || 0;
      const grossWt = Number(currentItem.grossWt) || 0;
      const srp = Number(currentItem.srp) || 0;

      currentItem.fineWt = calculateFineWeight(purity, grossWt, srp);
    }

    // Update total fine
    const newTotalFine = updateTotalFine(updatedItems);

    setFormData({
      ...formData,
      items: updatedItems,
      totalFine: newTotalFine,
    });
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
      const purityNum = Number(item.purity) || 0;
      const grossWtNum = Number(item.grossWt) || 0;
      const srpNum = Number(item.srp) || 0;

      if (!item.item || !item.size) {
        toast.error(`Row ${i + 1}: Please select item and size`);
        return false;
      }
      if (purityNum <= 0 || purityNum > 100) {
        toast.error(`Row ${i + 1}: Purity must be between 1 and 100`);
        return false;
      }
      if (grossWtNum <= 0) {
        toast.error(`Row ${i + 1}: Please enter a valid gross weight`);
        return false;
      }
      if (srpNum < 0) {
        toast.error(`Row ${i + 1}: Please enter a valid SRP`);
        return false;
      }
    }
    return true;
  };

  // Handle Advance (Customer Weight) change
  const handleCustomerWeightChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, customerWeight: value }));
  };

  // Handle Total Fine (Issue) change - Manual edit
  const handleTotalFineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, totalFine: value }));
  };

  const calculateTotalGrossWt = () => {
    return formData.items.reduce(
      (total, item) => total + (Number(item.grossWt) || 0),
      0,
    );
  };

  const getKarigarDueBalance = (Karigar: any) => {
    if (!Karigar) return 0;
    const due =
      Karigar?.due !== null && Karigar?.due !== undefined
        ? Number(Karigar.due)
        : NaN;
    if (!isNaN(due)) {
      return Math.round(due * 1000) / 1000;
    }
    const openingBalance = Number(Karigar?.openingBalance) || 0;
    return Math.round(openingBalance * 1000) / 1000;
  };

  const calculateRemainingWeight = () => {
    const Karigar = Karigars.find((c: any) => c.id === formData.KarigarId);
    const dueBalance = getKarigarDueBalance(Karigar);
    const advance = Number(formData.customerWeight) || 0;
    const totalFineWeight =
      formData.totalFine !== undefined && formData.totalFine !== ''
        ? Number(formData.totalFine) || 0
        : formData.items.reduce(
          (sum, item) => sum + (Number(item.fineWt) || 0),
          0,
        );
    // Remaining Balance = Total Fine Wt + Due Balance - Advance
    const remaining = totalFineWeight + dueBalance - advance;
    return Math.round(remaining * 1000) / 1000;
  };

  const formatNumberThreeDecimals = (value: number) => {
    if (value === 0 || !value) return '0';
    const formatted = Number(value.toFixed(3)).toString();
    return formatted;
  };

  const handlePrintReceipt = (responseData?: any) => {
    const Karigar = Karigars.find((c: any) => c.id === formData.KarigarId);
    const KarigarDue = getKarigarDueBalance(Karigar);

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'pm' : 'am'}`;

    const advance =
      Number(responseData?.customerWeight ?? formData.customerWeight) || 0;
    const remaining =
      Number(responseData?.remainingWeight ?? calculateRemainingWeight()) || 0;

    const itemsList = formData.items.map((item) => ({
      item: item.item || '-',
      size: item.size || '-',
      purity: Number(item.purity) || 0,
      grossWeight: Number(item.grossWt) || 0,
      srp: Number(item.srp) || 0,
      finWt: Number(item.fineWt) || 0,
      laborRate: Number(item.laborRate) || 0,
    }));

    const totalFineWt = itemsList.reduce((sum, i) => sum + i.finWt, 0);

    printReceipt(
      {
        clientName: formData.KarigarName || Karigar?.fullName || 'N/A',
        phoneNumber: Karigar?.phoneNumber || 'N/A',
        dateTime: dateStr,
        items: itemsList,
        totalFineWt,
        receive: advance,
        dueBalance: KarigarDue,
        remainingBalance: remaining,
        hideLaborRate: true,
      },
      getpdfheaderdata,
    );
  };

  // Save as Draft - Use 'DRAFT' (uppercase)
  const handleSaveAsDraft = async () => {
    if (isSubmittingRef.current || savebill.isPending) {
      return;
    }

    if (!formData.KarigarId || !formData.KarigarName) {
      toast.error('Please select a Karigar');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmittingType('draft');

    try {
      const totalGrossWt = calculateTotalGrossWt();
      const remainingWeight = calculateRemainingWeight();

      const billData = {
        karigarId: formData.KarigarId,
        purchaseDate: formData.date,
        items: formData.items.map((item) => ({
          itemId: items.find((i: any) => i.name === item.item)?.id,
          itemName: item.item,
          sizeId: sizes.find((s: any) => s.size === item.size)?.id,
          size: item.size,
          purity: Number(item.purity) || 0,
          availableQty: Number(item.availableQty) || 0,
          grossWeight: Number(Number(item.grossWt || 0).toFixed(3)),
          srp: Number(item.srp) || 0,
          fineWeight: Number(Number(item.fineWt || 0).toFixed(3)),
          laborRate: Number(item.laborRate) || 0,
        })),
        karigarWeight: Number(Number(formData.customerWeight || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'DRAFT',
      };

      await savebill.mutateAsync(billData);
      // toast.success('Bill saved as draft successfully!');
      navigate({ to: '/karigarbilling' });
    } catch (error) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmittingType(null);
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  // Save as Completed - Use 'BILL' (uppercase)
  const handleSaveReceipt = async () => {
    if (isSubmittingRef.current || savebill.isPending) {
      return;
    }

    if (!formData.KarigarId || !formData.KarigarName) {
      toast.error('Please select a Karigar');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!validateAllItems()) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmittingType('bill');

    try {
      const totalGrossWt = calculateTotalGrossWt();
      const remainingWeight = calculateRemainingWeight();

      const billData = {
        karigarId: formData.KarigarId,
        purchaseDate: formData.date,
        items: formData.items.map((item) => ({
          itemId: items.find((i: any) => i.name === item.item)?.id,
          itemName: item.item,
          sizeId: sizes.find((s: any) => s.size === item.size)?.id,
          size: item.size,
          purity: Number(item.purity) || 0,
          availableQty: Number(item.availableQty) || 0,
          grossWeight: Number(Number(item.grossWt || 0).toFixed(3)),
          srp: Number(item.srp) || 0,
          fineWeight: Number(Number(item.fineWt || 0).toFixed(3)),
          laborRate: Number(item.laborRate) || 0,
        })),
        karigarWeight: Number(Number(formData.customerWeight || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'BILL',
      };

      const response = await savebill.mutateAsync(billData);
      // toast.success('Bill saved successfully!');

      // Store the bill data for printing
      setSavedBillData(response?.data || billData);

      // Print the receipt after successful save
      setTimeout(() => {
        handlePrintReceipt(response?.data || billData);
      }, 500);

      // Navigate after print
      setTimeout(() => {
        navigate({ to: '/karigarbilling' });
      }, 1500);
    } catch (error: any) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmittingType(null);
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
          className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Remove row"
          disabled={formData.items.length <= 1}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleAddItem}
          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
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
            onChange={(e) =>
              handleItemChange(actualIndex, 'item', e.target.value)
            }
            className="w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1.5 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select Item</option>
            {items.map((item: any) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
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
            onChange={(e) =>
              handleItemChange(actualIndex, 'size', e.target.value)
            }
            className="w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1.5 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select Size</option>
            {sizes.map((size: any) => (
              <option key={size.id} value={size.size}>
                {size.size}
              </option>
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
              type="text"
              inputMode="decimal"
              step="0.001"
              min="0"
              max="100"
              value={
                item.purity !== undefined && item.purity !== null
                  ? item.purity
                  : ''
              }
              onChange={(e) =>
                handleItemChange(actualIndex, 'purity', e.target.value)
              }
              placeholder="0.000"
              suffix="%"
              className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
              decimalScale={3}
            />
            {item.isLoadingQty && (
              <Loader2 className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#785600]" />
            )}
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
            type="text"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={
              item.grossWt !== undefined && item.grossWt !== null
                ? item.grossWt
                : ''
            }
            {...getScaleProps(actualIndex, 'grossWt')}
            onChange={(e) => {
              handleItemChange(actualIndex, 'grossWt', e.target.value);
            }}
            placeholder="0.000"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
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
            type="text"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={item.srp !== undefined && item.srp !== null ? item.srp : ''}
            onChange={(e) =>
              handleItemChange(actualIndex, 'srp', e.target.value)
            }
            placeholder="0.000"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
            decimalScale={3}
          />
        );
      },
    },
    {
      key: 'fineWt',
      header: 'Fine Wt (G)',
      render: (item) => (
        <div className="flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-md border border-[#c5b497] bg-[#eae3d5] px-2 py-1.5 text-xs shadow-inner dark:border-slate-600 dark:bg-slate-800">
          <span className="font-mono font-bold text-black dark:text-amber-400">
            {formatNumberThreeDecimals(item.fineWt)}
          </span>
          <span className="text-gray-500 text-[10px] dark:text-slate-400">
            G
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/karigarbilling' })}
              className="flex flex-shrink-0 items-center gap-2 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
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

        {/* Karigar & Date Section */}
        <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                Karigar <span className="text-red-500">*</span>
              </label>

              <KarigarSearch
                Karigars={Karigars as any[]}
                selectedKarigar={
                  Karigars.find(
                    (Karigar: any) => Karigar.id === formData.KarigarId,
                  ) || null
                }
                onSelectKarigar={(Karigar: any) => {
                  setFormData((prev) => ({
                    ...prev,
                    KarigarId: Karigar.id,
                    KarigarName: Karigar.fullName || Karigar.fullname || '',
                  }));
                }}
                onClearKarigar={() => {
                  setFormData((prev) => ({
                    ...prev,
                    KarigarId: '',
                    KarigarName: '',
                  }));
                }}
                isLoading={false}
                onAddNewKarigar={() => setShowKarigarModal(true)}
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Items
            </h3>
            <p className="mt-1 text-xs text-[#4f4535]/60 dark:text-slate-400">

            </p>
          </div>

          <div className="w-full min-w-0 overflow-hidden [&_table]:w-full [&_table]:table-fixed [&_td]:px-1.5 [&_td]:py-1.5 [&_td]:text-xs [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[11px]">
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
        {/* PAYMENT SUMMARY - Left Aligned with In-Card Editable Inputs */}
        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {/* Total Fine Wt (Editable) */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
              <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
                Total Fine Wt
              </span>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  disabled
                  value={formData.totalFine || ''}
                  onChange={handleTotalFineChange}
                  placeholder="0.000"
                  className="font-mono w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
                  G
                </span>
              </div>
            </div>

            {/* Advance (Editable) */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
              <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
                Advance
              </span>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.customerWeight || ''}
                  onChange={handleCustomerWeightChange}
                  placeholder="0.000"
                  className="font-mono w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                />
                <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
                  G
                </span>
              </div>
            </div>

            {/* Due Balance (Karigar Due - Read Only) */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
              <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
                Due Balance
              </span>
              <span className="font-mono text-sm font-semibold text-black dark:text-black">
                {formatNumberThreeDecimals(
                  getKarigarDueBalance(
                    Karigars.find(
                      (Karigar: any) => Karigar.id === formData.KarigarId,
                    ),
                  ),
                )}{' '}
                G
              </span>
            </div>

            {/* Remaining Balance (Calculated: Due Balance - Total Fine Wt - Advance) */}
            <div className="flex items-center justify-between bg-[#f4f0e5] px-4 py-3 dark:bg-slate-800">
              <span className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                Remaining Balance
              </span>
              <span
                className={
                  'font-mono text-base font-bold text-black dark:text-black'
                }
              >
                {formatNumberThreeDecimals(calculateRemainingWeight())} G
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 z-50 border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-4 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <GenericButton
              type="button"
              onClick={handleSaveAsDraft}
              disabled={isSubmitting || savebill.isPending}
              variant="secondary"
            >
              {submittingType === 'draft' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              {submittingType === 'draft' ? 'Saving...' : 'Save as Draft'}
            </GenericButton>

            <GenericButton
              type="button"
              onClick={handleSaveReceipt}
              disabled={isSubmitting || savebill.isPending}
            >
              {submittingType === 'bill' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {submittingType === 'bill' ? 'Saving...' : 'Save & Print Bill'}
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Insufficient Stock Modal */}
      {showStockErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-[#d3c4af]/20 bg-red-50/80 px-5 py-3.5 dark:border-slate-700 dark:bg-red-950/30">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                Insufficient Stock (स्टॉक कम है)
              </h3>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs leading-relaxed text-[#4f4535] dark:text-slate-300">
                Not enough stock available to complete this bill. You can save
                it as a draft.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setShowStockErrorModal(false)}
                className="rounded-lg border border-[#d3c4af]/40 px-3.5 py-1.5 text-xs font-semibold text-[#4f4535] transition-colors hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowStockErrorModal(false);
                  void handleSaveAsDraft();
                }}
                disabled={isSubmitting || savebill.isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting || savebill.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                {isSubmitting || savebill.isPending
                  ? 'Saving...'
                  : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddKarigarModal
        isOpen={showKarigarModal}
        onClose={() => setShowKarigarModal(false)}
        onSuccess={handleKarigarSuccess}
      />
    </div>
  );
};

export default ReceiptAdd;
