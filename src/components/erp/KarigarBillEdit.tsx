import React, {useState, useEffect, useRef, useMemo} from 'react';
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
import {useNavigate} from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetKarigars,
} from '@/components/joborder/karigar/karigarapi';
import AddKarigarModal from '@/components/setllement/AddKarigarModal';
import {useGetItems} from '@/lib/api/items';
import {useGetSizes} from '@/lib/api/sizes';
import {useGetStock} from '@/lib/api/stock';
import toast from 'react-hot-toast';
import {z} from 'zod';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import {useGetKarigarBillByid, useUpdateKarigarBill, useGetPurchaseSrp} from '@/lib/api/karigarBill';
import {Route} from '@/routes/_app/karigarbilliupdate.$id';
import GenericInputField from '../Forms/Input/GenericInputField';
import {useGetHeader} from '@/lib/api/headerapi';
import {KarigarSearch} from '../reciept/KarigarSearch';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';
import {printReceipt} from '@/utils/printReceipt';

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
  KarigarId: string;
  KarigarName: string;
  date: string;
  items: ReceiptItem[];
  customerWeight: number | string;
  remainingWeight: number | string;
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
  displayItems: string;
  displaySizes: string;
  displayPurity: string;
  displayGrossWt: string;
  displayFinWt: string;
  displaySRP: string;
  totalFinWt: number;
  totalSRP: number;
}



