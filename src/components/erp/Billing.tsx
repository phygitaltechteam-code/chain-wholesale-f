import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Printer, Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import GenericButton from '../Forms/Buttons/GenericButton';
import { useGetBill } from '@/lib/api/bill';
import GenericDatePicker from '../Forms/DatePicker/GenericDatePicker';
import {
  Scale,
  DollarSign,
  ArrowDownToLine,
  Clock
} from 'lucide-react';

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

interface BillingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  billNo: string;
  clientName: string;
  phoneNumber: string;
  item: string;
  size: string;
  purity: number;
  finWt: number;
  srp: number;
  receive: number;
  pending: number;
  grossWeight: number;

  type: 'DRAFT' | 'BILL';
  createdAt: string;
}

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<BillingEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Default date range: current Monday -> current Sunday
  const getCurrentWeekRange = () => {
    const today = new Date();

    const day = today.getDay(); // Sunday = 0, Monday = 1
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const { monday: defaultMonday, sunday: defaultSunday } =
    getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date[]>([defaultMonday]);
  const [toDate, setToDate] = useState<Date[]>([defaultSunday]);

  const [dateRange, setDateRange] = useState({
    from: defaultMonday.toISOString().split('T')[0],
    to: defaultSunday.toISOString().split('T')[0],
  });

  // Add refs for date pickers
  const fromDatePickerRef = useRef<any>(null);
  const toDatePickerRef = useRef<any>(null);

  const { data: billData, isLoading: billLoading } = useGetBill();

  useEffect(() => {
    setDefaultDateRange();
  }, []);


  const setDefaultDateRange = () => {
    const { monday, sunday } = getCurrentWeekRange();

    setDateRange({
      from: monday.toISOString().split('T')[0],
      to: sunday.toISOString().split('T')[0],
    });

    setFromDate([monday]);
    setToDate([sunday]);
  };

  // Process API data
  useEffect(() => {
    if (billLoading) {
      setIsLoading(true);
      return;
    }

    if (billData && Array.isArray(billData)) {
      const entries: BillingEntry[] = billData.map((receipt: ReceiptData, index: number) => {
        const firstItem = receipt.receiptItems?.[0];
        const itemName = firstItem?.item?.name || 'N/A';
        const sizeName = firstItem?.size?.size || 'N/A';
        const fineWeight = firstItem?.fineWeight || 0;
        const srp = firstItem?.srp || 0;

        let type: 'DRAFT' | 'BILL';
        if (receipt.remainingWeight === 0) {
          type = 'BILL';
        } else if (receipt.customerWeight === 0) {
          type = 'DRAFT';
        }

        const dateObj = new Date(receipt.receiptDate || receipt.createdAt);
        const formattedDate = dateObj.toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        return {
          id: receipt.id,
          srNo: index + 1,
          dateTime: formattedDate,
          billNo: `BILL-${String(index + 1).padStart(4, '0')}`,
          clientName: receipt.client?.fullName || 'N/A',
          phoneNumber: receipt.client?.phoneNumber || 'N/A',
          item: itemName,
          size: sizeName,
          purity: firstItem?.purity || 0,
          finWt: fineWeight,
          srp: srp,
          receive: receipt.customerWeight || 0,
          pending: receipt.remainingWeight || 0,
          type: receipt.type,
          createdAt: receipt.createdAt,
        };
      });

      setBillingEntries(entries);
    } else {
      setBillingEntries([]);
    }
    setIsLoading(false);
  }, [billData, billLoading]);

  // Filter entries
  const filteredEntries = billingEntries.filter(entry => {
    const matchesSearch =
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.phoneNumber.includes(searchTerm) ||
      entry.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.item.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;

    if (fromDate.length > 0 && toDate.length > 0) {
      const entryDate = new Date(entry.createdAt);

      const from = new Date(fromDate[0]);
      from.setHours(0, 0, 0, 0);

      const to = new Date(toDate[0]);
      to.setHours(23, 59, 59, 999);

      matchesDate = entryDate >= from && entryDate <= to;
    }

    return matchesSearch && matchesDate;
  });

  // Calculate totals from filtered entries
  const totalFinWt = filteredEntries.reduce((sum, item) => sum + item.finWt, 0);
  const totalSRP = filteredEntries.reduce((sum, item) => sum + item.srp, 0);
  const totalReceive = filteredEntries.reduce((sum, item) => sum + item.receive, 0);
  const totalPending = filteredEntries.reduce((sum, item) => sum + item.pending, 0);
  const totalEntries = filteredEntries.length;

  // Format number with 3 decimals only if needed
  const formatNumberWithDecimals = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  // Format number with 2 decimals for billing
  const formatNumberWith2Decimals = (value: number) => {
    if (value === 0 || !value) return '0.00';
    return value.toFixed(2);
  };

  // Print Receipt - Full A4 page with proper spacing
  const handlePrintReceipt = (entry: BillingEntry) => {
    // Create a hidden div for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 210mm;
      background: white;
      padding: 0;
      z-index: 9999;
    `;
    document.body.appendChild(printContainer);

    const amount = entry.finWt * entry.srp;

    // Build receipt HTML - Full A4 page
    printContainer.innerHTML = `
  <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:10mm 8mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
    <!-- Header Section -->
    <div>
      <!-- PDF Header -->
      <div style="width:100%;text-align:center;margin:0;padding:2px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
          <span style="font-size:11px;font-weight:bold;color:#a84b20;">॥ श्री गणेश प्रसन्न ॥</span>
          <span style="font-size:22px;font-weight:bold;color:#c43d5c;">  मातोश्री चेन फॅक्टरी, मिरज </span>
          <span style="font-size:11px;font-weight:bold;color:#a84b20;">॥ श्री साई प्रसन्न ॥</span>
        </div>
        <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#8b451f;line-height:1.3;">
          आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
        </div>
        <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#a84b20;line-height:1.3;">
          प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ७३८७२३५१८४
        </div>
        <div style="border-bottom:2px solid #c43d5c;margin:3px 0 5px 0;"></div>
      </div>

      <!-- Title -->
      <h2 style="text-align:center;margin:4px 0 8px 0;font-size:18px;color:#000;padding:0;font-weight:bold;letter-spacing:2px;">INVOICE</h2>

      <!-- Client Info and Receipt Info - Two Columns -->
      <!-- Client Info and Receipt Info -->
<div style="
  display:flex;
  justify-content:space-between;
  align-items:stretch;
  margin:6px 0 10px 0;
  gap:10px;
">

  <!-- Left - Client Details -->
  <div style="
    flex:1;
    border:1px solid #d6c08a;
    border-radius:8px;
    overflow:hidden;
    background:#fffdf7;
    box-shadow:0 1px 4px rgba(0,0,0,0.08);
  ">

    <!-- Header -->
    <div style="
      background:#785600;
      color:#fff;
      padding:7px 10px;
      font-size:10px;
      font-weight:bold;
      text-transform:uppercase;
      letter-spacing:0.8px;
    ">
      Client Details
    </div>

    <!-- Client Information -->
    <div style="
      padding:9px 11px;
      font-size:11px;
      line-height:1.8;
    ">

      <!-- Client Name -->
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding-bottom:5px;
        margin-bottom:5px;
        border-bottom:1px dashed #d9d9d9;
      ">
        <span style="
          color:#666;
          font-weight:bold;
        ">
          Name
        </span>

        <span style="
          color:#222;
          font-weight:bold;
          text-align:right;
        ">
          ${entry.clientName}
        </span>
      </div>

      <!-- Phone -->
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
      ">
        <span style="
          color:#666;
          font-weight:bold;
        ">
          Phone
        </span>

        <span style="
          color:#222;
          font-weight:500;
        ">
          ${entry.phoneNumber}
        </span>
      </div>

    </div>
  </div>


  <!-- Right - Receipt Details -->
  <div style="
    flex:1;
    border:1px solid #d6c08a;
    border-radius:8px;
    overflow:hidden;
    background:#fffdf7;
    box-shadow:0 1px 4px rgba(0,0,0,0.08);
  ">

    <!-- Header -->
    <div style="
      background:#785600;
      color:#fff;
      padding:7px 10px;
      font-size:10px;
      font-weight:bold;
      text-transform:uppercase;
      letter-spacing:0.8px;
    ">
      Receipt Details
    </div>

    <!-- Receipt Information -->
    <div style="
      padding:9px 11px;
      font-size:11px;
      line-height:1.8;
    ">

      <!-- Receipt No -->
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding-bottom:5px;
        margin-bottom:5px;
        border-bottom:1px dashed #d9d9d9;
      ">
        <span style="
          color:#666;
          font-weight:bold;
        ">
          Receipt No
        </span>

        <span style="
          color:#785600;
          font-weight:bold;
          font-size:12px;
        ">
          ${entry.billNo}
        </span>
      </div>

      <!-- Date -->
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding-bottom:5px;
        margin-bottom:5px;
        border-bottom:1px dashed #d9d9d9;
      ">
        <span style="
          color:#666;
          font-weight:bold;
        ">
          Date
        </span>

        <span style="
          color:#222;
          font-weight:500;
        ">
          ${entry.dateTime}
        </span>
      </div>

      <!-- Status -->
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
      ">
        <span style="
          color:#666;
          font-weight:bold;
        ">
          Status
        </span>

        <span style="
          display:inline-block;
          padding:3px 10px;
          border-radius:12px;
          font-size:9px;
          font-weight:bold;
          color:#fff;
          background:${entry.type === 'BILL' ? '#16a34a' : '#f59e0b'};
        ">
          ${entry.type}
        </span>
      </div>

    </div>
  </div>

</div>
      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin:6px 0;">
        <thead>
          <tr style="background:#785600;color:white;font-weight:600;">
            <th style="border:1px solid #785600;padding:5px 6px;text-align:center;font-size:10px;">Sr</th>
            <th style="border:1px solid #785600;padding:5px 6px;text-align:left;font-size:10px;">Item</th>
            <th style="border:1px solid #785600;padding:5px 6px;text-align:left;font-size:10px;">Size</th>
            <th style="border:1px solid #785600;padding:5px 6px;text-align:right;font-size:10px;">Fin Wt (G)</th>
            <th style="border:1px solid #785600;padding:5px 6px;text-align:right;font-size:10px;">Gross Wt (W)</th>
            <th style="border:1px solid #785600;padding:5px 6px;text-align:right;font-size:10px;">SRP (₹)</th>
            <th style="border:1px solid #785600;padding:5px 6px;text-align:right;font-size:10px;">Pending (G)</th>
            <th style="border:1px solid #785600;padding:5px 6px;text-align:right;font-size:10px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000;padding:5px 6px;text-align:center;">1</td>
            <td style="border:1px solid #000;padding:5px 6px;">${entry.item}</td>
            <td style="border:1px solid #000;padding:5px 6px;">${entry.size}</td>
            <td style="border:1px solid #000;padding:5px 6px;text-align:right;font-family:monospace;font-weight:500;">${formatNumberWith2Decimals(entry.finWt)}</td>
            <td style="border:1px solid #000;padding:5px 6px;text-align:right;font-family:monospace;font-weight:500;">${formatNumberWith2Decimals(entry.grossWeight)}</td>
            <td style="border:1px solid #000;padding:5px 6px;text-align:right;font-family:monospace;font-weight:500;">${formatNumberWith2Decimals(entry.srp)}</td>
            <td style="border:1px solid #000;padding:5px 6px;text-align:right;font-family:monospace;font-weight:500;">${formatNumberWith2Decimals(entry.pending)}</td>
            <td style="border:1px solid #000;padding:5px 6px;text-align:right;font-family:monospace;font-weight:bold;font-size:13px;">${formatNumberWith2Decimals(amount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Payment Summary -->
      


      <!-- Footer Section -->
      <div style="text-align:right;">
  Contact For Support 9511640551
</div>
  </div>
`;

    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A4 portrait;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          width: 210mm;
          height: 297mm;
        }
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
          width: 210mm !important;
          height: 297mm !important;
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: hidden !important;
          z-index: 9999 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-container > div {
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 10mm 8mm !important;
          box-sizing: border-box !important;
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
        #print-container tfoot tr {
          background: #f4f4f2 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Trigger print
    setTimeout(() => {
      window.print();

      // Clean up after print
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
  // Print Table Report - Full A4 portrait with totals
  const handlePrintTable = () => {
    if (!filteredEntries || filteredEntries.length === 0) {
      toast.error('No records available to print');
      return;
    }

    // Create a hidden div for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container-table';
    printContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
    padding: 0;
    z-index: 9999;
  `;
    document.body.appendChild(printContainer);

    // Build the table rows - Status column removed
    const rows = filteredEntries
      .map((entry, index) => {
        return `
        <tr>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:7px;color:#000;">${index + 1}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:6.5px;color:#000;white-space:nowrap;">${entry.dateTime}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:7px;color:#000;font-weight:bold;">${entry.billNo}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:7px;color:#000;">${entry.clientName}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:7px;color:#000;">${entry.phoneNumber}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:7px;color:#000;">${entry.item}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:7px;color:#000;">${entry.size}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:7px;color:#000;">${entry.purity}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:7px;color:#000;">${formatNumberWithDecimals(entry.finWt)}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:7px;color:#000;">${formatNumberWithDecimals(entry.srp)}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:7px;color:#000;">${formatNumberWithDecimals(entry.receive)}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:7px;color:#000;">${formatNumberWithDecimals(entry.pending)}</td>
        </tr>
      `;
      })
      .join('');

    // Set the content with Date at the top
   printContainer.innerHTML = `
  <div style="width:297mm;min-height:210mm;margin:0 auto;font-family:Arial,sans-serif;padding:8mm 6mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
    <!-- Header Section -->
    <div>
      <!-- PDF Header -->
      <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0;padding:0;font-size:10px;font-weight:bold;color:#a84b20;">
          <span>॥ श्री गणेश प्रसन्न ॥</span>
          <span style="font-size:16px;color:#c43d5c;">मातोश्री चेन फॅक्टरी, मिरज</span>
          <span>॥ श्री साई प्रसन्न ॥</span>
        </div>
        <div style="margin:1px 0 0 0;padding:0;font-size:9px;font-weight:bold;color:#8b451f;line-height:1.2;">
          आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
        </div>
        <div style="margin:1px 0 0 0;padding:0;font-size:9px;font-weight:bold;color:#a84b20;line-height:1.2;">
          प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ७३८७२३५१८४
        </div>
        <div style="border-bottom:2px solid #c43d5c;margin:2px 0 4px 0;"></div>
      </div>

      <!-- Title and Date Range -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 5px 0;padding:0;position:relative;">
        <div style="flex:1;"></div>
        <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
          Billing Report
        </h2>
        <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
          From: ${new Date(fromDate[0]).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
          &nbsp;&nbsp; To: ${new Date(toDate[0]).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </div>
      </div>

      <!-- Table - Full Width Landscape -->
      <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;">
        <thead>
          <tr style="background:#785600;color:white;font-weight:600;">
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Sr</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Date & Time</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Bill No</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Client</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Phone</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Item</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Size</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Purity %</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Fin Wt</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">SRP</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Receive</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:8px;">Pending</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      
      </table>
    </div>

   <div>   Contact For Support: 9511640551</div>
  </div>
`;

    // Add print styles
    // Add print styles for Landscape
const style = document.createElement('style');
style.textContent = `
  @page {
    size: A4 landscape;
    margin: 0;
  }
  @media print {
    html, body {
      margin: 0;
      padding: 0;
      width: 297mm;
      height: 210mm;
    }
    body * {
      visibility: hidden;
    }
    #print-container-table, #print-container-table * {
      visibility: visible;
    }
    #print-container-table {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 297mm !important;
      height: 210mm !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
      z-index: 9999 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #print-container-table > div {
      width: 297mm !important;
      min-height: 210mm !important;
      padding: 8mm 6mm !important;
      box-sizing: border-box !important;
    }
    #print-container-table table {
      width: 100% !important;
    }
    #print-container-table tr {
      page-break-inside: avoid !important;
    }
    #print-container-table thead tr {
      background: #785600 !important;
      color: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #print-container-table thead tr th {
      background: #785600 !important;
      color: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #print-container-table tfoot tr {
      background: #f4f4f2 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;
document.head.appendChild(style);
    document.head.appendChild(style);

    // Trigger print
    setTimeout(() => {
      window.print();

      // Clean up after print
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
  const handleRowClick = (entry: BillingEntry) => {
    navigate({ to: "/billiupdate/$id", params: { id: entry.id } });
  };

  const handleDelete = (entry: BillingEntry) => {
    if (window.confirm(`Are you sure you want to delete bill ${entry.billNo}?`)) {
      setBillingEntries(prev => prev.filter(e => e.id !== entry.id));
      toast.success(`Bill ${entry.billNo} deleted successfully`);
    }
  };

  const gettypeColor = (type: string) => {
    switch (type) {
      case 'BILL':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderActions = (item: BillingEntry, index: number) => (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); handlePrintReceipt(item); }}
        className="rounded-lg p-1.5 text-[#785600] hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20 transition-colors"
        title="Print Receipt"
      >
        <Printer className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
        className="rounded-lg p-1.5 text-[#785600] hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20 transition-colors"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const columns: Column<BillingEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">
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
        <span className="text-sm font-medium text-[#785600] dark:text-amber-400">
          {item.billNo}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client Name',
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
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.item}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.size}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.purity}
        </span>
      ),
    },
    {
      key: 'finWt',
      header: 'Fin Wt (g)',
      render: (item) => (
        <span className="text-sm font-mono font-bold text-black dark:text-amber-400">
          {formatNumberWithDecimals(item.finWt)}
        </span>
      ),
    },
    {
      key: 'srp',
      header: 'SRP (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumberWithDecimals(item.srp)}
        </span>
      ),
    },
    {
      key: 'receive',
      header: 'Receive (G)',
      render: (item) => (
        <span className="text-sm font-mono text-black dark:text-green-400">
          {formatNumberWithDecimals(item.receive)}
        </span>
      ),
    },
    {
      key: 'pending',
      header: 'Pending (G)',
      render: (item) => (
        <span className="text-sm font-mono text-black dark:text-red-400">
          {formatNumberWithDecimals(item.pending)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${gettypeColor(item.type)}`}>
          {item.type || "-"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-[#785600] border-t-transparent"></div>
          <p className="text-[#4f4535] dark:text-slate-400">Loading billing entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Header & Filters */}
        <div className="mb-4 space-y-3">
          {/* Row 1: Title and Add Bill button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PageHeader title='Billing' />
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

        {/* Summary Cards - Totals for Fin Wt, SRP, Receive, Pending */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Fin Wt Card */}
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-white dark:text-slate-400 uppercase tracking-wider">
                  Total Fin Wt
                </span>
                <span className="text-lg font-bold text-black">
                  {formatNumberWithDecimals(totalFinWt)} G
                </span>
              </div>
              <div className="rounded-full bg-[#785600] p-2 dark:bg-amber-900/30">
                <Scale className="h-4 w-4 text-white dark:text-amber-400" />
              </div>
            </div>
          </div>

          {/* Total SRP Card */}
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total SRP
                </span>
                <span className="text-lg font-bold text-black">
                  {formatNumberWithDecimals(totalSRP)}G
                </span>
              </div>
              <div className="rounded-full bg-[#785600] p-2 dark:bg-blue-900/30">
                <DollarSign className="h-4 w-4 text-white dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total Receive Card */}
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Receive
                </span>
                <span className="text-lg font-bold text-black">
                  {formatNumberWithDecimals(totalReceive)} G
                </span>
              </div>
              <div className="rounded-full bg-[#785600] p-2 dark:bg-green-900/30">
                <ArrowDownToLine className="h-4 w-4 text-white dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Pending Card */}
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-[#d3c4af]/20 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Pending
                </span>
                <span className="text-lg font-bold text-black">
                  {formatNumberWithDecimals(totalPending)} G
                </span>
              </div>
              <div className="rounded-full bg-[#785600] p-2 dark:bg-red-900/30">
                <Clock className="h-4 w-4 text-white dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Search and Date Filters with Print Button on Right */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
          <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search by client, phone, bill no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
          </div>

          {/* From Date - current week Monday */}
          <div className="flex items-center gap-2">
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
                  setDateRange(prev => ({
                    ...prev,
                    from: selected.toISOString().split('T')[0],
                  }));
                }
              }}
              className="w-28 sm:w-32"
            />
          </div>

          {/* To Date - current week Sunday */}
          <div className="flex items-center gap-2">
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
                  setDateRange(prev => ({
                    ...prev,
                    to: selected.toISOString().split('T')[0],
                  }));
                }
              }}
              className="w-28 sm:w-32"
            />
          </div>

          {/* Print Report Button */}
          <GenericButton
            onClick={() => {
              if (filteredEntries.length === 0) {
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

        {/* Generic Table with Row Click */}
        <GenericTable<BillingEntry>
          data={filteredEntries}
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