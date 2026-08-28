import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Printer,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Factory,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import GenericButton from '../Forms/Buttons/GenericButton';
import { useDeleteBill, useGetBill } from '@/lib/api/bill';
import { useGetHeader } from '@/lib/api/headerapi';
import { printReceipt } from '@/utils/printReceipt';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import {
  Scale,
  DollarSign,
  ArrowDownToLine,
  Clock,
  Key,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { useGetProfileData, useActivateKey } from '@/lib/api/profile';
import GenericWeeklyDatePicker from '../Forms/DatePicker/GenericWeeklyDatePicker';

interface ReceiptItem {
  id: string;
  receiptID: string;
  itemID: string;
  sizeID: string;
  purity: number;
  grossWeight: number;
  srp: number;
  fineWeight: number;
  laborRate: number;
  item: {
    id: string;
    name: string;
  };
  size: {
    id: string;
    size: string;
  };
}

interface ReceiptData {
  id: string;
  clientID: string;
  receiptDate: string;
  billNumber?: string;
  totalWeight: number;
  customerWeight: number;
  remainingWeight: number;
  createdAt: string;
  type: string;
  client: {
    id: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    openingBalance: number;
  };
  receiptItems: ReceiptItem[];
}

// ─── Grouped Bill Entry with Items ─────────────────────────────────────────────
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

const Billing: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [billingGroups, setBillingGroups] = useState<BillGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<BillGroup | null>(null);

  // Profile data & subscription expiry validation
  const checkexpiration = useGetProfileData();
  const profileData = checkexpiration?.data?.data || checkexpiration?.data;
  const expiryDate = profileData?.expiryDate;
  const storedKey = profileData?.key;

  const [enteredKey, setEnteredKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const activateKeyMutation = useActivateKey();

  // Check if current date is past expiryDate
  const isExpired = Boolean(
    expiryDate && new Date() > new Date(expiryDate) && !isUnlocked,
  );

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = enteredKey.trim().toUpperCase();
    if (!cleanKey) {
      setKeyError('Please enter your license / activation key');
      return;
    }

    activateKeyMutation.mutate(
      { key: cleanKey },
      {
        onSuccess: () => {
          setIsUnlocked(true);
          setKeyError('');
          setEnteredKey('');
          checkexpiration.refetch();
        },
        onError: (err: any) => {
          // If stored key matches offline fallback, unlock
          if (storedKey && cleanKey === storedKey.trim().toUpperCase()) {
            setIsUnlocked(true);
            setKeyError('');
            toast.success('License verified successfully!');
            checkexpiration.refetch();
          } else {
            const errorMsg =
              err?.message ||
              'Invalid key. Please contact your admin for a valid renewal key.';
            setKeyError(errorMsg);
          }
        },
      },
    );
  };

  const deleteClient = useDeleteBill();
  const [isLoading, setIsLoading] = useState(true);

  const formatToLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default date range: current Monday -> current Sunday
  const getCurrentWeekRange = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      monday,
      sunday,
      fromStr: formatToLocalDateString(monday),
      toStr: formatToLocalDateString(sunday),
    };
  };

  const {
    monday: defaultMonday,
    sunday: defaultSunday,
    fromStr,
    toStr,
  } = getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date[]>([defaultMonday]);
  const [toDate, setToDate] = useState<Date[]>([defaultSunday]);

  const [dateRange, setDateRange] = useState({
    from: fromStr,
    to: toStr,
  });

  const fromDatePickerRef = useRef<any>(null);
  const toDatePickerRef = useRef<any>(null);

  const { data: billData, isLoading: billLoading } = useGetBill();

  useEffect(() => {
    setDefaultDateRange();
  }, []);

  const setDefaultDateRange = () => {
    const { monday, sunday, fromStr, toStr } = getCurrentWeekRange();
    setDateRange({
      from: fromStr,
      to: toStr,
    });
    setFromDate([monday]);
    setToDate([sunday]);
  };

  // Process API data - Group items by bill
  useEffect(() => {
    if (billLoading) {
      setIsLoading(true);
      return;
    }

    if (billData && Array.isArray(billData)) {
      const groups: BillGroup[] = billData.map(
        (receipt: ReceiptData, index: number) => {
          const rawDate = receipt.createdAt || receipt.receiptDate;
          let formattedDate = '-';
          if (rawDate) {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0');
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const year = dateObj.getFullYear();
              let hours = dateObj.getHours();
              const minutes = String(dateObj.getMinutes()).padStart(2, '0');
              const ampm = hours >= 12 ? 'pm' : 'am';
              hours = hours % 12;
              hours = hours ? hours : 12;
              const formattedHours = String(hours).padStart(2, '0');
              formattedDate = `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
            }
          }

          // Map all items
          const items =
            receipt.receiptItems?.map((item) => ({
              itemId: item.itemID || (item as any).itemId || item.item?.id || '',
              sizeId: item.sizeID || (item as any).sizeId || item.size?.id || '',
              item: item.item?.name || 'N/A',
              size: item.size?.size || 'N/A',
              purity: item.purity || 0,
              availableQty: (item as any).availableQty || (item as any).quantity || 0,
              finWt: item.fineWeight || 0,
              srp: item.srp || 0,
              grossWeight: item.grossWeight || 0,
              laborRate: (item as any).laborRate || (item as any).labor || 0,
            })) || [];

          // Calculate totals
          const totalFinWt = items.reduce((sum, i) => sum + i.finWt, 0);
          const totalSRP = items.reduce((sum, i) => sum + i.srp, 0);

          // Join items with line breaks for display
          const displayItems = items.map((i) => i.item).join('\n');
          const displaySizes = items.map((i) => i.size).join('\n');
          const displayPurity = items
            .map((i) => formatNumberWithDecimals(i.purity) + '%')
            .join('\n');
          const displayFinWt = items
            .map((i) => formatNumberWithDecimals(i.finWt))
            .join('\n');
          const displaySRP = items
            .map((i) => formatNumberWithDecimals(i.srp))
            .join('\n');

          const billNumber =
            receipt.billNumber ||
            (receipt as any).billNo ||
            `BILL-${String(index + 1).padStart(4, '0')}`;

          return {
            id: receipt.id,
            srNo: index + 1,
            dateTime: formattedDate,
            billNo: billNumber,
            clientName: receipt.client?.fullName || 'N/A',
            phoneNumber: receipt.client?.phoneNumber || 'N/A',
            receive: receipt.customerWeight || 0,
            pending: receipt.remainingWeight || 0,
            type:
              (receipt.type as 'DRAFT' | 'BILL') ||
              (receipt.remainingWeight === 0 ? 'BILL' : 'DRAFT'),
            createdAt: receipt.createdAt || receipt.receiptDate,
            items: items,
            displayItems: displayItems,
            displaySizes: displaySizes,
            displayPurity: displayPurity,
            displayFinWt: displayFinWt,
            displaySRP: displaySRP,
            totalFinWt: totalFinWt,
            totalSRP: totalSRP,
          };
        },
      );

      setBillingGroups(groups);
    } else {
      setBillingGroups([]);
    }
    setIsLoading(false);
  }, [billData, billLoading]);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BILL' | 'DRAFT'>(
    'ALL',
  );

  // Filter entries
  const filteredGroups = billingGroups.filter((group) => {
    const matchesSearch =
      group.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.phoneNumber.includes(searchTerm) ||
      group.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.items.some((item) =>
        item.item.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesStatus =
      statusFilter === 'ALL' || group.type === statusFilter;

    let matchesDate = true;
    if (dateRange.from || dateRange.to) {
      const rawDate = group.createdAt || group.dateTime;
      if (rawDate) {
        const entryDate = new Date(rawDate);
        if (!isNaN(entryDate.getTime())) {
          if (dateRange.from) {
            const from = new Date(dateRange.from + 'T00:00:00');
            if (entryDate < from) matchesDate = false;
          }
          if (dateRange.to) {
            const to = new Date(dateRange.to + 'T23:59:59.999');
            if (entryDate > to) matchesDate = false;
          }
        }
      }
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Calculate totals from filtered entries
  const totalFinWt = filteredGroups.reduce(
    (sum, group) => sum + group.totalFinWt,
    0,
  );
  const totalSRP = filteredGroups.reduce(
    (sum, group) => sum + group.totalSRP,
    0,
  );
  const totalReceive = filteredGroups.reduce(
    (sum, group) => sum + group.receive,
    0,
  );
  const totalPending = filteredGroups.reduce(
    (sum, group) => sum + group.pending,
    0,
  );
  const totalEntries = filteredGroups.length;

  const formatNumberWithDecimals = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  const formatNumberWith2Decimals = (value: number) => {
    if (value === 0 || !value) return '0.00';
    return value.toFixed(2);
  };

  // Print Receipt (Using shared printReceipt function)
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

  // Print Table Report (Matching Tar / Cutting departmental reports)
  const handlePrintTable = () => {
    if (!filteredGroups || filteredGroups.length === 0) {
      toast.error('No records available to print');
      return;
    }

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

    const formatDateStr = (d: Date | null) => {
      if (!d) return '-';
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const fromStr = fromDate.length > 0 ? formatDateStr(fromDate[0]) : '';
    const toStr = toDate.length > 0 ? formatDateStr(toDate[0]) : '';

    const rows = filteredGroups
      .map((group, index) => {
        const items = group.items && group.items.length > 0 ? group.items : [
          {
            item: group.displayItems || '-',
            size: group.displaySizes || '-',
            purity: Number(group.displayPurity) || 0,
            finWt: group.totalFinWt || 0,
            srp: group.totalSRP || 0,
            grossWeight: 0,
          },
        ];

        const rowCount = items.length;

        return items
          .map((item, itemIdx) => {
            if (itemIdx === 0) {
              return `
              <tr>
                <td rowspan="${rowCount}" style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;vertical-align:middle;">${index + 1}</td>
                <td rowspan="${rowCount}" style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;vertical-align:middle;">${group.dateTime}</td>
                <td rowspan="${rowCount}" style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;font-weight:bold;color:#000;vertical-align:middle;">${group.billNo}</td>
                <td rowspan="${rowCount}" style="border:1px solid #000;padding:1px 2px;font-size:11px;font-weight:600;color:#000;vertical-align:middle;">${group.clientName}</td>
                <td rowspan="${rowCount}" style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;vertical-align:middle;">${group.phoneNumber || '-'}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${item.item || '-'}${item.size ? ` (${item.size})` : ''}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${item.purity ? `${formatNumberWithDecimals(item.purity)}%` : '-'}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:right;font-family:monospace;font-size:11px;color:#000;font-weight:bold;">${item.finWt !== undefined && item.finWt !== null ? `${formatNumberWithDecimals(item.finWt)}` : '-'}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:right;font-family:monospace;font-size:11px;color:#000;">${item.srp !== undefined && item.srp !== null && Number(item.srp) > 0 ? `${formatNumberWith2Decimals(item.srp)}` : '-'}</td>
                <td rowspan="${rowCount}" style="border:1px solid #000;padding:1px 2px;text-align:right;font-family:monospace;font-size:11px;color:#000;vertical-align:middle;">${formatNumberWithDecimals(group.receive)}</td>
                <td rowspan="${rowCount}" style="border:1px solid #000;padding:1px 2px;text-align:right;font-family:monospace;font-size:11px;color:#000;vertical-align:middle;font-weight:bold;">${formatNumberWithDecimals(group.pending)}</td>
              </tr>
            `;
            } else {
              return `
              <tr>
                <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${item.item || '-'}${item.size ? ` (${item.size})` : ''}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${item.purity ? `${formatNumberWithDecimals(item.purity)}%` : '-'}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:right;font-family:monospace;font-size:11px;color:#000;font-weight:bold;">${item.finWt !== undefined && item.finWt !== null ? `${formatNumberWithDecimals(item.finWt)}` : '-'}</td>
                <td style="border:1px solid #000;padding:1px 2px;text-align:right;font-family:monospace;font-size:11px;color:#000;">${item.srp !== undefined && item.srp !== null && Number(item.srp) > 0 ? `${formatNumberWith2Decimals(item.srp)}` : '-'}</td>
              </tr>
            `;
            }
          })
          .join('');
      })
      .join('');

    const totalFineAll = filteredGroups.reduce((s, g) => s + (g.totalFinWt || 0), 0);
    const totalReceiveAll = filteredGroups.reduce((s, g) => s + (g.receive || 0), 0);
    const totalPendingAll = filteredGroups.reduce((s, g) => s + (g.pending || 0), 0);

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billing Report</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background: #ffffff;
              padding: 0;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .report-container {
              width: 100%;
              max-width: 287mm;
              margin: 0 auto;
              padding: 6mm 5mm;
              box-sizing: border-box;
            }
            @page {
              size: A4 landscape;
              margin: 3mm;
            }
            @media print {
              body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .report-container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 3mm !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
              }
              tr {
                page-break-inside: avoid !important;
              }
              thead tr, thead tr th {
                background: #785600 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              tfoot tr {
                background: #fef3c7 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <!-- Header Section -->
            <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
                <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
                <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
                <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
              </div>
              <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">${description}</div>
              <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
                ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
              </div>
              <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;"></div>
            </div>

            <!-- Title and Date Range -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
              <div style="flex:1;"></div>
              <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">Billing Report.</h2>
              <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
                ${fromStr && toStr ? `From: ${fromStr} &nbsp; To: ${toStr}` : ''}
              </div>
            </div>

            <!-- Table -->
            <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
              <thead>
                <tr style="background:#785600;color:white;font-weight:600;">
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:3%;">Sr</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:10%;">Date & Time</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:8%;">Bill No</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:16%;">Client Name</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:10%;">Phone</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:14%;">Item (Size)</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:7%;">Purity</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:8%;">Fine Wt</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:7%;">SRP</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:8%;">Receive</th>
                  <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:9%;">Pending</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
              <tfoot>
                <tr style="background:#fef3c7;font-weight:bold;font-size:11px;">
                  <td colspan="7" style="border:1px solid #000;padding:2px 4px;text-align:right;color:#000;">TOTAL:</td>
                  <td style="border:1px solid #000;padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberWithDecimals(totalFineAll)}</td>
                  <td style="border:1px solid #000;padding:2px 4px;text-align:right;color:#000;">-</td>
                  <td style="border:1px solid #000;padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberWithDecimals(totalReceiveAll)}</td>
                  <td style="border:1px solid #000;padding:2px 4px;text-align:right;font-family:monospace;color:#000;">${formatNumberWithDecimals(totalPendingAll)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
    } else {
      toast.error('Please allow pop-ups to print the report');
    }
  };

  const handleDelete = (group: BillGroup) => {
    if (
      !window.confirm(`Are you sure you want to delete bill ${group.billNo}?`)
    ) {
      return;
    }

    deleteClient.mutate(group.id, {
      onSuccess: () => {
        setBillingGroups((prev) => prev.filter((e) => e.id !== group.id));
        toast.success(`Bill ${group.billNo} deleted successfully`);
      },
      onError: (error: any) => {
        console.error('Delete bill error:', error);
        toast.error(error?.response?.data?.message || 'Failed to delete bill');
      },
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BILL':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const [showManufacturingItemPicker, setShowManufacturingItemPicker] =
    useState<BillGroup | null>(null);

  const handleSendToManufacturing = (group: BillGroup) => {
    if (!group.items || group.items.length === 0) {
      toast.error('No items found in this bill');
      return;
    }

    const itemsToSend = group.items.map((item) => ({
      itemId: item.itemId || '',
      sizeId: item.sizeId || '',
      itemName: item.item,
      sizeName: item.size,
      grossWt: item.grossWeight,
      purity: item.purity,
      fine: item.finWt,
    }));

    sessionStorage.setItem(
      'manufacturing_billing_prefill',
      JSON.stringify(itemsToSend),
    );
    toast.success(
      `Sending ${itemsToSend.length} item${itemsToSend.length > 1 ? 's' : ''} to Tar Department...`,
    );
    navigate({ to: '/manufacturingprocess/process' });
  };

  const handleSelectManufacturingItem = (item: any) => {
    sessionStorage.setItem(
      'manufacturing_billing_prefill',
      JSON.stringify([
        {
          itemId: item.itemId || '',
          sizeId: item.sizeId || '',
          itemName: item.item,
          sizeName: item.size,
          grossWt: item.grossWeight,
          purity: item.purity,
          fine: item.finWt,
        },
      ]),
    );
    setShowManufacturingItemPicker(null);
    toast.success(
      `Sending ${item.item} (${item.grossWeight}g) to Tar Department...`,
    );
    navigate({ to: '/manufacturingprocess/process' });
  };

  const handleSendAllManufacturingItems = (group: BillGroup) => {
    handleSendToManufacturing(group);
    setShowManufacturingItemPicker(null);
  };

  const handleRowClick = (item: BillGroup) => {
    navigate({ to: `/billiupdate/${item.id}` });
  };

  const renderActions = (item: BillGroup, index: number) => (
    <div className="flex items-center justify-center gap-1">
      {item.type === 'DRAFT' && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSendToManufacturing(item);
            }}
            className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-400/20"
            title="Start Manufacturing (Add Tar)"
          >
            <Factory className="h-4 w-4" />
          </button>
        </>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrintReceipt(item);
        }}
        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
        title="Print Receipt"
      >
        <Printer className="h-4 w-4" />
      </button>
    
      {item.type === 'DRAFT' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(item);
          }}
          disabled={deleteClient.isPending}
          className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  // ─── Columns Definition ──────────────────────────────────────────────────────
  const columns: Column<BillGroup>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'billNo',
      header: 'Bill No',
      render: (item) => (
        <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
          {item.billNo}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.clientName}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.phoneNumber}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayItems.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="text-sm font-medium leading-relaxed text-[#1a1c1b] dark:text-white"
            >
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displaySizes.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="text-sm leading-relaxed text-[#1a1c1b] dark:text-white"
            >
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayPurity.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="font-mono text-sm leading-relaxed text-[#1a1c1b] dark:text-white"
            >
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'finWt',
      header: 'Fin Wt (g)',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayFinWt.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="font-mono text-sm font-bold leading-relaxed text-black dark:text-amber-400"
            >
              {line} G
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'srp',
      header: 'SRP (g)',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displaySRP.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="font-mono text-sm leading-relaxed text-[#1a1c1b] dark:text-white"
            >
              {line} G
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'receive',
      header: 'Receive (g)',
      render: (item) => (
        <span className="font-mono text-sm font-semibold text-black dark:text-green-400">
          {formatNumberWithDecimals(item.receive)} G
        </span>
      ),
    },
    {
      key: 'pending',
      header: 'Pending (g)',
      render: (item) => (
        <span className="font-mono text-sm font-semibold text-black dark:text-red-400">
          {formatNumberWithDecimals(Math.abs(item.pending))} G
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Status',
      render: (item) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getTypeColor(item.type)}`}
        >
          {item.type || '-'}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-[#785600] border-t-transparent"></div>
          <p className="text-[#4f4535] dark:text-slate-400">
            Loading billing entries...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Header & Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PageHeader title="Billing" />
            </div>
            <GenericButton
              type="button"
              onClick={() => navigate({ to: '/receipt/addreciept' })}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add Bill</span>
            </GenericButton>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Fin Wt
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumberWithDecimals(totalFinWt)} G
                </span>
              </div>
              <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-amber-700/30 dark:bg-amber-900/30">
                <Scale className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total SRP
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumberWithDecimals(totalSRP)} G
                </span>
              </div>
              <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-blue-700/30 dark:bg-blue-900/30">
                <DollarSign className="h-4 w-4 text-[#785600] dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Receive
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumberWithDecimals(totalReceive)} G
                </span>
              </div>
              <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-green-700/30 dark:bg-green-900/30">
                <ArrowDownToLine className="h-4 w-4 text-[#785600] dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Pending
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumberWithDecimals(Math.abs(totalPending))} G
                </span>
              </div>
              <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-red-700/30 dark:bg-red-900/30">
                <Clock className="h-4 w-4 text-[#785600] dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative min-w-[140px] flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search by client, phone, bill no, item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GenericWeeklyDatePicker
              id="from-date-billing"
              placeholder="DD/MM/YYYY"
              mode="from"
              initialDates={
                dateRange.from ? [new Date(dateRange.from + 'T00:00:00')] : []
              }
              onDateChange={(dates) => {
                if (dates && dates.length > 0) {
                  const d = dates[0];
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  setDateRange((prev) => ({
                    ...prev,
                    from: `${year}-${month}-${day}`,
                  }));
                  setFromDate([d]);
                } else {
                  setDateRange((prev) => ({
                    ...prev,
                    from: '',
                  }));
                  setFromDate([]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />

            <GenericWeeklyDatePicker
              id="to-date-billing"
              placeholder="DD/MM/YYYY"
              mode="to"
              initialDates={
                dateRange.to ? [new Date(dateRange.to + 'T00:00:00')] : []
              }
              onDateChange={(dates) => {
                if (dates && dates.length > 0) {
                  const d = dates[0];
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  setDateRange((prev) => ({
                    ...prev,
                    to: `${year}-${month}-${day}`,
                  }));
                  setToDate([d]);
                } else {
                  setDateRange((prev) => ({
                    ...prev,
                    to: '',
                  }));
                  setToDate([]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'BILL' | 'DRAFT')
              }
              className="h-[38px] rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">All Status</option>
              <option value="BILL">Bill (Completed)</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          <GenericButton
            onClick={() => {
              if (filteredGroups.length === 0) {
                toast.error('No records to print');
                return;
              }
              handlePrintTable();
            }}
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </GenericButton>
        </div>

        {/* Table */}
        <GenericTable<BillGroup>
          data={filteredGroups}
          columns={columns}
          onSave={(item) => console.log('Save:', item)}
          emptyMessage="No billing entries found for the selected filters."
          isLoading={false}
          renderActions={renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
          onRowClick={handleRowClick}
        />

        {/* Subscription Expired Modal Popup */}
        {isExpired && (
          <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm duration-200">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-200/50 bg-white shadow-2xl dark:border-red-900/50 dark:bg-slate-900">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-600 to-amber-600 p-6 text-center text-white">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold tracking-wide">
                  Subscription Expired
                </h3>
                <p className="mt-1 text-xs text-red-100">
                  Your access period has expired. Please contact your admin to
                  renew.
                </p>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 p-6">
                {/* Expiry Details Card */}
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">
                      User / Shop:
                    </span>
                    <span className="font-bold">
                      {profileData?.user?.fullname || 'Admin Account'}
                    </span>
                  </div>
                  {profileData?.user?.phoneNumber && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">
                        Phone:
                      </span>
                      <span>{profileData.user.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">
                      Expired On:
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {expiryDate
                        ? new Date(expiryDate).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : 'Expired'}
                    </span>
                  </div>
                </div>

                {/* Key Submission Form */}
                <form onSubmit={handleKeySubmit} className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      Enter Renewal / Activation Key
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={enteredKey}
                        onChange={(e) => {
                          setEnteredKey(e.target.value);
                          if (keyError) setKeyError('');
                        }}
                        placeholder="e.g. XXXX-XXXX-XXXX-XXXX"
                        className={`font-mono w-full rounded-lg border px-3.5 py-2.5 text-xs uppercase text-[#1a1c1b] placeholder:text-[#817563] focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white ${keyError
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-[#d3c4af]/40 focus:border-[#785600] focus:ring-[#785600]/10 dark:border-slate-700'
                          }`}
                      />
                    </div>
                    {keyError && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        {keyError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={activateKeyMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#785600] to-[#986d00] py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
                  >
                    <Key className="h-4 w-4" />
                    <span>
                      {activateKeyMutation.isPending
                        ? 'Verifying & Activating...'
                        : 'Submit & Activate Key'}
                    </span>
                  </button>
                </form>

                {/* Contact Help */}
                <div className="text-gray-500 dark:text-gray-400 pt-1 text-center text-[11px]">
                  <span>Need a new renewal key? Please contact your </span>
                  <span className="font-semibold text-[#785600] dark:text-amber-400">
                    System Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Manufacturing Item Picker Modal (When bill has multiple items) */}
        {showManufacturingItemPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
                    <Factory className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
                      Select Item for Manufacturing
                    </h3>
                    <p className="text-xs text-[#817563] dark:text-slate-400">
                      Bill #{showManufacturingItemPicker.billNo} • {showManufacturingItemPicker.clientName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManufacturingItemPicker(null)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2.5">
                <p className="text-xs text-[#4f4535] dark:text-slate-300 mb-2">
                  Click on an item to send its details (Item, Size, Gross Weight, Purity) to the <strong>Tar Department</strong>:
                </p>
                {showManufacturingItemPicker.items.map((it, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectManufacturingItem(it)}
                    className="w-full text-left flex items-center justify-between p-3.5 rounded-lg border border-[#d3c4af]/30 bg-[#fbfaf8] hover:bg-amber-50/50 hover:border-amber-400/50 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700/60"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                        {it.item} <span className="text-xs font-normal text-[#817563] dark:text-slate-400">({it.size})</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#4f4535] dark:text-slate-300">
                        <span>Gross: <strong className="font-mono">{it.grossWeight}g</strong></span>
                        <span>Purity: <strong className="font-mono">{it.purity}%</strong></span>
                        <span>Fine: <strong className="font-mono text-[#785600] dark:text-amber-400">{it.finWt}g</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <span>Send</span>
                      <Factory className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-[#d3c4af]/20 p-3.5 dark:border-slate-700">
                <button
                  onClick={() =>
                    handleSendAllManufacturingItems(showManufacturingItemPicker)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700 shadow-sm"
                >
                  <Factory className="h-4 w-4" />
                  <span>
                    Send All ({showManufacturingItemPicker.items.length} Items)
                  </span>
                </button>
                <button
                  onClick={() => setShowManufacturingItemPicker(null)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-[#4f4535] transition-colors hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