const KarigarBillEdit: React.FC = () => {
  const {id} = Route.useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date[]>([]);
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');

  const [formData, setFormData] = useState<ReceiptFormData>({
    KarigarId: '',
    KarigarName: '',
    remainingWeight: 0,
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

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [billType, setBillType] = useState<'DRAFT' | 'BILL'>('DRAFT');
  const [billNo, setBillNo] = useState<string>('');
  const [savedRemaining, setSavedRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState<'draft' | 'bill' | null>(
    null,
  );
  const isSubmittingRef = useRef(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<{
    item: string;
    size: string;
    purity: number;
  } | null>(null);

  const {data: Karigars = [], refetch: refetchKarigars} = useGetKarigars();
  const {data: rawItems = []} = useGetItems();
  const {data: rawStockData} = useGetStock();

  const availableGoldStock = useMemo(() => {
    const stockItems = Array.isArray(rawStockData)
      ? rawStockData
      : rawStockData?.data || [];
    return stockItems.reduce((sum: number, stock: any) => {
      const weight = Number(stock.weight) || 0;
      const purity = Number(stock.purity) || 0;
      const fineWeight = (weight * purity) / 100;
      return sum + fineWeight;
    }, 0);
  }, [rawStockData]);

  const items = useMemo(
    () =>
      (Array.isArray(rawItems) ? rawItems : []).filter((item: any) => {
        const name = item?.name?.trim().toLowerCase() || '';
        return name !== 'gold' && !name.includes('(s)');
      }),
    [rawItems],
  );
  const {data: sizes = []} = useGetSizes();


  const getpdfheaderdata = useGetHeader();
  const {data: billResponse, isLoading: isLoadingBill} = useGetKarigarBillByid(id);
  const updateBill = useUpdateKarigarBill();
  const getPurchaseSrp = useGetPurchaseSrp();

  // Weighing Scale table focus hook
  const {getScaleProps} = useTableScaleFocus<keyof ReceiptItem>(
    (index, field, weight) => {
      handleItemChange(index, field, weight);
    },
  );

  // ─── Fetch SRP in KarigarBillEdit (Requires only Karigar & Item) ───────
  const fetchSrp = async (
    index: number,
    item: string,
    size: string,
    customKarigarId?: string,
  ) => {
    const karigarId = customKarigarId || formData.KarigarId;
    if (!item || !size || !karigarId) {
      return;
    }

    const selectedItem = items.find(
      (i: any) => i.name === item || i.id === item,
    );
    const selectedSize = sizes.find(
      (s: any) => s.size === size || s.id === size,
    );

    const itemId = selectedItem?.id || formData.items[index]?.itemId;
    const sizeId = selectedSize?.id || (formData.items[index] as any)?.sizeId;

    if (!itemId || !sizeId) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((entry, i) =>
        i === index ? {...entry, isLoadingQty: true} : entry,
      ),
    }));

    try {
      const response = await getPurchaseSrp.mutateAsync({
        karigarId: karigarId,
        itemId: itemId,
        sizeId: sizeId,
      });

      let srpValue: number | string | null = null;

      // Extract SRP
      if (
        response?.data?.srp !== undefined &&
        response.data.srp !== null
      ) {
        srpValue = response.data.srp;
      } else if (response?.srp !== undefined && response.srp !== null) {
        srpValue = response.srp;
      } else if (
        response?.data !== undefined &&
        response.data !== null &&
        (typeof response.data === 'number' || typeof response.data === 'string')
      ) {
        srpValue = response.data;
      }

      setFormData((prev) => {
        const updatedItems = prev.items.map((entry, i) => {
          if (i !== index) return entry;

          const nextSrp =
            srpValue !== null && srpValue !== undefined && !isNaN(Number(srpValue))
              ? srpValue
              : entry.srp;

          const purityVal = Number(entry.purity) || 0;
          const grossWt = Number(entry.grossWt) || 0;
          const srpNum = Number(nextSrp) || 0;
          const fineWt = calculateFineWeight(purityVal, grossWt, srpNum);

          return {
            ...entry,
            srp: nextSrp,
            fineWt: fineWt,
            isLoadingQty: false,
          };
        });

        return {
          ...prev,
          items: updatedItems,
          totalFine: updateTotalFine(updatedItems),
        };
      });
    } catch (error: any) {
      console.error('Error fetching purchase SRP:', error);
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((entry, i) =>
          i === index ? {...entry, isLoadingQty: false} : entry,
        ),
      }));
    }
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

    // Handle receipt items
    const receiptItems =
      billData.karigarPurchaseItems || billData.receiptItems || billData.items || billData.billItems || [];

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
        const srp = item.srp !== undefined && item.srp !== null ? item.srp : '';
        const laborRate =
          item.laborRate !== undefined && item.laborRate !== null
            ? item.laborRate
            : '';

        let fineWt = item.fineWeight ?? item.fineWt ?? item.finWt;
        if (
          fineWt === undefined ||
          fineWt === null ||
          fineWt === 0 ||
          fineWt === ''
        ) {
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
      billData.billNumber ||
      billData.billNo ||
      (billData as any).receiptNo ||
      '';
    setBillNo(bNumber);

    if (
      billData.remainingWeight !== undefined &&
      billData.remainingWeight !== null
    ) {
      setSavedRemaining(Number(billData.remainingWeight));
    }

    // Map the data to form fields
    const mappedData = {
      KarigarId:
        billData.karigarId || billData.karigar?.id || billData.KarigarID || billData.KarigarId || billData.Karigar?.id || '',
      KarigarName:
        billData.karigar?.fullName ||
        billData.Karigar?.fullName ||
        billData.KarigarName ||
        billData.Karigar?.fullname ||
        '',
      date: (billData.purchaseDate || billData.receiptDate)
        ? new Date(billData.purchaseDate || billData.receiptDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      customerWeight:
        billData.karigarWeight ??
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
      KarigarId: mappedData.KarigarId,
      KarigarName: mappedData.KarigarName,
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

  const handleKarigarSuccess = async (newKarigar?: any) => {
    setShowKarigarModal(false);
    const refetched = await refetchKarigars();
    const allKarigars = (refetched?.data as any[]) || [];
    
    if (newKarigar) {
      const foundKarigar = allKarigars.find((c: any) => c.id === newKarigar.id) || newKarigar;
      handleKarigarSelect(foundKarigar);
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

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalFine: newTotalFine,
    }));

    // Fetch SRP once both item and size are selected
    if (field === 'item' || field === 'size') {
      const currentItem = updatedItems[index];
      if (currentItem.item && currentItem.size) {
        fetchSrp(index, currentItem.item, currentItem.size);
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
    }
    return true;
  };

  const handleCustomerWeightChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({...prev, customerWeight: value}));
  };

  const handleTotalFineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({...prev, totalFine: value}));
  };

  const calculateTotalGrossWt = () => {
    return formData.items.reduce(
      (total, item) => total + (Number(item.grossWt) || 0),
      0,
    );
  };

  const calculateTotalFineWt = () => {
    return formData.items.reduce(
      (total, item) =>
        total + (item.fineWt || 0) + (Number(item.laborRate) || 0),
      0,
    );
  };

  const calculateTotalSRP = () => {
    return formData.items.reduce(
      (total, item) => total + (Number(item.srp) || 0),
      0,
    );
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

  // Get Karigar Due Balance from Karigar.due or Karigar.openingBalance
  const getKarigarDueBalance = (Karigar: any) => {
    const billData = billResponse?.data || billResponse?.bill || billResponse;
    if (billData && billData.dueBalance !== undefined && billData.dueBalance !== null) {
      return Number(billData.dueBalance);
    }
    
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

  const currentKarigar = useMemo(() => {
    const list = Array.isArray(Karigars) ? Karigars : [];
    const fromList = list.find(
      (c: any) => String(c.id) === String(formData.KarigarId),
    );
    if (fromList) return fromList;
    const billData = billResponse?.data || billResponse?.bill || billResponse;
    if (
      billData?.Karigar &&
      (!formData.KarigarId ||
        String(billData.Karigar.id) === String(formData.KarigarId) ||
        String(billData.KarigarID) === String(formData.KarigarId))
    ) {
      return billData.Karigar;
    }
    return null;
  }, [Karigars, formData.KarigarId, billResponse]);

  const calculateRemainingWeight = () => {
    const dueBalance = getKarigarDueBalance(currentKarigar);
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

  const formatNumberWith2Decimals = (value: number) => {
    if (value === 0 || !value) return '0';
    return Number(Math.abs(value).toFixed(2)).toString();
  };
  const handlePrintReceipt = (responseData?: any) => {
    const KarigarDue = getKarigarDueBalance(currentKarigar);

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'pm' : 'am'}`;

    const advance =
      Number(
        responseData?.customerWeight ??
          responseData?.receive ??
          formData.customerWeight,
      ) || 0;

    const remaining =
      Number(
        responseData?.remainingWeight ??
          responseData?.pending ??
          calculateRemainingWeight(),
      ) || 0;

    const itemsList =
      Array.isArray(responseData?.items) &&
      responseData.items.length > 0 &&
      responseData.items[0]?.item
        ? responseData.items
        : formData.items.map((item) => ({
            item: item.item || '-',
            size: item.size || '-',
            purity: Number(item.purity) || 0,
            grossWeight: Number(item.grossWt) || 0,
            srp: Number(item.srp) || 0,
            finWt: Number(item.fineWt) || 0,
            laborRate: Number(item.laborRate) || 0,
          }));

    const totalFineWt =
      Number(responseData?.totalFineWt ?? responseData?.totalFinWt) ||
      itemsList.reduce(
        (sum: number, i: any) => sum + (Number(i.finWt) || 0),
        0,
      );

    printReceipt(
      {
        clientName:
          responseData?.KarigarName ||
          formData.KarigarName ||
          currentKarigar?.fullName ||
          'N/A',
        phoneNumber: responseData?.phoneNumber || currentKarigar?.phoneNumber || 'N/A',
        dateTime: responseData?.dateTime || dateStr,
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

  // Save as Draft
  const handleSaveAsDraft = async () => {
    if (isSubmittingRef.current || updateBill.isPending) {
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
        karigarWeight: Number(Number(formData.customerWeight || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'DRAFT',
      };

      await updateBill.mutateAsync({id, data: billData});
      // toast.success('Bill updated as draft successfully!');
      navigate({to: '/karigarbilling'});
    } catch (error) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmittingType(null);
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  // Save as Completed with Print
  const handleUpdateReceipt = async () => {
    if (isSubmittingRef.current || updateBill.isPending) {
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
        karigarWeight: Number(Number(formData.customerWeight || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        dueBalance: getKarigarDueBalance(Karigars.find((k: any) => k.id === formData.KarigarId)),
        type: 'BILL',
      };

      const response = await updateBill.mutateAsync({id, data: billData});
      // toast.success('Bill updated successfully!');

      // Print the receipt after successful update
      setTimeout(() => {
        handlePrintReceipt(response?.data || billData);
      }, 500);

      // Navigate after print
      setTimeout(() => {
        navigate({to: '/karigarbilling'});
      }, 2000);
    } catch (error: any) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmittingType(null);
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
          );
        },
      },
      // Removed Available Qty
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
                {item.srp !== undefined && item.srp !== null && item.srp !== ''
                  ? `${formatNumberThreeDecimals(Number(item.srp))} G`
                  : '0 G'}
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
              {item.isLoadingQty && (
                <Loader2 className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#785600]" />
              )}
            </div>
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
      }
    ];

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
              onClick={() => navigate({to: '/karigarbilling'})}
              className="flex flex-shrink-0 items-center gap-2 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <PageHeader
              title={isReadOnly ? 'View Karigar Purchase' : 'Edit Karigar Purchase'}
              subtitle={
                isReadOnly
                  ? 'Completed bill details'
                  : 'Update bill items and details'
              }
            />
          </div>

          <div className="flex items-center gap-3">
            {billNo && (
              <div className="flex items-center gap-2 rounded-xl border border-[#785600]/20 bg-amber-50 px-4 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
                <span className="text-xs font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Purchase No:
                </span>
                <span className="font-mono text-base font-bold text-[#785600] dark:text-amber-400">
                  {billNo}
                </span>
              </div>
            )}
            <GenericButton
              type="button"
              onClick={() => handlePrintReceipt(billResponse?.data || billResponse?.bill || billResponse)}
              className="bg-[#785600] text-white hover:bg-[#604500]"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </GenericButton>
          </div>
        </div>

        {/* Karigar Section */}
        <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                Karigar{' '}
                {isReadOnly ? '' : <span className="text-red-500">*</span>}
              </label>

              {isReadOnly ? (
                <div className="relative flex items-center justify-between rounded-lg bg-[#f4f4f2] py-3 pl-10 pr-3 dark:bg-slate-800 md:py-4 md:pl-12 md:pr-4">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f4535] md:h-5 md:w-5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white">
                      {formData.KarigarName || 'N/A'}
                      {Karigars.find((c: any) => c.id === formData.KarigarId)
                        ?.phoneNumber && (
                        <>
                          {' '}
                          -{' '}
                          {
                            Karigars.find(
                              (c: any) => c.id === formData.KarigarId,
                            )?.phoneNumber
                          }
                        </>
                      )}
                    </p>
                    {Karigars.find((c: any) => c.id === formData.KarigarId)
                      ?.address && (
                      <p className="mt-1 truncate text-xs text-[#4f4535] dark:text-slate-400">
                        {
                          Karigars.find((c: any) => c.id === formData.KarigarId)
                            ?.address
                        }
                      </p>
                    )}
                  </div>
                </div>
              ) : (
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
                    if (Karigar?.id) {
                      formData.items.forEach((item, idx) => {
                        if (item.item && item.size) {
                          fetchSrp(idx, item.item, item.size, Karigar.id);
                        }
                      });
                    }
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
                {/* Instruction removed per request */}
              </p>
            )}
          </div>

          {/* Mobile: one card per item, 2 fields per row (same as Add Bill) */}
          <div className="space-y-2.5 md:hidden">
            {formData.items.length === 0 && (
              <p className="py-4 text-center text-xs text-[#817563] dark:text-slate-400">
                No items added yet.
              </p>
            )}
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-[#d3c4af]/30 bg-[#f9f9f7]/60 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <div className="flex min-h-[36px] items-center justify-between border-b border-[#d3c4af]/20 px-3 py-1 dark:border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                    Item {index + 1}
                  </span>
                  {!isReadOnly && renderActions(item, index)}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-3 p-3 [&_input]:!py-2 [&_input]:!text-sm [&_select]:!py-2 [&_select]:!text-sm [&_div.shadow-inner]:py-2 [&_div.shadow-inner]:text-sm">
                  {columns.map((col) => (
                    <div key={String(col.key)} className="min-w-0">
                      <span className="mb-1 block truncate text-[11px] font-semibold uppercase tracking-wide text-[#4f4535] dark:text-slate-300">
                        {col.header}
                      </span>
                      {col.render?.(item, index)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden w-full min-w-0 overflow-hidden md:block [&_table]:w-full [&_table]:table-fixed [&_td]:px-1.5 [&_td]:py-1.5 [&_td]:text-xs [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[11px]">
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
                    disabled
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
                <br />
                <span className="text-xs text-slate-500">
                  (Available Gold: {availableGoldStock.toFixed(3)}G)
                </span>
              </span>
              {isReadOnly ? (
                <span className="font-mono text-sm font-semibold text-[#1a1c1b] dark:text-white">
                  {formatNumberThreeDecimals(
                    Number(formData.customerWeight) || 0,
                  )}{' '}
                  G
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

            {/* Due Balance (Karigar Due - Read Only) */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
              <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
                Due Balance
              </span>
              <span className="font-mono text-sm font-semibold text-black dark:text-black">
                {formatNumberThreeDecimals(
                  getKarigarDueBalance(currentKarigar),
                )}{' '}
                G
              </span>
            </div>

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
          <div className="sticky bottom-16 z-30 border-t md:bottom-0 md:z-50 border-[#d3c4af]/20 bg-[#f9f9f7] p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <GenericButton
                type="button"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting || updateBill.isPending}
                className="hover:!bg-gray-700 !bg-gradient-to-br from-[#d97706] to-[#92400e] !text-white"
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
                onClick={handleUpdateReceipt}
                disabled={isSubmitting || updateBill.isPending}
              >
                {submittingType === 'bill' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {submittingType === 'bill' ? 'Updating...' : 'Update Bill'}
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
                Not enough stock available to complete this bill. You can save
                it as a draft.
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
                {isSubmitting || updateBill.isPending
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

export default KarigarBillEdit;
