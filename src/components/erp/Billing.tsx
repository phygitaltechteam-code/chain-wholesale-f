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
  type: 'DRAFT' | 'BILL';
  createdAt: string;
}

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<BillingEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date[]>([]);
  const [toDate, setToDate] = useState<Date[]>([]);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });

  const { data: billData, isLoading: billLoading } = useGetBill();
  useEffect(() => {
    setDefaultDateRange();
  }, []);


  const setDefaultDateRange = () => {
    const now = new Date();

    const dayOfWeek = now.getDay();

    const diffToMonday =
      dayOfWeek === 0
        ? 6
        : dayOfWeek - 1;

    const monday = new Date(now);

    monday.setDate(
      now.getDate() - diffToMonday
    );

    const sunday = new Date(monday);

    sunday.setDate(
      monday.getDate() + 6
    );

    setDateRange({
      from: monday.toISOString().split('T')[0],
      to: sunday.toISOString().split('T')[0],
    });
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

  // Print Receipt - Full A4 page with proper spacing
  const handlePrintReceipt = (entry: BillingEntry) => {
    // Create a hidden div for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 100%;
      background: white;
      padding: 8px;
      z-index: 9999;
    `;
    document.body.appendChild(printContainer);

    // Build receipt HTML - Full A4 page
    printContainer.innerHTML = `
      <div style="max-width:210mm;margin:0 auto;font-family:Arial,sans-serif;padding:12px;min-height:297mm;display:flex;flex-direction:column;justify-content:space-between;">
        <!-- Header Section -->
        <div>
          <!-- PDF Header -->
          <div style="width:100%;text-align:center;margin:0;padding:4px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin:0;padding:0;font-size:12px;font-weight:bold;color:#a84b20;">
              <span>॥ श्री गणेश प्रसन्न ॥</span>
              <span>॥ श्री साई प्रसन्न ॥</span>
            </div>
            <div style="margin:2px 0 0 0;padding:0;font-size:24px;font-weight:bold;color:#c43d5c;line-height:1.2;">
              मातोश्री चेन फॅक्टरी
            </div>
            <div style="margin:2px 0 0 0;padding:0;font-size:11px;font-weight:bold;color:#8b451f;line-height:1.3;">
              आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
            </div>
            <div style="margin:2px 0 0 0;padding:0;font-size:11px;font-weight:bold;color:#a84b20;line-height:1.3;">
              प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ९३०९३५५१३६
            </div>
            <div style="border-bottom:2px solid #c43d5c;margin:4px 0 6px 0;"></div>
          </div>

          <!-- Title -->
          <h2 style="text-align:center;margin:6px 0 10px 0;font-size:20px;color:#000;padding:0;font-weight:bold;letter-spacing:2px;">TAX INVOICE</h2>

          <!-- Client Info and Receipt Info - Two Columns -->
          <div style="display:flex;justify-content:space-between;align-items:stretch;margin:8px 0 12px 0;gap:12px;">
            <!-- Left - Client Info -->
            <div style="border:1px solid #333;padding:10px 12px;flex:1;border-radius:4px;">
              <h4 style="font-size:11px;font-weight:bold;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px 0;border-bottom:1px solid #ddd;padding-bottom:4px;">Client Details</h4>
              <div style="font-size:13px;line-height:1.8;">
                <div><strong>Name:</strong> ${entry.clientName}</div>
                <div><strong>Phone:</strong> ${entry.phoneNumber}</div>
              </div>
            </div>

            <!-- Right - Receipt Info -->
            <div style="border:1px solid #333;padding:10px 12px;flex:1;border-radius:4px;">
              <h4 style="font-size:11px;font-weight:bold;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px 0;border-bottom:1px solid #ddd;padding-bottom:4px;">Receipt Details</h4>
              <div style="font-size:13px;line-height:1.8;">
                <div><strong>Receipt No:</strong> <span style="color:#785600;font-weight:bold;">${entry.billNo}</span></div>
                <div><strong>Date:</strong> ${entry.dateTime}</div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0;">
            <thead>
              <tr style="background:#785600;color:white;font-weight:600;">
                <th style="border:1px solid #785600;padding:6px 8px;text-align:center;font-size:11px;">Sr</th>
                <th style="border:1px solid #785600;padding:6px 8px;text-align:left;font-size:11px;">Item</th>
                <th style="border:1px solid #785600;padding:6px 8px;text-align:left;font-size:11px;">Size</th>
                <th style="border:1px solid #785600;padding:6px 8px;text-align:right;font-size:11px;">Fin Wt (G)</th>
                <th style="border:1px solid #785600;padding:6px 8px;text-align:right;font-size:11px;">SRP (G)</th>
                <th style="border:1px solid #785600;padding:6px 8px;text-align:right;font-size:11px;">Amount (G)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #000;padding:6px 8px;text-align:center;">1</td>
                <td style="border:1px solid #000;padding:6px 8px;">${entry.item}</td>
                <td style="border:1px solid #000;padding:6px 8px;">${entry.size}</td>
                <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;font-weight:500;">${formatNumberWithDecimals(entry.finWt)}</td>
                <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;font-weight:500;">${formatNumberWithDecimals(entry.srp)}</td>
                <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;font-weight:bold;font-size:14px;">${formatNumberWithDecimals(entry.finWt * entry.srp)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background:#f4f4f2;font-weight:bold;">
                <td colspan="5" style="border:1px solid #000;padding:6px 8px;text-align:right;font-size:14px;">Total Amount</td>
                <td style="border:1px solid #000;padding:6px 8px;text-align:right;font-family:monospace;font-size:14px;color:#785600;">${formatNumberWithDecimals(entry.finWt * entry.srp)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Footer Section - Pushed to bottom -->
        <div>
          <div style="margin-top:12px;padding-top:8px;border-top:2px solid #785600;text-align:center;">
            <p style="font-size:11px;color:#555;margin:2px 0;">This is a system-generated receipt</p>
            <div style="display:flex;justify-content:center;gap:12px;font-size:10px;color:#888;margin-top:2px;">
              <span>Powered by Matoshree Gold</span>
              <span>|</span>
              <span>Generated: ${new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A4 portrait;
        margin: 5mm;
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
          padding: 8px !important;
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

  // Print Table Report - Full A4 landscape
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
      width: 100%;
      background: white;
      padding: 4px;
      z-index: 9999;
    `;
    document.body.appendChild(printContainer);

    // Build the table rows
    const rows = filteredEntries
      .map((entry, index) => {
        return `
          <tr>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;">${index + 1}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:9px;color:#000;white-space:nowrap;">${entry.dateTime}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;font-weight:bold;">${entry.billNo}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;">${entry.clientName}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;">${entry.phoneNumber}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;">${entry.item}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;">${entry.size}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;">${entry.purity}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberWithDecimals(entry.finWt)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberWithDecimals(entry.srp)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberWithDecimals(entry.receive)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberWithDecimals(entry.pending)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:9px;color:#000;">
              <span style="background:${entry.type === 'BILL' ? '#22c55e' : '#f59e0b'};color:white;padding:1px 4px;border-radius:3px;font-size:8px;font-weight:bold;">
                ${entry.type}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    // Set the content with PDF Header
    printContainer.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;font-family:Arial,sans-serif;padding:0;">
        <!-- PDF Header -->
        <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin:0;padding:0;font-size:11px;font-weight:bold;color:#a84b20;">
            <span>॥ श्री गणेश प्रसन्न ॥</span>
            <span>॥ श्री साई प्रसन्न ॥</span>
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:20px;font-weight:bold;color:#c43d5c;line-height:1.1;">
            मातोश्री चेन फॅक्टरी
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#8b451f;line-height:1.2;">
            आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:10px;font-weight:bold;color:#a84b20;line-height:1.2;">
            प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ९३०९३५५१३६
          </div>
          <div style="border-bottom:2px solid #c43d5c;margin:2px 0 3px 0;"></div>
        </div>

        <!-- Title -->
        <h2 style="text-align:center;margin:2px 0 2px 0;font-size:16px;color:#000;padding:0;">Billing Report</h2>
        ${fromDate.length > 0 && toDate.length > 0 ? `
          <p style="text-align:center;font-size:10px;color:#000;margin:0 0 2px 0;">
            Date Range: ${new Date(fromDate[0]).toLocaleDateString()} to ${new Date(toDate[0]).toLocaleDateString()}
          </p>
        ` : ''}

        <!-- Table -->
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Sr</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Date & Time</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Bill No</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Client</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Phone</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Item</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Size</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Purity %</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Fin Wt</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">SRP</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Receive</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Pending</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:9px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background:#f4f4f2;font-weight:bold;">
              <td colspan="8" style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;">Total</td>
              <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberWithDecimals(totalFinWt)}</td>
              <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberWithDecimals(totalSRP)}</td>
              <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberWithDecimals(totalReceive)}</td>
              <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberWithDecimals(totalPending)}</td>
              <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;">${filteredEntries.length}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Footer -->
        <div style="margin-top:4px;padding-top:4px;border-top:2px solid #785600;text-align:center;">
          <p style="font-size:10px;color:#000;margin:1px 0;">This is a system-generated report</p>
          <div style="display:flex;justify-content:center;gap:10px;font-size:9px;color:#000;margin-top:1px;">
            <span>Powered by Matoshree Gold</span>
            <span>|</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;

    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A4 landscape;
        margin: 3mm;
      }
      @media print {
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
          width: 100% !important;
          height: 100% !important;
          background: white !important;
          padding: 4px !important;
          overflow: auto !important;
          z-index: 9999 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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

  const handleRowClick = (entry: BillingEntry) => {
    navigate({ to: "/billiupdate/$id", params: { id: entry.id } });
  };

  const handleDelete = (entry: BillingEntry) => {
    if (window.confirm(`Are you sure you want to delete bill ${entry.billNo}?`)) {
      setBillingEntries(prev => prev.filter(e => e.id !== entry.id));
      toast.success(`Bill ${entry.billNo} deleted successfully`);
    }
  };



  // Format number with 3 decimals only if needed
  const formatNumberWithDecimals = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
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
                <span className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
                  Total Fin Wt
                </span>
                <span className="text-lg font-bold text-black">
                  {formatNumberWithDecimals(totalFinWt)} G
                </span>
              </div>
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                <ArrowDownToLine className="h-4 w-4 text-green-600 dark:text-green-400" />
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
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
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

          {/* From Date - Default to Monday */}
          <div className="flex items-center gap-2">
            <GenericDatePicker
              id="from-date"
              placeholder="From Date"
              dateFormat="d/m/Y"
              onDateChange={(dates) => setFromDate(dates)}
              className="w-28 sm:w-32"
              defaultWeek={true}  // This sets it to Monday
            />
          </div>

          {/* To Date - Set to Sunday */}
          <div className="flex items-center gap-2">
            <GenericDatePicker
              id="to-date"
              placeholder="To Date"
              dateFormat="d/m/Y"
              onDateChange={(dates) => setToDate(dates)}
              className="w-28 sm:w-32"
              initialDate={(() => {
                const today = new Date();
                const dayOfWeek = today.getDay();
                const monday = new Date(today);
                const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                monday.setDate(today.getDate() - daysToMonday);
                monday.setHours(0, 0, 0, 0);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);
                return sunday;
              })()}
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

          {(fromDate.length > 0 || toDate.length > 0 || searchTerm) && (
            <button
              onClick={() => {
                setFromDate([]);
                setToDate([]);
                setSearchTerm('');
              }}
              className="flex items-center gap-1 text-sm text-[#785600] hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300 font-medium whitespace-nowrap"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
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