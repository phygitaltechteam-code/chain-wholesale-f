import React, {useState, useEffect, useRef} from 'react';
import {X, Search, Printer, Edit, Trash2, Plus, Calendar} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import GenericButton from '../Forms/Buttons/GenericButton';
import {useDeleteBill, useGetBill} from '@/lib/api/bill';
import {useGetHeader} from '@/lib/api/headerapi';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import {Scale, DollarSign, ArrowDownToLine, Clock} from 'lucide-react';

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
    item: string;
    size: string;
    purity: number;
    finWt: number;
    srp: number;
    grossWeight: number;
  }[];
  // Formatted display strings with line breaks
  displayItems: string;
  displaySizes: string;
  displayPurity: string;
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

  const deleteClient = useDeleteBill();
  const [isLoading, setIsLoading] = useState(true);

  // Default date range: current Monday -> current Sunday
  const getCurrentWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {monday, sunday};
  };

  const {monday: defaultMonday, sunday: defaultSunday} = getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date[]>([defaultMonday]);
  const [toDate, setToDate] = useState<Date[]>([defaultSunday]);

  const [dateRange, setDateRange] = useState({
    from: defaultMonday.toISOString().split('T')[0],
    to: defaultSunday.toISOString().split('T')[0],
  });

  const fromDatePickerRef = useRef<any>(null);
  const toDatePickerRef = useRef<any>(null);

  const {data: billData, isLoading: billLoading} = useGetBill();

  useEffect(() => {
    setDefaultDateRange();
  }, []);

  const setDefaultDateRange = () => {
    const {monday, sunday} = getCurrentWeekRange();
    setDateRange({
      from: monday.toISOString().split('T')[0],
      to: sunday.toISOString().split('T')[0],
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
          const dateObj = new Date(receipt.receiptDate || receipt.createdAt);
          const formattedDate = dateObj.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          // Map all items
          const items =
            receipt.receiptItems?.map((item) => ({
              item: item.item?.name || 'N/A',
              size: item.size?.size || 'N/A',
              purity: item.purity || 0,
              finWt: item.fineWeight || 0,
              srp: item.srp || 0,
              grossWeight: item.grossWeight || 0,
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

          return {
            id: receipt.id,
            srNo: index + 1,
            dateTime: formattedDate,
            billNo: `BILL-${String(index + 1).padStart(4, '0')}`,
            clientName: receipt.client?.fullName || 'N/A',
            phoneNumber: receipt.client?.phoneNumber || 'N/A',
            receive: receipt.customerWeight || 0,
            pending: receipt.remainingWeight || 0,
            type:
              receipt.type ||
              (receipt.remainingWeight === 0 ? 'BILL' : 'DRAFT'),
            createdAt: receipt.createdAt,
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

  // Filter entries
  const filteredGroups = billingGroups.filter((group) => {
    const matchesSearch =
      group.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.phoneNumber.includes(searchTerm) ||
      group.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.items.some((item) =>
        item.item.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    let matchesDate = true;
    if (fromDate.length > 0 && toDate.length > 0) {
      const entryDate = new Date(group.createdAt);
      const from = new Date(fromDate[0]);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate[0]);
      to.setHours(23, 59, 59, 999);
      matchesDate = entryDate >= from && entryDate <= to;
    }

    return matchesSearch && matchesDate;
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

  // Print Receipt (Matching ReceiptAdd receipt format)
  const handlePrintReceipt = (group: BillGroup) => {
    if (!group) return;

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

    const phoneNumber = group?.phoneNumber || 'N/A';
    const dateStr =
      group.dateTime ||
      new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    const totalFineWt = group.totalFinWt || 0;
    const totalGrossWt = group.items.reduce(
      (sum, i) => sum + (i.grossWeight || 0),
      0,
    );
    const totalSRP = group.totalSRP || 0;
    const totalLabor = 0;
    const totalAmount = totalSRP + totalLabor;
    const receive = group.receive || 0;
    const pending = group.pending || 0;

    let itemsRows = '';
    group.items.forEach((item, index) => {
      const itemAmount = item.srp || 0;
      itemsRows += `
        <tr>
          <td style="border:1px solid #222;padding:3px 4px;text-align:center;font-size:9px;color:#000;">${index + 1}</td>
          <td style="border:1px solid #222;padding:3px 4px;font-size:9px;color:#000;">${item.item || '-'}</td>
          <td style="border:1px solid #222;padding:3px 4px;font-size:9px;color:#000;">${item.size || '-'}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberWithDecimals(item.purity)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-weight:bold;font-size:9px;color:#000;">${formatNumberWithDecimals(item.finWt)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberWithDecimals(item.grossWeight)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberWith2Decimals(item.srp)}</td>
          <td style="border:1px solid #222;padding:3px 4px;text-align:right;font-family:monospace;font-size:9px;color:#000;">0.00</td>
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
            ${group.clientName}
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
                ${formatNumberWithDecimals(totalFineWt)} G
              </span>
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              padding:3px 7px;
              border-bottom:1px dashed #dddddd;
              font-size:10px;
            ">
              <span style="font-weight:bold;color:#666666;">Receive</span>
              <span style="font-family:monospace;font-weight:bold;">
                ${formatNumberWithDecimals(receive)} G
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
                ${formatNumberWithDecimals(pending)} G
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

  // Print Table Report (Matching Tar / Cutting departmental reports)
  const handlePrintTable = () => {
    if (!filteredGroups || filteredGroups.length === 0) {
      toast.error('No records available to print');
      return;
    }

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 210mm;
      min-height: 297mm;
      background: white;
      padding: 0;
      z-index: 9999;
    `;
    document.body.appendChild(printContainer);

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
      .map(
        (group, index) => `
      <tr>
        <td style="border:1px solid #000;padding:3px 2px;text-align:center;font-size:9px;color:#000;">${index + 1}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:center;font-size:8px;color:#000;">${group.dateTime}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:center;font-size:9px;font-weight:bold;color:#000;">${group.billNo}</td>
        <td style="border:1px solid #000;padding:3px 2px;font-size:9px;color:#000;">${group.clientName}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:center;font-size:8px;color:#000;">${group.phoneNumber}</td>
        <td style="border:1px solid #000;padding:3px 2px;font-size:9px;color:#000;white-space:pre-line;">${group.displayItems}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:center;font-size:9px;color:#000;white-space:pre-line;">${group.displaySizes}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:center;font-size:9px;color:#000;white-space:pre-line;">${group.displayPurity}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:right;font-family:monospace;font-size:9px;color:#000;white-space:pre-line;">${group.displayFinWt}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:right;font-family:monospace;font-size:9px;color:#000;white-space:pre-line;">${group.displaySRP}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberWithDecimals(group.receive)}</td>
        <td style="border:1px solid #000;padding:3px 2px;text-align:right;font-family:monospace;font-size:9px;color:#000;">${formatNumberWithDecimals(group.pending)}</td>
      </tr>
    `,
      )
      .join('');

    printContainer.innerHTML = `
      <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
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
          <div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0 6px 0;padding:0;">
            <div style="flex:1;"></div>
            <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">Billing History Report</h2>
            <div style="flex:1;text-align:right;font-size:10px;color:#000;font-weight:bold;">
              Date: ${fromStr} to ${toStr}
            </div>
          </div>

          <!-- Table -->
          <table style="width:100%;border-collapse:collapse;margin-top:2px;">
            <thead>
              <tr style="background:#785600;color:white;font-size:10px;">
                <th style="border:1px solid #785600;padding:4px 2px;text-align:center;">Sr</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:center;">Date & Time</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:center;">Bill No</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:left;">Client Name</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:center;">Phone</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:left;">Item</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:center;">Size</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:center;">Purity %</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:right;">Fine Wt</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:right;">SRP</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:right;">Receive</th>
                <th style="border:1px solid #785600;padding:4px 2px;text-align:right;">Pending</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Add print styles matching AddTar / CuttingDept exactly
    const style = document.createElement('style');
    style.textContent = `
      @page {
        margin: 3mm;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        #print-container, #print-container * {
          visibility: visible;
        }
        #print-container {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: white !important;
          padding: 4px !important;
          overflow: auto !important;
          z-index: 9999 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-container table {
          width: 100% !important;
        }
        #print-container tr {
          page-break-inside: avoid !important;
        }
        #print-container thead tr {
          background: #785600 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-container thead tr th {
          background: #785600 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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
    }, 500);
  };

  const handleRowClick = (group: BillGroup) => {
    navigate({to: '/billiupdate/$id', params: {id: group.id}});
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

  const renderActions = (item: BillGroup, index: number) => (
    <div className="flex items-center justify-center gap-1">
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
              onClick={() => navigate({to: '/receipt/addreciept'})}
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

          <GenericDatePicker
            id="from-date"
            placeholder="DD/MM/YYYY"
            dateFormat="d/m/Y"
            initialDate={fromDate[0]}
            onDateChange={(dates) => {
              if (dates?.length > 0) {
                const selected = new Date(dates[0]);
                selected.setHours(0, 0, 0, 0);
                setFromDate([selected]);
                setDateRange((prev) => ({
                  ...prev,
                  from: selected.toISOString().split('T')[0],
                }));
              }
            }}
            className="w-28 sm:w-32"
          />

          <GenericDatePicker
            id="to-date"
            placeholder="DD/MM/YYYY"
            dateFormat="d/m/Y"
            initialDate={toDate[0]}
            onDateChange={(dates) => {
              if (dates?.length > 0) {
                const selected = new Date(dates[0]);
                selected.setHours(23, 59, 59, 999);
                setToDate([selected]);
                setDateRange((prev) => ({
                  ...prev,
                  to: selected.toISOString().split('T')[0],
                }));
              }
            }}
            className="w-28 sm:w-32"
          />

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
      </div>
    </div>
  );
};

export default Billing;
