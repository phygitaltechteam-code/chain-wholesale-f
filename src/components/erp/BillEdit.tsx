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
import { useGetClients, useCreateClient } from '@/lib/api/client';
import { useGetItems } from '@/lib/api/items';
import { useGetSizes } from '@/lib/api/sizes';
import toast from 'react-hot-toast';
import { z } from 'zod';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import { useGetQuantity, useGetBillByid, useBillUpdate } from '@/lib/api/bill';
import { Route } from '@/routes/_app/billiupdate.$id';
import GenericInputField from '../Forms/Input/GenericInputField';
import { useGetHeader } from '@/lib/api/headerapi';
import { ClientSearch } from '../reciept/ClientSearch';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { printReceipt } from '@/utils/printReceipt';

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
  itemId?: string;
  sizeId?: string;
}

interface ReceiptFormData {
  clientId: string;
  clientName: string;
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
  clientName: string;
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
  displayItems: string;
  displaySizes: string;
  displayPurity: string;
  displayGrossWt: string;
  displayFinWt: string;
  displaySRP: string;
  totalFinWt: number;
  totalSRP: number;
}

const ClientSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  openingBalance: z.number().min(0, 'Opening balance cannot be negative'),
});

const BillEdit: React.FC = () => {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date[]>([]);
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');

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
      totalAmount: 0,
    },
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
  const [billType, setBillType] = useState<'DRAFT' | 'BILL'>('DRAFT');
  const [billNo, setBillNo] = useState<string>('');
  const [savedRemaining, setSavedRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<{
    item: string;
    size: string;
    purity: number;
  } | null>(null);

  const { data: clients = [], refetch: refetchClients } = useGetClients();
  const { data: items = [] } = useGetItems();
  const { data: sizes = [] } = useGetSizes();
  const createClient = useCreateClient();

  const getpdfheaderdata = useGetHeader();
  const getQuantity = useGetQuantity();
  const { data: billResponse, isLoading: isLoadingBill } = useGetBillByid(id);
  const updateBill = useBillUpdate();

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<keyof ReceiptItem>(
    (index, field, weight) => {
      handleItemChange(index, field, weight);
    },
  );

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

  // Add empty row function
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
      itemId: '',
      sizeId: '',
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const loadedBillIdRef = useRef<string | null>(null);

  useEffect(() => {
    console.log('Bill Response:', billResponse);

    if (!billResponse) {
      return;
    }

    // Try to get bill data from different possible response structures
    let billData = billResponse;

    // If the response has a data property, use that
    if (billResponse.data && typeof billResponse.data === 'object') {
      billData = billResponse.data;
    }

    // If the response has a bill property, use that
    if (billResponse.bill && typeof billResponse.bill === 'object') {
      billData = billResponse.bill;
    }

    console.log('Extracted Bill Data:', billData);

    if (!billData || !billData.id) {
      console.log('No bill ID found, adding empty row');
      if (formData.items.length === 0) {
        handleAddItem();
      }
      return;
    }

    if (loadedBillIdRef.current === billData.id && isDataLoaded) {
      return;
    }
    loadedBillIdRef.current = billData.id;
    initialStockFetchedRef.current = false;

    // Handle receipt items
    const receiptItems =
      billData.receiptItems ||
      billData.items ||
      billData.billItems ||
      [];

    console.log('Receipt Items:', receiptItems);

    let itemsList: ReceiptItem[] = [];
    if (receiptItems.length > 0) {
      itemsList = receiptItems.map((item: any, index: number) => {
        const purity =
          item.purity !== undefined && item.purity !== null ? item.purity : '';
        const grossWt =
          item.grossWeight !== undefined && item.grossWeight !== null
            ? item.grossWeight
            : item.grossWt !== undefined && item.grossWt !== null
              ? item.grossWt
              : '';
        const srp =
          item.srp !== undefined && item.srp !== null ? item.srp : '';
        const laborRate =
          item.laborRate !== undefined && item.laborRate !== null
            ? item.laborRate
            : '';

        let fineWt = item.fineWeight ?? item.fineWt ?? item.finWt;
        if (fineWt === undefined || fineWt === null || fineWt === 0 || fineWt === '') {
          const p = Number(purity) || 0;
          const g = Number(grossWt) || 0;
          const s = Number(srp) || 0;
          fineWt = p && g ? calculateFineWeight(p, g, s) : 0;
        } else {
          fineWt = Number(fineWt);
        }

        return {
          id: item.id || `item-${Date.now()}-${index}`,
          srNo: index + 1,
          item: item.item?.name || item.itemName || item.name || '',
          size: item.size?.size || item.sizeName || item.size || '',
          purity: purity,
          availableQty:
            item.availableQty !== undefined && item.availableQty !== null
              ? item.availableQty
              : '',
          grossWt: grossWt,
          wastage: '',
          srp: srp,
          fineWt: Math.round(fineWt * 1000) / 1000,
          laborRate: laborRate,
          isLoadingQty: false,
          itemId: item.itemID || item.itemId || item.item?.id || '',
          sizeId: item.sizeID || item.sizeId || item.size?.id || '',
        };
      });

      console.log('Mapped Items:', itemsList);
    }

    const initialTotalFine = updateTotalFine(itemsList);
    const bNumber =
      billData.billNumber || billData.billNo || (billData as any).receiptNo || '';
    setBillNo(bNumber);

    if (
      billData.remainingWeight !== undefined &&
      billData.remainingWeight !== null
    ) {
      setSavedRemaining(Number(billData.remainingWeight));
    }

    // Map the data to form fields
    const mappedData = {
      clientId:
        billData.clientID || billData.clientId || billData.client?.id || '',
      clientName:
        billData.client?.fullName ||
        billData.clientName ||
        billData.client?.fullname ||
        '',
      date: billData.receiptDate
        ? new Date(billData.receiptDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      customerWeight:
        billData.customerWeight ??
        billData.advance ??
        billData.receivedWeight ??
        0,
      totalFine: initialTotalFine,
    };

    console.log('Mapped Form Data:', mappedData);

    // Set all form data at once to prevent multiple updates
    setFormData((prev) => ({
      ...prev,
      clientId: mappedData.clientId,
      clientName: mappedData.clientName,
      date: mappedData.date,
      customerWeight: mappedData.customerWeight,
      totalFine: mappedData.totalFine,
      items: itemsList.length > 0 ? itemsList : prev.items,
    }));

    const currentType =
      (billData.type as 'DRAFT' | 'BILL') ||
      (billData.remainingWeight === 0 ? 'BILL' : 'DRAFT');
    setBillType(currentType);

    setIsDataLoaded(true);
    console.log('Data loading completed');
  }, [billResponse, isDataLoaded]);

  // Also log when formData changes
  useEffect(() => {
    console.log('Form Data Updated:', formData);
  }, [formData]);

  const handleAddClientFromPopup = async () => {
    try {
      const parsed = ClientSchema.parse({
        fullName: clientFormData.fullName.trim(),
        phoneNumber: clientFormData.phoneNumber.trim(),
        address: clientFormData.address.trim(),
        openingBalance: parseFloat(clientFormData.openingBalance) || 0,
      });

      const res = await createClient.mutateAsync({
        fullName: parsed.fullName,
        phoneNumber: parsed.phoneNumber,
        address: parsed.address,
        openingBalance: parsed.openingBalance,
      });

      const newClient = res?.data || res;

      setClientFormData({
        fullName: '',
        phoneNumber: '',
        address: '',
        openingBalance: '',
      });
      setClientFormErrors({});
      setShowClientModal(false);
      const refetched = await refetchClients();
      const allClients = (refetched?.data as any[]) || [];
      const foundClient =
        allClients.find(
          (c: any) =>
            c.id === newClient?.id || c.phoneNumber === parsed.phoneNumber,
        ) || newClient;
      if (foundClient) {
        handleClientSelect(foundClient);
      }
      // toast.success('Client added successfully!');
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
    const newTotalFine = updateTotalFine(updatedItems);
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalFine: newTotalFine,
    }));
    toast.success('Item removed');
  };
  // ─── Update the fetchQuantity function in BillEdit ────────────────────────
  const initialStockFetchedRef = useRef(false);

  const fetchQuantity = async (
    index: number,
    item: string,
    size: string,
    purity: number,
  ) => {
    if (!item || !size || !purity || purity <= 0) {
      return;
    }

    const selectedItem = items.find((i: any) => i.name === item || i.id === item);
    const selectedSize = sizes.find((s: any) => s.size === size || s.id === size);

    const itemId = selectedItem?.id || formData.items[index]?.itemId;
    const sizeId = selectedSize?.id || formData.items[index]?.sizeId;

    if (!itemId || !sizeId) {
      return;
    }

    // Removed blocking lastFetchRef check so all rows with same purity/item/size fetch available quantity
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((entry, i) =>
        i === index ? { ...entry, isLoadingQty: true } : entry,
      ),
    }));

    try {
      const response = await getQuantity.mutateAsync({
        customerId: formData.clientId,
        itemId: selectedItem.id,
        sizeId: selectedSize.id,
        purity: purity,
      });

      let weight = 0;
      let srpValue = 0;

      // Extract weight
      if (
        response?.data?.weight !== undefined &&
        response.data.weight !== null
      ) {
        weight = Number(response.data.weight);
      } else if (response?.weight !== undefined && response.weight !== null) {
        weight = Number(response.weight);
      } else if (
        response?.data?.quantity !== undefined &&
        response.data.quantity !== null
      ) {
        weight = Number(response.data.quantity);
      } else if (
        response?.quantity !== undefined &&
        response.quantity !== null
      ) {
        weight = Number(response.quantity);
      }

      if (!isNaN(weight) && weight >= 0) {
        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((entry, i) =>
            i === index
              ? {
                ...entry,
                availableQty: weight,
                isLoadingQty: false,
              }
              : entry,
          ),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((entry, i) =>
            i === index ? { ...entry, isLoadingQty: false } : entry,
          ),
        }));
      }
    } catch (error: any) {
      console.error('Error fetching quantity:', error);
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((entry, i) =>
          i === index ? { ...entry, isLoadingQty: false } : entry,
        ),
      }));
    }
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
      const strValue = value === null || value === undefined ? '' : String(value);
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

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalFine: newTotalFine,
    }));

    // Fetch quantity if purity, item, or size changed
    if (field === 'purity' || field === 'item' || field === 'size') {
      const currentItem = updatedItems[index];
      const purityNum = Number(currentItem.purity) || 0;
      if (currentItem.item && currentItem.size && purityNum > 0) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          fetchQuantity(
            index,
            currentItem.item,
            currentItem.size,
            purityNum,
          );
        }, 300);
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
    if (
      !isDataLoaded ||
      !formData.clientId ||
      formData.items.length === 0 ||
      initialStockFetchedRef.current
    ) {
      return;
    }
    if (items.length === 0 || sizes.length === 0) {
      return;
    }

    initialStockFetchedRef.current = true;
    formData.items.forEach((item, index) => {
      const purityNum = Number(item.purity) || 0;
      if (item.item && item.size && purityNum > 0) {
        fetchQuantity(index, item.item, item.size, purityNum);
      }
    });
  }, [isDataLoaded, items, sizes, formData.clientId, formData.items]);

  useEffect(() => {
    if (formData.items.length === 0 && !isLoadingBill && isDataLoaded) {
      handleAddItem();
    }
  }, [isLoadingBill, isDataLoaded]);

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
      if (item.isLoadingQty) {
        toast.loading(`Row ${i + 1}: Fetching available quantity...`, {
          duration: 2000,
        });
        return false;
      }
    }
    return true;
  };

  const handleCustomerWeightChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, customerWeight: value }));
  };

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

  const calculateTotalFineWt = () => {
    return formData.items.reduce(
      (total, item) => total + (item.fineWt || 0) + (Number(item.laborRate) || 0),
      0,
    );
  };

  const calculateTotalSRP = () => {
    return formData.items.reduce((total, item) => total + (Number(item.srp) || 0), 0);
  };

  const calculateTotalLabor = () => {
    return formData.items.reduce(
      (total, item) => total + (Number(item.laborRate) || 0),
      0,
    );
  };

  const calculateTotalBill = () => {
    return calculateTotalSRP() + calculateTotalLabor();
  };

  // Get Client Due Balance from client.due or client.openingBalance (Positive value)
  const getClientDueBalance = (client: any) => {
    if (!client) return 0;
    const due =
      client?.due !== null && client?.due !== undefined
        ? Number(client.due)
        : NaN;
    if (!isNaN(due)) {
      return Math.round(Math.abs(due) * 1000) / 1000;
    }
    const openingBalance = Number(client?.openingBalance) || 0;
    return Math.round(Math.abs(openingBalance) * 1000) / 1000;
  };

  const calculateRemainingWeight = () => {
    if (isReadOnly && savedRemaining !== null) {
      return Math.round(savedRemaining * 1000) / 1000;
    }
    const client = clients.find((c: any) => c.id === formData.clientId);
    const dueBalance = getClientDueBalance(client);
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
    return Number(Math.abs(value).toFixed(3)).toString();
  };

  const formatNumberWith2Decimals = (value: number) => {
    if (value === 0 || !value) return '0';
    return Number(Math.abs(value).toFixed(2)).toString();
  };
  const handlePrintReceipt = (group: BillGroup) => {
    if (!group) return;
    printReceipt(
      {
        clientName: group.clientName,
        phoneNumber: group.phoneNumber,
        dateTime: group.dateTime,
        items: group.items,
        totalFineWt: group.totalFinWt,
        receive: group.receive,
        total: group.pending,
      },
      getpdfheaderdata,
    );
  };


  // Save as Draft
  const handleSaveAsDraft = async () => {
    if (isSubmittingRef.current || updateBill.isPending) {
      return;
    }

    if (!formData.clientId || !formData.clientName) {
      toast.error('Please select a client');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const totalGrossWt = calculateTotalGrossWt();
      const remainingWeight = calculateRemainingWeight();

      const billData = {
        clientId: formData.clientId,
        receiptDate: formData.date,
        items: formData.items.map((item) => ({
          itemId:
            items.find((i: any) => i.name === item.item)?.id || item.itemId,
          itemName: item.item,
          sizeId:
            sizes.find((s: any) => s.size === item.size)?.id || item.sizeId,
          size: item.size,
          purity: Number(item.purity) || 0,
          availableQty: Number(item.availableQty) || 0,
          grossWeight: Number(Number(item.grossWt || 0).toFixed(3)),
          srp: Number(item.srp) || 0,
          fineWeight: Number(Number(item.fineWt || 0).toFixed(3)),
          laborRate: Number(item.laborRate) || 0,
        })),
        customerWeight: Number(Number(formData.customerWeight || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'DRAFT',
      };

      await updateBill.mutateAsync({ id, data: billData });
      // toast.success('Bill updated as draft successfully!');
      navigate({ to: '/billing' });
    } catch (error) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  // Save as Completed with Print
  const handleUpdateReceipt = async () => {
    if (isSubmittingRef.current || updateBill.isPending) {
      return;
    }

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

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const totalGrossWt = calculateTotalGrossWt();
      const remainingWeight = calculateRemainingWeight();

      const billData = {
        clientId: formData.clientId,
        receiptDate: formData.date,
        items: formData.items.map((item) => ({
          itemId:
            items.find((i: any) => i.name === item.item)?.id || item.itemId,
          itemName: item.item,
          sizeId:
            sizes.find((s: any) => s.size === item.size)?.id || item.sizeId,
          size: item.size,
          purity: Number(item.purity) || 0,
          availableQty: Number(item.availableQty) || 0,
          grossWeight: Number(Number(item.grossWt || 0).toFixed(3)),
          srp: Number(item.srp) || 0,
          fineWeight: Number(Number(item.fineWt || 0).toFixed(3)),
          laborRate: Number(item.laborRate) || 0,
        })),
        customerWeight: Number(Number(formData.customerWeight || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'BILL',
      };

      await updateBill.mutateAsync({ id, data: billData });
      // toast.success('Bill updated successfully!');

      // Print the receipt after successful update
      setTimeout(() => {
        handlePrintReceipt(billData);
      }, 500);

      // Navigate after print
      setTimeout(() => {
        navigate({ to: '/billing' });
      }, 2000);
    } catch (error: any) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      console.error('Error updating receipt:', error);

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

      toast.error(backendMessage || 'Failed to update bill');
    }
  };

  const isReadOnly = billType !== 'DRAFT';

  const renderActions = (item: ReceiptItem, index: number) => {
    if (isReadOnly) return null;
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

  const columns: Column<ReceiptItem>[] = useMemo(() => {
    const cols: Column<ReceiptItem>[] = [
      {
        key: 'item',
        header: 'Item',
        render: (item, index) => {
          if (isReadOnly) {
            return (
              <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
                {item.item || '-'}
              </span>
            );
          }
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
          if (isReadOnly) {
            return (
              <span className="text-sm text-[#1a1c1b] dark:text-slate-200">
                {item.size || '-'}
              </span>
            );
          }
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
          if (isReadOnly) {
            return (
              <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                {item.purity !== undefined &&
                  item.purity !== null &&
                  item.purity !== ''
                  ? `${formatNumberThreeDecimals(Number(item.purity))}%`
                  : '-'}
              </span>
            );
          }
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
    ];

    if (!isReadOnly) {
      cols.push({
        key: 'availableQty',
        header: 'Available Qty',
        render: (item) => (
          <div className="flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-md border border-[#c5b497] bg-[#eae3d5] px-2 py-1.5 text-xs shadow-inner dark:border-slate-600 dark:bg-slate-800">
            <span className="font-mono font-bold text-black dark:text-white">
              {item.availableQty !== undefined &&
                item.availableQty !== null &&
                item.availableQty !== ''
                ? formatNumberThreeDecimals(Number(item.availableQty))
                : '0'}
            </span>
            <span className="text-gray-500 text-[10px] dark:text-slate-400">
              G
            </span>
          </div>
        ),
      });
    }

    cols.push(
      {
        key: 'grossWt',
        header: 'Gross Wt (G)',
        render: (item, index) => {
          if (isReadOnly) {
            return (
              <span className="font-mono text-sm font-semibold text-[#1a1c1b] dark:text-white">
                {item.grossWt !== undefined &&
                  item.grossWt !== null &&
                  item.grossWt !== ''
                  ? `${formatNumberThreeDecimals(Number(item.grossWt))} G`
                  : '0 G'}
              </span>
            );
          }
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
          if (isReadOnly) {
            return (
              <span className="font-mono text-sm text-[#4f4535] dark:text-slate-300">
                {item.srp !== undefined &&
                  item.srp !== null &&
                  item.srp !== ''
                  ? `${formatNumberThreeDecimals(Number(item.srp))} G`
                  : '0 G'}
              </span>
            );
          }
          const actualIndex = formData.items.indexOf(item);
          return (
            <GenericInputField
              type="text"
              inputMode="decimal"
              step="0.001"
              min="0"
              value={
                item.srp !== undefined && item.srp !== null ? item.srp : ''
              }
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
      {
        key: 'laborRate',
        header: 'Labor Rate (G)',
        render: (item, index) => {
          if (isReadOnly) {
            return (
              <span className="font-mono text-sm text-[#4f4535] dark:text-slate-300">
                {item.laborRate !== undefined &&
                  item.laborRate !== null &&
                  item.laborRate !== ''
                  ? `${formatNumberThreeDecimals(Number(item.laborRate))} G`
                  : '0 G'}
              </span>
            );
          }
          const actualIndex = formData.items.indexOf(item);
          return (
            <GenericInputField
              type="text"
              inputMode="decimal"
              step="0.001"
              min="0"
              value={
                item.laborRate !== undefined && item.laborRate !== null
                  ? item.laborRate
                  : ''
              }
              onChange={(e) =>
                handleItemChange(actualIndex, 'laborRate', e.target.value)
              }
              placeholder="0.000"
              suffix="G"
              className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
              decimalScale={3}
            />
          );
        },
      },
    );

    return cols;
  }, [formData.items, isReadOnly, items, sizes]);

  if (isLoadingBill) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#785600]" />
          <p className="text-[#4f4535] dark:text-slate-400">
            Loading bill data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/billing' })}
              className="flex flex-shrink-0 items-center gap-2 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <PageHeader
              title={isReadOnly ? 'View Bill' : 'Edit Bill'}
              subtitle={
                isReadOnly
                  ? 'Completed bill details'
                  : 'Update bill items and details'
              }
            />
          </div>

          {billNo && (
            <div className="flex items-center gap-2 rounded-xl border border-[#785600]/20 bg-amber-50 px-4 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
              <span className="text-xs font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Bill No:
              </span>
              <span className="font-mono text-base font-bold text-[#785600] dark:text-amber-400">
                {billNo}
              </span>
            </div>
          )}
        </div>

        {/* Client Section */}
        <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                Client {isReadOnly ? '' : <span className="text-red-500">*</span>}
              </label>

              {isReadOnly ? (
                <div className="relative flex items-center justify-between rounded-lg bg-[#f4f4f2] py-3 pl-10 pr-3 dark:bg-slate-800 md:py-4 md:pl-12 md:pr-4">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f4535] md:h-5 md:w-5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white">
                      {formData.clientName || 'N/A'}
                      {clients.find((c: any) => c.id === formData.clientId)?.phoneNumber && (
                        <> - {clients.find((c: any) => c.id === formData.clientId)?.phoneNumber}</>
                      )}
                    </p>
                    {clients.find((c: any) => c.id === formData.clientId)?.address && (
                      <p className="mt-1 truncate text-xs text-[#4f4535] dark:text-slate-400">
                        {clients.find((c: any) => c.id === formData.clientId)?.address}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <ClientSearch
                  clients={clients as any[]}
                  selectedClient={
                    clients.find(
                      (client: any) => client.id === formData.clientId,
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
              )}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Items
            </h3>
            {!isReadOnly && (
              <p className="mt-1 text-xs text-[#4f4535]/60 dark:text-slate-400">
                Use + button to add more items, - button to remove
              </p>
            )}
          </div>

          <div className="w-full min-w-0 overflow-hidden [&_table]:w-full [&_table]:table-fixed [&_td]:px-1.5 [&_td]:py-1.5 [&_td]:text-xs [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[11px]">
            <GenericTable<ReceiptItem>
              data={formData.items}
              columns={columns}
              emptyMessage="No items added yet."
              isLoading={false}
              renderActions={!isReadOnly ? renderActions : undefined}
              showSrNo={true}
              srNoLabel="Sr No."
            />
          </div>
        </div>

        {/* PAYMENT SUMMARY */}
        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {/* Total Fine Wt */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
              <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
                Total Fine Wt
              </span>
              {isReadOnly ? (
                <span className="font-mono text-sm font-bold text-[#1a1c1b] dark:text-white">
                  {formatNumberThreeDecimals(formData.totalFine)} G
                </span>
              ) : (
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={
                      formData.totalFine !== undefined &&
                        formData.totalFine !== null &&
                        formData.totalFine !== ''
                        ? formData.totalFine
                        : ''
                    }
                    onChange={handleTotalFineChange}
                    placeholder="0.000"
                    className="font-mono w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
                    G
                  </span>
                </div>
              )}
            </div>

            {/* Advance */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
              <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
                Advance
              </span>
              {isReadOnly ? (
                <span className="font-mono text-sm font-semibold text-[#1a1c1b] dark:text-white">
                  {formatNumberThreeDecimals(Number(formData.customerWeight) || 0)} G
                </span>
              ) : (
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.customerWeight || ''}
                    onChange={handleCustomerWeightChange}
                    placeholder="0.000"
                    className="font-mono w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-red-400"
                  />
                  <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
                    G
                  </span>
                </div>
              )}
            </div>

            {/* Due Balance (Client Due - Read Only) */}
            {/* <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
              <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
                Due Balance
              </span>
              <span className="font-mono text-sm font-semibold text-black dark:text-black">
                {formatNumberThreeDecimals(
                  getClientDueBalance(
                    clients.find(
                      (client: any) => client.id === formData.clientId,
                    ),
                  ),
                )}{' '}
                G
              </span>
            </div> */}

            {/* Remaining Balance */}
            <div className="flex items-center justify-between bg-[#f4f0e5] px-4 py-3 dark:bg-slate-800">
              <span className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                Remaining Balance
              </span>
              <span className="font-mono text-base font-bold text-black dark:text-black">
                {formatNumberThreeDecimals(calculateRemainingWeight())} G
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Only displayed for DRAFT bills */}
        {billType === 'DRAFT' && (
          <div className="sticky bottom-0 z-50 border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <GenericButton
                type="button"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting || updateBill.isPending}
                className="hover:!bg-gray-700 !bg-gradient-to-br from-[#d97706] to-[#92400e] !text-white"
              >
                {isSubmitting || updateBill.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
                {isSubmitting || updateBill.isPending ? 'Saving...' : 'Save as Draft'}
              </GenericButton>

              <GenericButton
                type="button"
                onClick={handleUpdateReceipt}
                disabled={isSubmitting || updateBill.isPending}
              >
                {isSubmitting || updateBill.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {isSubmitting || updateBill.isPending ? 'Updating...' : 'Update Bill'}
              </GenericButton>
            </div>
          </div>
        )}
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
                Not enough stock available to complete this bill. You can save it as a draft.
              </p>
              <p className="mt-1 text-xs font-medium text-[#785600] dark:text-amber-400">
                (उपलब्ध स्टॉक कम है, आप इसे ड्राफ्ट में सेव कर सकते हैं।)
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
                disabled={isSubmitting || updateBill.isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting || updateBill.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                {isSubmitting || updateBill.isPending ? 'Saving...' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d3c4af]/10 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                Add New Client
              </h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientFormData.fullName}
                  onChange={(e) =>
                    setClientFormData({
                      ...clientFormData,
                      fullName: e.target.value,
                    })
                  }
                  placeholder="Enter client name"
                  className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${clientFormErrors.fullName ? 'ring-2 ring-red-500' : ''}`}
                />
                {clientFormErrors.fullName && (
                  <p className="mt-1 text-xs text-red-500">
                    {clientFormErrors.fullName}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientFormData.phoneNumber}
                  onChange={(e) =>
                    setClientFormData({
                      ...clientFormData,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="Enter phone number"
                  className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${clientFormErrors.phoneNumber ? 'ring-2 ring-red-500' : ''}`}
                />
                {clientFormErrors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-500">
                    {clientFormErrors.phoneNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={clientFormData.address}
                  onChange={(e) =>
                    setClientFormData({
                      ...clientFormData,
                      address: e.target.value,
                    })
                  }
                  placeholder="Enter address"
                  rows={2}
                  className={`w-full resize-none rounded-lg border-0 bg-[#f4f4f2] px-4 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${clientFormErrors.address ? 'ring-2 ring-red-500' : ''}`}
                />
                {clientFormErrors.address && (
                  <p className="mt-1 text-xs text-red-500">
                    {clientFormErrors.address}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                  Opening Balance (G)
                </label>
                <input
                  type="text"
                  value={clientFormData.openingBalance}
                  onChange={(e) =>
                    setClientFormData({
                      ...clientFormData,
                      openingBalance: e.target.value,
                    })
                  }
                  placeholder="0.000"
                  className={`font-mono w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-2.5 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${clientFormErrors.openingBalance ? 'ring-2 ring-red-500' : ''}`}
                />
                {clientFormErrors.openingBalance && (
                  <p className="mt-1 text-xs text-red-500">
                    {clientFormErrors.openingBalance}
                  </p>
                )}
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
                className="!bg-[#785600] !px-4 !py-2 !text-sm !text-white hover:!bg-[#5d4200]"
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

export default BillEdit;
