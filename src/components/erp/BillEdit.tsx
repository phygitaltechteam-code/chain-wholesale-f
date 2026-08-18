// components/erp/BillEdit.tsx
import React, {useState, useEffect, useRef} from 'react';
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
import {useGetClients, useCreateClient} from '@/lib/api/client';
import {useGetItems} from '@/lib/api/items';
import {useGetSizes} from '@/lib/api/sizes';
import toast from 'react-hot-toast';
import {z} from 'zod';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import {useGetQuantity, useGetBillByid, useBillUpdate} from '@/lib/api/bill';
import {Route} from '@/routes/_app/billiupdate.$id';
import GenericInputField from '../Forms/Input/GenericInputField';
import {useGetHeader} from '@/lib/api/headerapi';
import {ClientSearch} from '../reciept/ClientSearch';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';

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
  totalFine: number;
  goldInfo: {
    karat: string;
    rate: number;
    weight: number;
    totalAmount: number;
  };
}

const ClientSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  openingBalance: z.number().min(0, 'Opening balance cannot be negative'),
});

const BillEdit: React.FC = () => {
  const {id} = Route.useParams();
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

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<{
    item: string;
    size: string;
    purity: number;
  } | null>(null);

  const {data: clients = [], refetch: refetchClients} = useGetClients();
  const {data: items = []} = useGetItems();
  const {data: sizes = []} = useGetSizes();
  const createClient = useCreateClient();

  const getpdfheaderdata = useGetHeader();
  const getQuantity = useGetQuantity();
  const {data: billResponse, isLoading: isLoadingBill} = useGetBillByid(id);
  const updateBill = useBillUpdate();

  // Weighing Scale table focus hook
  const {getScaleProps} = useTableScaleFocus<keyof ReceiptItem>(
    (index, field, weight) => {
      handleItemChange(index, field, weight);
    },
  );

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
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  useEffect(() => {
    console.log('Bill Response:', billResponse);
    console.log('Is Data Loaded:', isDataLoaded);

    if (!billResponse || isDataLoaded) {
      console.log('No bill response or already loaded');
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
      customerWeight: billData.customerWeight || 0,
      totalFine: billData.totalFine || 0,
    };

    console.log('Mapped Form Data:', mappedData);

    // Handle receipt items
    const receiptItems = billData.receiptItems || billData.items || [];

    console.log('Receipt Items:', receiptItems);

    let itemsList: ReceiptItem[] = [];
    if (receiptItems.length > 0) {
      itemsList = receiptItems.map((item: any, index: number) => ({
        id: item.id || `item-${Date.now()}-${index}`,
        srNo: index + 1,
        item: item.item?.name || item.itemName || item.name || '',
        size: item.size?.size || item.sizeName || item.size || '',
        purity: item.purity || 0,
        availableQty: item.availableQty || 0,
        grossWt: item.grossWeight || item.grossWt || 0,
        wastage: 0,
        srp: item.srp || 0,
        fineWt: item.fineWeight || item.fineWt || 0,
        laborRate: item.laborRate || 0,
        isLoadingQty: false,
        itemId: item.itemID || item.itemId || item.item?.id || '',
        sizeId: item.sizeID || item.sizeId || item.size?.id || '',
      }));

      console.log('Mapped Items:', itemsList);
    }

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
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    toast.success('Item removed');
  };
  // ─── Update the fetchQuantity function in BillEdit ────────────────────────
  const fetchQuantity = async (
    index: number,
    item: string,
    size: string,
    purity: number,
  ) => {
    if (!item || !size || !purity || purity <= 0) {
      return;
    }

    const selectedItem = items.find((i: any) => i.name === item);
    const selectedSize = sizes.find((s: any) => s.size === size);

    if (!selectedItem || !selectedSize) {
      toast.error('Item or size not found');
      return;
    }

    const currentFetch = {item, size, purity};
    if (
      lastFetchRef.current &&
      lastFetchRef.current.item === currentFetch.item &&
      lastFetchRef.current.size === currentFetch.size &&
      lastFetchRef.current.purity === currentFetch.purity
    ) {
      return;
    }
    lastFetchRef.current = currentFetch;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((entry, i) =>
        i === index ? {...entry, isLoadingQty: true} : entry,
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

      if (response?.data?.srp !== undefined && response.data.srp !== null) {
        srpValue = Number(response.data.srp);
      } else if (response?.srp !== undefined && response.srp !== null) {
        srpValue = Number(response.srp);
      }

      if (!isNaN(weight) && weight >= 0) {
        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((entry, i) =>
            i === index
              ? {
                  ...entry,
                  availableQty: weight,
                  srp: srpValue > 0 ? srpValue : entry.srp,
                  isLoadingQty: false,
                }
              : entry,
          ),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((entry, i) =>
            i === index ? {...entry, isLoadingQty: false} : entry,
          ),
        }));
      }
    } catch (error: any) {
      console.error('Error fetching quantity:', error);
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
    const purityFactor = purity / 100;
    return grossWt * purityFactor + srp;
  };

  // Update Total Fine calculation (Fine Wt + Labor Rate)
  const updateTotalFine = (items: ReceiptItem[]) => {
    const total = items.reduce(
      (sum, item) => sum + (item.fineWt || 0) + (item.laborRate || 0),
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
          [field]: roundedValue,
        };
      } else {
        updatedItems[index] = {
          ...item,
          [field]: 0,
        };
      }
    } else if (field === 'purity') {
      const numValue = parseFloat(value);
      updatedItems[index] = {
        ...item,
        [field]: isNaN(numValue) ? 0 : Math.min(100, Math.max(0, numValue)),
      };
    } else {
      updatedItems[index] = {
        ...item,
        [field]: value,
      };
    }

    // Recalculate fine weight for the changed item
    if (field === 'purity' || field === 'grossWt' || field === 'srp') {
      const purity =
        field === 'purity'
          ? updatedItems[index].purity
          : updatedItems[index].purity;
      const grossWt =
        field === 'grossWt'
          ? updatedItems[index].grossWt
          : updatedItems[index].grossWt;
      const srp =
        field === 'srp' ? updatedItems[index].srp : updatedItems[index].srp;

      updatedItems[index].fineWt = calculateFineWeight(
        Number(purity) || 0,
        Number(grossWt) || 0,
        Number(srp) || 0,
      );
    }

    // Update total fine
    const newTotalFine = updateTotalFine(updatedItems);

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalFine: newTotalFine,
    }));

    if (field === 'purity') {
      const currentItem = updatedItems[index];
      if (currentItem.item && currentItem.size && currentItem.purity > 0) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          fetchQuantity(
            index,
            currentItem.item,
            currentItem.size,
            currentItem.purity,
          );
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
    if (formData.items.length === 0 && !isLoadingBill && isDataLoaded) {
      handleAddItem();
    }
  }, [isLoadingBill, isDataLoaded]);

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
    if (value === '') {
      setFormData((prev) => ({...prev, customerWeight: 0}));
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      const roundedValue = Math.round(numValue * 1000) / 1000;
      setFormData((prev) => ({...prev, customerWeight: roundedValue}));
    }
  };

  const handleTotalFineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFormData((prev) => ({...prev, totalFine: 0}));
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      const roundedValue = Math.round(numValue * 1000) / 1000;
      setFormData((prev) => ({...prev, totalFine: roundedValue}));
    }
  };

  const calculateTotalGrossWt = () => {
    return formData.items.reduce(
      (total, item) => total + (item.grossWt || 0),
      0,
    );
  };

  const calculateTotalFineWt = () => {
    return formData.items.reduce(
      (total, item) => total + (item.fineWt || 0) + (item.laborRate || 0),
      0,
    );
  };

  const calculateTotalSRP = () => {
    return formData.items.reduce((total, item) => total + (item.srp || 0), 0);
  };

  const calculateTotalLabor = () => {
    return formData.items.reduce(
      (total, item) => total + (item.laborRate || 0),
      0,
    );
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

  const formatNumberWith2Decimals = (value: number) => {
    if (value === 0 || !value) return '0';
    return Number(value.toFixed(2)).toString();
  };

  // Get Client Due Balance from client.due or client.openingBalance
  const getClientDueBalance = (client: any) => {
    if (!client) return 0;
    const due =
      client?.due !== null && client?.due !== undefined
        ? Number(client.due)
        : NaN;
    if (!isNaN(due)) {
      return Math.round(due * 1000) / 1000;
    }
    const openingBalance = Number(client?.openingBalance) || 0;
    return Math.round(openingBalance * 1000) / 1000;
  };

  // ======================================================
  // PRINT RECEIPT - A5 Landscape
  // ======================================================
  const handlePrintReceipt = (billData: any) => {
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 210mm;
      height: 140mm;
      background: white;
      padding: 0;
      z-index: 9999;
    `;

    document.body.appendChild(printContainer);

    // Get client phone
    const client = clients.find((c: any) => c.id === formData.clientId);
    const phoneNumber = client?.phoneNumber || 'N/A';

    // Format date
    const receiptDate = formData.date ? new Date(formData.date) : new Date();
    const dateStr = receiptDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Calculate amounts
    const totalFineWt = calculateTotalFineWt();
    const totalGrossWt = calculateTotalGrossWt();
    const totalSRP = calculateTotalSRP();
    const totalLabor = calculateTotalLabor();
    const totalAmount = totalSRP + totalLabor;
    const receive = formData.customerWeight || 0;
    const pending = calculateRemainingWeight();

    // Build items table rows
    let itemsRows = '';
    formData.items.forEach((item, index) => {
      const itemAmount = (item.srp || 0) + (item.laborRate || 0);
      itemsRows += `
        <tr>
          <td style="border:1px solid #222;padding:3px 4px;text-align:center;font-size:9px;color:#000;">${index + 1}</td>
          <td style="border:1px solid #222;padding:3px 4px;font-size:9px;color:#000;">${item.item || '-'}</td>
          <td style="border:1px solid #222;padding:3px 4px;font-size:9px;color:#000;">${item.size || '-'}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberThreeDecimals(item.purity)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-weight:bold;font-size:9px;color:#000;">${formatNumberThreeDecimals(item.fineWt)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberThreeDecimals(item.grossWt)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberThreeDecimals(item.srp)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberThreeDecimals(item.laborRate)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-weight:bold;font-size:9px;color:#000;">₹${formatNumberWith2Decimals(itemAmount)}</td>
        </tr>
      `;
    });

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
      : '18px';
    const descriptionFontSize = headerInfo.descriptionFontSize
      ? `${headerInfo.descriptionFontSize}px`
      : '9px';
    const proprietorFontSize = headerInfo.proprietorFontSize
      ? `${headerInfo.proprietorFontSize}px`
      : '9px';
    const phoneFontSize = headerInfo.phoneFontSize
      ? `${headerInfo.phoneFontSize}px`
      : '9px';

    printContainer.innerHTML = `
      <div style="
        width:210mm;
        height:135mm;
        margin:0 auto;
        background:#ffffff;
        font-family:Arial,Helvetica,sans-serif;
        padding:4mm 6mm;
        box-sizing:border-box;
        color:#111111;
        overflow:hidden;
      ">

        <!-- HEADER -->
        <div style="width:100%;text-align:center;">
          <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            margin:0;
            padding:0;
          ">
            <span style="
              font-size:10px;
              font-weight:bold;
              color:${invocationColor};
              white-space:nowrap;
            ">
              ${leftInvocation}
            </span>

            <span style="
              font-size:${factoryFontSize};
              font-weight:bold;
              color:${factoryNameColor};
              line-height:1.1;
              white-space:nowrap;
            ">
              ${factoryName}
            </span>

            <span style="
              font-size:10px;
              font-weight:bold;
              color:${invocationColor};
              white-space:nowrap;
            ">
              ${rightInvocation}
            </span>
          </div>

          <div style="
            margin:2px 0 0;
            font-size:${descriptionFontSize};
            font-weight:bold;
            color:${descriptionColor};
            line-height:1.2;
          ">
            ${description}
          </div>

          <div style="
            margin:2px 0 0;
            font-size:${proprietorFontSize};
            font-weight:bold;
            color:${proprietorColor};
            line-height:1.2;
          ">
            ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
          </div>

          <div style="
            border-bottom:2px solid ${factoryNameColor};
            margin:2px 0 3px;
          "></div>
        </div>

        <!-- RECEIPT TITLE -->
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin:0 0 3px;
        ">
          <div style="width:25%;"></div>

          <h2 style="
            width:50%;
            margin:0;
            text-align:center;
            font-size:15px;
            font-weight:bold;
            letter-spacing:2px;
            color:#111111;
          ">
            RECEIPT
          </h2>
        </div>

        <!-- SIMPLE RECEIPT INFO -->
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin:0 0 4px;
          padding:0 1px;
          font-size:10px;
          line-height:1.3;
        ">
          <div>
            <span style="font-weight:bold;">Client:</span>
            ${formData.clientName}
            <span style="margin-left:14px;font-weight:bold;">Phone:</span>
            ${phoneNumber}
          </div>

          <div style="text-align:right;">
            <span style="font-weight:bold;">Date:</span>
            ${dateStr}
          </div>
        </div>

        <!-- ITEM TABLE -->
        <table style="
          width:100%;
          border-collapse:collapse;
          font-size:10px;
          margin:0 0 3px;
        ">
          <thead>
            <tr style="
              background:#785600;
              color:#ffffff;
            ">
              <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Sr</th>
              <th style="border:1px solid #785600;padding:3px 4px;text-align:left;font-size:8px;">Item</th>
              <th style="border:1px solid #785600;padding:3px 4px;text-align:left;font-size:8px;">Size</th>
              <th style="border:1px solid #785600;padding:3px 4px;text-align:right;font-size:8px;">Purity %</th>
              <th style="border:1px solid #785600;padding:3px 4px;text-align:right;font-size:8px;">Fine Wt (G)</th>
              <th style="border:1px solid #785600;padding:3px 4px;text-align:right;font-size:8px;">Gross Wt (G)</th>
              <th style="border:1px solid #785600;padding:3px 4px;text-align:right;font-size:8px;">SRP (G)</th>
              <th style="border:1px solid #785600;padding:3px 4px;text-align:right;font-size:8px;">Labor (G)</th>
              <th style="border:1px solid #785600;padding:3px 4px;text-align:right;font-size:8px;">Amount</th>
            </tr>
          </thead>

          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- PAYMENT SUMMARY -->
        <div style="
          display:flex;
          justify-content:flex-end;
          margin-top:1px;
        ">
          <div style="
            width:38%;
            border:1px solid #d6c08a;
            border-radius:5px;
            background:#fffdf7;
            overflow:hidden;
          ">
            <div style="
              display:flex;
              justify-content:space-between;
              padding:3px 7px;
              border-bottom:1px dashed #dddddd;
              font-size:10px;
            ">
              <span style="font-weight:bold;color:#666666;">Total Fine Wt</span>
              <span style="font-family:monospace;font-weight:bold;">
                ${formatNumberThreeDecimals(totalFineWt)} G
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              padding:3px 7px;
              border-bottom:1px dashed #dddddd;
              font-size:10px;
            ">
              <span style="font-weight:bold;color:#666666;">Advance</span>
              <span style="font-family:monospace;font-weight:bold;">
                ${formatNumberThreeDecimals(receive)} G
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              padding:3px 7px;
              border-bottom:1px dashed #dddddd;
              font-size:10px;
            ">
              <span style="font-weight:bold;color:#666666;">Pending</span>
              <span style="font-family:monospace;font-weight:bold;">
                ${formatNumberThreeDecimals(pending)} G
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              padding:4px 7px;
              background:#f4f0e5;
              font-size:11px;
            ">
              <span style="font-weight:bold;">Total Amount</span>
              <span style="font-family:monospace;font-weight:bold;">
                ₹${formatNumberWith2Decimals(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
          margin:4px 0 0;
          padding:4px 0 0;
          border-top:1px dashed #aaaaaa;
          font-size:9px;
          line-height:1;
          color:#444444;
        ">
          <div style="
            margin:0;
            padding:0;
          ">
            Contact For Support: 9511640351
          </div>

          <div style="
            width:120px;
            margin:0;
            padding:0;
            text-align:center;
          ">
            <div style="
              border-top:1px solid #555555;
              padding-top:2px;
              margin:0;
            ">
              Authorized Signature
            </div>
          </div>
        </div>

      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A5 landscape;
        margin: 0;
      }

      @media print {
        html,
        body {
          width: 210mm !important;
          height: 148mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #ffffff !important;
        }

        body * {
          visibility: hidden;
        }

        #print-container,
        #print-container * {
          visibility: visible;
        }

        #print-container {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          height: 148mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: hidden !important;
          z-index: 999999 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        #print-container > div {
          width: 210mm !important;
          height: 148mm !important;
          min-height: 148mm !important;
          max-height: 148mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        #print-container table {
          width: 100% !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        #print-container tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `;

    document.head.appendChild(style);

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 1000);
    }, 300);
  };

  // Save as Draft
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
        items: formData.items.map((item) => ({
          itemId:
            items.find((i: any) => i.name === item.item)?.id || item.itemId,
          itemName: item.item,
          sizeId:
            sizes.find((s: any) => s.size === item.size)?.id || item.sizeId,
          size: item.size,
          purity: item.purity,
          availableQty: item.availableQty,
          grossWeight: Number(item.grossWt.toFixed(3)),
          srp: item.srp,
          fineWeight: Number(item.fineWt.toFixed(3)),
          laborRate: item.laborRate || 0,
        })),
        customerWeight: Number(formData.customerWeight.toFixed(3)),
        remainingWeight: Number(remainingWeight.toFixed(3)),
        totalWeight: Number(totalGrossWt.toFixed(3)),
        type: 'DRAFT',
      };

      await updateBill.mutateAsync({id, data: billData});
      // toast.success('Bill updated as draft successfully!');
      navigate({to: '/billing'});
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  // Save as Completed with Print
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
          purity: item.purity,
          availableQty: item.availableQty,
          grossWeight: Number(item.grossWt.toFixed(3)),
          srp: item.srp,
          fineWeight: Number(item.fineWt.toFixed(3)),
          laborRate: item.laborRate || 0,
        })),
        customerWeight: Number(formData.customerWeight.toFixed(3)),
        remainingWeight: Number(remainingWeight.toFixed(3)),
        totalWeight: Number(totalGrossWt.toFixed(3)),
        type: 'BILL',
      };

      await updateBill.mutateAsync({id, data: billData});
      // toast.success('Bill updated successfully!');

      // Print the receipt after successful update
      setTimeout(() => {
        handlePrintReceipt(billData);
      }, 500);

      // Navigate after print
      setTimeout(() => {
        navigate({to: '/billing'});
      }, 2000);
    } catch (error: any) {
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
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={item.purity || ''}
              onChange={(e) =>
                handleItemChange(
                  actualIndex,
                  'purity',
                  parseFloat(e.target.value) || 0,
                )
              }
              placeholder="0"
              suffix="%"
              className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
              decimalScale={2}
            />
            {item.isLoadingQty && (
              <Loader2 className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#785600]" />
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
              className="bg-gray-50 w-full min-w-0 cursor-not-allowed rounded-md border border-[#d3c4af]/30 px-1.5 py-1.5 pr-6 text-right text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-700 dark:text-white"
              readOnly
            />
            <span className="text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] dark:text-slate-400">
              G
            </span>
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
            {...getScaleProps(actualIndex, 'grossWt')}
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
            type="number"
            step="0.01"
            min="0"
            value={item.srp || ''}
            onChange={(e) =>
              handleItemChange(
                actualIndex,
                'srp',
                parseFloat(e.target.value) || 0,
              )
            }
            placeholder="0.00"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
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
        const actualIndex = formData.items.indexOf(item);
        return (
          <GenericInputField
            type="number"
            step="0.01"
            min="0"
            value={item.laborRate || ''}
            onChange={(e) =>
              handleItemChange(
                actualIndex,
                'laborRate',
                parseFloat(e.target.value) || 0,
              )
            }
            placeholder="0.00"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
            decimalScale={2}
          />
        );
      },
    },
  ];

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
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({to: '/billing'})}
              className="flex flex-shrink-0 items-center gap-2 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
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
        <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                Client <span className="text-red-500">*</span>
              </label>

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
              Use + button to add more items, - button to remove
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
        <div className="mt-4 flex justify-start">
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
                  className="font-mono w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-emerald-600 focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                />
                <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
                  G
                </span>
              </div>
            </div>

            {/* Due Balance (Client Due - Read Only) */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
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
            </div>

            {/* Remaining Balance (Calculated: Advance - Total Fine Wt) */}
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

        {/* Action Buttons */}
        <div className="sticky bottom-0 z-50 border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-4 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <GenericButton
              type="button"
              onClick={handleSaveAsDraft}
              disabled={updateBill.isPending}
              className="hover:!bg-gray-700 !bg-gradient-to-br from-[#d97706] to-[#92400e] !text-white"
            >
              <FileText className="h-5 w-5" />
              {updateBill.isPending ? 'Saving...' : 'Save as Draft'}
            </GenericButton>

            <GenericButton
              type="button"
              onClick={handleUpdateReceipt}
              disabled={updateBill.isPending}
            >
              {updateBill.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                </>
              )}
              {updateBill.isPending ? 'Updating...' : 'Update Bill'}
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

            <div className="flex flex-col-reverse gap-2 border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-4 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end">
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
                disabled={updateBill.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateBill.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {updateBill.isPending ? 'Saving...' : 'Save as Draft'}
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
