import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Calendar,
  User,
  Phone,
  Plus,
  Minus,
  CheckCircle,
  X,
  ArrowRight,
  Wallet,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MapPin,
  Printer,
} from 'lucide-react';

import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';

import toast from 'react-hot-toast';

import { useSubmitSettlement } from '@/lib/api/settlement';

import { Client, useGetClients } from '@/lib/api/client';
import { useGetHeader } from '@/lib/api/headerapi';

import GenericInputField from '../Forms/Input/GenericInputField';
import GenericButton from '../Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '../Forms/DatePicker/GenericWeeklyDatePicker';
import { useScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useNavigate } from '@tanstack/react-router';
import AddClientModal from '../Client/AddClientModal';
import { printClientReceipt } from '@/utils/printClientReceipt';

// ======================================================
// TYPES
// ======================================================

interface SettlementEntry {
  id: string;
  srNo: number;
  clientName: string;
  phoneNumber: string;
  goldBalance: number;
  totalBill: number;
  status: 'pending' | 'settled' | 'partial';
  clientId: string;
  openingBalance?: number;
  due?: number | null;
  address?: string;
  totalBills?: number;
  amount: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  bills?: Array<any>;
  receipts?: Array<any>;
}

interface SettlementDetail {
  clientName: string;
  phoneNumber: string;
  address: string;
  pendingBalance: number;
  totalBills: number;
  settlementAmount: number;
  settlementType: 'receive' | 'give';
  date: string;
  clientId: string;
  openingBalance?: number;
  due?: number | null;
}

// ======================================================
// HELPER: Robust Date Parser
// ======================================================
const parseDateSafely = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return Number.isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;

    // Check if it's DD/MM/YYYY or DD-MM-YYYY (e.g. 18/08/2026 or 18-08-2026)
    const ddmmyyyyMatch = trimmed.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/,
    );
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const rest = ddmmyyyyMatch[4].trim();

      if (rest) {
        const timeMatch = rest.match(
          /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i,
        );
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
          const ampm = timeMatch[4] ? timeMatch[4].toLowerCase() : null;
          if (ampm === 'pm' && hours < 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          const d = new Date(year, month, day, hours, minutes, seconds);
          if (!Number.isNaN(d.getTime())) return d;
        }
      }
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) return d;
    }

    // Try standard ISO or string date constructor
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

// ======================================================
// COMPONENT
// ======================================================
const Settlement: React.FC = () => {
  const navigate = useNavigate();
  const getpdfheaderdata = useGetHeader();
  // ----------------------------------------------------
  // TABLE STATES
  // ----------------------------------------------------

  const [settlements, setSettlements] = useState<SettlementEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');

  // Helper function to get week start (Monday 00:00) and end (Sunday 23:59:59)
  const getDefaultWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const { monday, sunday } = getDefaultWeekRange();
    return [monday, sunday];
  });

  // ----------------------------------------------------
  // MODAL STATES
  // ----------------------------------------------------

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // ----------------------------------------------------
  // AMOUNT STATE
  // ----------------------------------------------------

  const [localAmount, setLocalAmount] = useState<string>('');

  // ----------------------------------------------------
  // SETTLEMENT DETAIL
  // ----------------------------------------------------

  const [settlementDetail, setSettlementDetail] = useState<SettlementDetail>({
    clientName: '',
    phoneNumber: '',
    address: '',
    pendingBalance: 0,
    totalBills: 0,
    settlementAmount: 0,
    settlementType: 'receive',
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    openingBalance: 0,
    due: null,
  });

  // ----------------------------------------------------
  // INPUT REF & SCALE FOCUS
  // ----------------------------------------------------

  const inputRef = useRef<HTMLInputElement>(null);

  const scaleFocus = useScaleFocus((weight) => {
    const val = weight.toString();
    setLocalAmount(val);
    setSettlementDetail((prev) => ({
      ...prev,
      settlementAmount: weight,
    }));
  });

  // ======================================================
  // AUTO FOCUS WHEN SETTLEMENT MODAL OPENS
  // ======================================================

  useEffect(() => {
    if (!showSettleModal) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 150);

    return () => clearTimeout(timer);
  }, [showSettleModal]);

  // ======================================================
  // API
  // ======================================================

  const {
    data: settlementsData,
    isLoading: isSettlementsLoading,
    refetch: refetchSettlements,
  } = useGetClients();

  const submitSettlementMutation = useSubmitSettlement();

  // ======================================================
  // PROCESS API DATA
  // ======================================================

  useEffect(() => {
    if (settlementsData && Array.isArray(settlementsData)) {
      const apiData: SettlementEntry[] = settlementsData.map(
        (item: any, index: number) => ({
          id: item.id || `settlement-${index}`,
          srNo: index + 1,
          clientName:
            item.fullName ||
            item.clientName ||
            item.client?.name ||
            'Unknown Client',
          phoneNumber: item.phoneNumber || item.client?.phone || 'N/A',
          goldBalance: Number(
            item.openingBalance ?? item.balance ?? item.goldBalance ?? 0,
          ),
          totalBill: Number(
            item.totalBills ?? item.totalBill ?? item.totalGiven ?? 0,
          ),
          status: item.status || 'pending',
          clientId: item.id || item.clientId || item.client?.id || '',
          openingBalance: Number(item.openingBalance ?? 0),
          due: item.due ?? null,
          address: item.address || '',
          totalBills: Number(item.totalBills ?? item._count?.receipts ?? 0),
          amount: Number(item.openingBalance ?? 0),
          remark: Number(item.openingBalance ?? 0) > 0 ? 'Received' : 'Given',
          createdAt:
            item.createdAt ||
            item.updatedAt ||
            item.date ||
            item.dateTime ||
            item.created_at ||
            item.updated_at ||
            item.client?.createdAt ||
            '',
          updatedAt: item.updatedAt || item.updated_at || '',
          bills: item.bills || item.receipts || [],
          receipts: item.receipts || item.bills || [],
        }),
      );

      setSettlements(apiData);
    } else if (settlementsData && !settlementsData?.status) {
      toast.error(
        settlementsData?.message || 'Failed to fetch settlement data',
      );
      setSettlements([]);
    }
  }, [settlementsData]);

  // ======================================================
  // NUMBER FORMAT
  // ======================================================

  const formatNumber = (value: number | string | null | undefined) => {
    const numberValue = Number(value ?? 0);
    if (Number.isNaN(numberValue)) {
      return '0';
    }
    return parseFloat(numberValue.toFixed(3)).toString();
  };

  // ======================================================
  // BALANCE COLOR
  // ======================================================

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // ======================================================
  // BALANCE ICON
  // ======================================================

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <Plus className="h-3 w-3" />;
    if (balance < 0) return <Minus className="h-3 w-3" />;
    return null;
  };

  // ======================================================
  // STATUS BADGE
  // ======================================================

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Settled
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="h-3 w-3" />
            Partial
          </span>
        );
      default:
        return null;
    }
  };

  // ======================================================
  // PRINT TABLE REPORT
  // ======================================================
  const handlePrintTable = () => {
    if (!filteredSettlements || filteredSettlements.length === 0) {
      toast.error('No records available to print');
      return;
    }

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container-settlement';
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

    const formatDateForDisplay = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const rows = filteredSettlements
      .map((entry, index) => {
        return `
          <tr>
            <td style="border:1px solid #000;padding:3px 5px;text-align:center;font-size:8px;color:#000;">${index + 1}</td>
            <td style="border:1px solid #000;padding:3px 5px;text-align:left;font-size:8px;color:#000;">${entry.clientName}</td>
            <td style="border:1px solid #000;padding:3px 5px;text-align:center;font-size:8px;color:#000;">${entry.phoneNumber}</td>
            <td style="border:1px solid #000;padding:3px 5px;text-align:right;font-family:monospace;font-size:8px;color:#000;font-weight:bold;">${formatNumber(Math.abs(entry.goldBalance))}</td>
            <td style="border:1px solid #000;padding:3px 5px;text-align:center;font-size:8px;color:#000;">${entry.totalBills || 0}</td>
          </tr>
        `;
      })
      .join('');

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

    printContainer.innerHTML = `
      <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
              <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
              <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
              <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
            </div>
            <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">
              ${description}
            </div>
            <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
              ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
            </div>
            <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;"></div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
            <div style="flex:1;"></div>
            <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
              Settlement Report
            </h2>
            ${dateRange && dateRange[0] && dateRange[1]
        ? `
            <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
              From: ${formatDateForDisplay(dateRange[0])} 
              &nbsp;&nbsp; To: ${formatDateForDisplay(dateRange[1])}
            </div>
            `
        : `<div style="flex:1;"></div>`
      }
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;">
            <thead>
              <tr style="background:#785600;color:white;font-weight:600;">
                <th style="border:1px solid #785600;padding:4px 5px;text-align:center;font-size:7.5px;">Sr</th>
                <th style="border:1px solid #785600;padding:4px 5px;text-align:left;font-size:7.5px;">Client Name</th>
                <th style="border:1px solid #785600;padding:4px 5px;text-align:center;font-size:7.5px;">Phone</th>
                <th style="border:1px solid #785600;padding:4px 5px;text-align:right;font-size:7.5px;">Due Balance (g)</th>
                <th style="border:1px solid #785600;padding:4px 5px;text-align:center;font-size:7.5px;">Total Bills</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;

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
        #print-container-settlement, #print-container-settlement * {
          visibility: visible;
        }
        #print-container-settlement {
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
        #print-container-settlement > div {
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 6mm 5mm !important;
          box-sizing: border-box !important;
        }
        #print-container-settlement table {
          width: 100% !important;
        }
        #print-container-settlement tr {
          page-break-inside: avoid !important;
        }
        #print-container-settlement thead tr {
          background: #785600 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-container-settlement thead tr th {
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
  // ======================================================
  // HANDLE DATE CHANGES - FIXED CLEAR
  // ======================================================

  const handleFromDateChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const selected = new Date(dates[0]);
      selected.setHours(0, 0, 0, 0);

      setDateRange((prev) => ({
        ...prev,
        from: selected.toISOString().split('T')[0],
      }));
    } else {
      // Clear - set to empty string
      setDateRange((prev) => ({
        ...prev,
        from: '',
      }));
    }
  };

  const handleToDateChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const selected = new Date(dates[0]);
      selected.setHours(23, 59, 59, 999);

      setDateRange((prev) => ({
        ...prev,
        to: selected.toISOString().split('T')[0],
      }));
    } else {
      // Clear - set to empty string
      setDateRange((prev) => ({
        ...prev,
        to: '',
      }));
    }
  };
  // ======================================================
  // OPEN SETTLEMENT MODAL
  // ======================================================

  const handleSettle = (entry: SettlementEntry) => {
    const balance = Number(entry.goldBalance || 0);

    setSettlementDetail({
      clientName: entry.clientName,
      phoneNumber: entry.phoneNumber,
      address: entry.address || '',
      pendingBalance: balance,
      totalBills: entry.totalBills || 0,
      settlementAmount: 0,
      settlementType: 'receive',
      date: new Date().toISOString().split('T')[0],
      clientId: entry.clientId,
      openingBalance: entry.openingBalance || 0,
      due: entry.due || null,
    });

    setLocalAmount('');
    setShowSettleModal(true);
  };

  // ======================================================
  // CLOSE SETTLEMENT MODAL
  // ======================================================

  const closeSettlementModal = () => {
    setShowSettleModal(false);
    setLocalAmount('');
    setSettlementDetail({
      clientName: '',
      phoneNumber: '',
      address: '',
      pendingBalance: 0,
      totalBills: 0,
      settlementAmount: 0,
      settlementType: 'receive',
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      openingBalance: 0,
      due: null,
    });
  };

  // ======================================================
  // PROCEED TO CONFIRM
  // ======================================================

  const handleProceedToConfirm = () => {
    const amount = Number(settlementDetail.settlementAmount);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }

    if (!settlementDetail.clientId) {
      toast.error('Client ID is missing');
      return;
    }

    setShowConfirmModal(true);
  };

  // ======================================================
  // SAVE SETTLEMENT
  // ======================================================

  const handleSaveSettlement = async () => {
    try {
      const amount = Number(settlementDetail.settlementAmount);

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (!settlementDetail.clientId) {
        toast.error('Client ID is missing');
        return;
      }

      const signedAmount =
        settlementDetail.settlementType === 'receive' ? -amount : amount;

      const settlementData = {
        clientId: settlementDetail.clientId,
        amount: signedAmount,
        type: settlementDetail.settlementType,
        pendingBalance: settlementDetail.pendingBalance,
      };

      const isGive = settlementDetail.settlementType === 'give';
      const receiptDataToPrint = isGive
        ? {
            clientName: settlementDetail.clientName,
            phoneNumber: settlementDetail.phoneNumber,
            address: settlementDetail.address,
            transactionType: 'give' as const,
            amount: settlementDetail.settlementAmount,
            previousBalance: settlementDetail.pendingBalance,
            newBalance:
              settlementDetail.pendingBalance + settlementDetail.settlementAmount,
            remark: settlementDetail.remark || 'Settlement (Given)',
            dateTime: new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
          }
        : null;

      await submitSettlementMutation.mutateAsync(settlementData);

      if (isGive && receiptDataToPrint) {
        printClientReceipt(receiptDataToPrint, getpdfheaderdata);
      }

      setShowConfirmModal(false);
      setShowSettleModal(false);
      setLocalAmount('');

      setSettlementDetail({
        clientName: '',
        phoneNumber: '',
        address: '',
        pendingBalance: 0,
        totalBills: 0,
        settlementAmount: 0,
        settlementType: 'receive',
        date: new Date().toISOString().split('T')[0],
        clientId: '',
        openingBalance: 0,
        due: null,
      });

      await refetchSettlements();
      // toast.success('Settlement saved successfully');
    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to save settlement');
    }
  };

  // ======================================================
  // FILTER
  // ======================================================

  const filteredSettlements = settlements.filter((entry) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      entry.clientName.toLowerCase().includes(search) ||
      entry.phoneNumber.includes(search);

    const matchesBalance =
      balanceFilter === 'all' ||
      (balanceFilter === 'positive' && entry.goldBalance > 0) ||
      (balanceFilter === 'negative' && entry.goldBalance < 0) ||
      (balanceFilter === 'zero' && entry.goldBalance === 0);

    let matchesDate = true;
    if (dateRange && dateRange.length > 0) {
      const fromDate = dateRange[0] ? parseDateSafely(dateRange[0]) : null;
      const toDate = dateRange[1] ? parseDateSafely(dateRange[1]) : null;

      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(23, 59, 59, 999);

      if (fromDate || toDate) {
        const allBills = [...(entry.bills || []), ...(entry.receipts || [])];

        if (allBills.length > 0) {
          // Check if ANY bill was created in the selected date range
          const hasMatchingBill = allBills.some((bill: any) => {
            const billDateStr =
              bill?.createdAt ||
              bill?.created_at ||
              bill?.date ||
              bill?.dateTime ||
              bill?.updatedAt;
            const billDate = parseDateSafely(billDateStr);
            if (!billDate) return false;

            if (fromDate && billDate.getTime() < fromDate.getTime())
              return false;
            if (toDate && billDate.getTime() > toDate.getTime()) return false;
            return true;
          });

          matchesDate = hasMatchingBill;
        } else {
          // Fallback to client record date if no bills array is available
          const entryDate = parseDateSafely(entry.createdAt || entry.updatedAt);
          if (entryDate) {
            if (fromDate && entryDate.getTime() < fromDate.getTime()) {
              matchesDate = false;
            }
            if (toDate && entryDate.getTime() > toDate.getTime()) {
              matchesDate = false;
            }
          }
        }
      }
    }

    return matchesSearch && matchesBalance && matchesDate;
  });

  // ======================================================
  // TOTALS
  // ======================================================

  const totalPositiveBalance = filteredSettlements.reduce(
    (sum, item) => (item.goldBalance > 0 ? sum + item.goldBalance : sum),
    0,
  );

  const totalNegativeBalance = filteredSettlements.reduce(
    (sum, item) =>
      item.goldBalance < 0 ? sum + Math.abs(item.goldBalance) : sum,
    0,
  );

  const totalPending = filteredSettlements.filter(
    (item) => item.status !== 'settled',
  ).length;
  const totalSettled = filteredSettlements.filter(
    (item) => item.status === 'settled',
  ).length;

  const handleRowClick = (client: Client) => {
    const targetId = client?.id || (client as any)?._id;
    if (targetId) {
      navigate({ to: '/client/clientreport/$id', params: { id: targetId } });
    }
  };

  // ======================================================
  // ACTION BUTTON
  // ======================================================

  const renderActions = (item: SettlementEntry) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleSettle(item);
      }}
      className="flex items-center gap-1 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#5d4200]"
    >
      <CheckCircle className="h-3 w-3" />
      Settle
    </button>
  );

  // ======================================================
  // TABLE COLUMNS
  // ======================================================

  const columns: Column<SettlementEntry>[] = [
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
      key: 'address',
      header: 'Address',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.address}
        </span>
      ),
    },
    {
      key: 'goldBalance',
      header: 'Due Balance(G)',
      render: (item) => (
        <div className="text-black dark:text-white">
          {formatNumber(item.goldBalance)} G
        </div>
      ),
    },
    {
      key: 'totalBills',
      header: 'Total Bills',
      render: (item) => (
        <span className="font-mono text-sm text-black dark:text-white">
          {item.totalBills || 0}
        </span>
      ),
    },
  ];

  // ======================================================
  // SETTLEMENT MODAL
  // ======================================================

  const renderSettlementModal = () => {
    if (!showSettleModal) return null;

    const remainingBalance =
      settlementDetail.settlementType === 'receive'
        ? settlementDetail.pendingBalance - settlementDetail.settlementAmount
        : settlementDetail.pendingBalance + settlementDetail.settlementAmount;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            closeSettlementModal();
          }
        }}
      >
        <div
          className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-slate-900"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-5 py-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#785600]" />
              <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                Settlement
              </h2>
            </div>
            <button
              type="button"
              onClick={closeSettlementModal}
              className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg p-1.5 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5">
            {/* CLIENT INFORMATION */}
            <div className="mb-4 space-y-2 border-b border-[#d3c4af]/20 pb-4 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#785600]" />
                <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
                  {settlementDetail.clientName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#785600]" />
                <span className="text-sm text-[#1a1c1b] dark:text-white">
                  {settlementDetail.phoneNumber}
                </span>
              </div>
              {settlementDetail.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#785600]" />
                  <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {settlementDetail.address}
                  </span>
                </div>
              )}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400">
                    Due Balance
                  </p>
                  <p className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                    {formatNumber(settlementDetail.pendingBalance)} g
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400">
                    Total Bills
                  </p>
                  <p className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                    {settlementDetail.totalBills}
                  </p>
                </div>
              </div>
            </div>

            {/* RECEIVE / GIVE */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSettlementDetail((prev) => ({
                    ...prev,
                    settlementType: 'receive',
                  }));
                  setTimeout(() => {
                    inputRef.current?.focus();
                    inputRef.current?.select();
                  }, 50);
                }}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${settlementDetail.settlementType === 'receive'
                    ? 'border-[#785600] bg-[#785600] text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
              >
                <Minus className="h-4 w-4" />
                Receive
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettlementDetail((prev) => ({
                    ...prev,
                    settlementType: 'give',
                  }));
                  setTimeout(() => {
                    inputRef.current?.focus();
                    inputRef.current?.select();
                  }, 50);
                }}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${settlementDetail.settlementType === 'give'
                    ? 'border-[#785600] bg-[#785600] text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
              >
                <Plus className="h-4 w-4" />
                Give
              </button>
            </div>

            {/* AMOUNT INPUT */}
            <div className="mb-3">
              <GenericInputField
                ref={inputRef}
                name="settlementAmount"
                type="text"
                inputMode="decimal"
                label="Amount (g)"
                value={localAmount}
                onFocus={() => {
                  scaleFocus.onFocus();
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!/^\d*\.?\d{0,3}$/.test(value)) {
                    return;
                  }
                  setLocalAmount(value);
                  if (value === '') {
                    setSettlementDetail((prev) => ({
                      ...prev,
                      settlementAmount: 0,
                    }));
                    return;
                  }
                  const numberValue = Number(value);
                  if (!Number.isNaN(numberValue)) {
                    setSettlementDetail((prev) => ({
                      ...prev,
                      settlementAmount: numberValue,
                    }));
                  }
                }}
                onBlur={() => {
                  scaleFocus.onBlur();
                  const amount = Number(localAmount);
                  if (localAmount === '' || Number.isNaN(amount)) {
                    setLocalAmount('');
                    setSettlementDetail((prev) => ({
                      ...prev,
                      settlementAmount: 0,
                    }));
                    return;
                  }
                  const finalAmount = Number(Math.max(amount, 0).toFixed(3));
                  setSettlementDetail((prev) => ({
                    ...prev,
                    settlementAmount: finalAmount,
                  }));
                  setLocalAmount(
                    finalAmount > 0
                      ? parseFloat(finalAmount.toFixed(3)).toString()
                      : '',
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleProceedToConfirm();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    closeSettlementModal();
                  }
                }}
                placeholder="Enter amount (g)"
                suffix="G"
              />
            </div>

            {/* REMAINING / NEW BALANCE */}
            {settlementDetail.settlementAmount > 0 && (
              <div className="mb-4 rounded-lg border border-[#d3c4af]/20 bg-[#f9f9f7] px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#4f4535] dark:text-slate-400">
                    New Due Balance:
                  </span>
                  <span className="text-sm font-bold text-[#785600] dark:text-amber-400">
                    {formatNumber(remainingBalance)} g
                  </span>
                </div>
                {/* <div className="mt-1 flex items-center justify-between text-[11px] text-[#817563] dark:text-slate-400">
                  <span>Calculation:</span>
                  <span className="font-mono">
                    {formatNumber(settlementDetail.pendingBalance)} g{' '}
                    {settlementDetail.settlementType === 'receive' ? '-' : '+'}{' '}
                    {formatNumber(settlementDetail.settlementAmount)} g ={' '}
                    {formatNumber(remainingBalance)} g
                  </span>
                </div> */}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <button
              type="button"
              onClick={handleProceedToConfirm}
              disabled={
                submitSettlementMutation.isPending ||
                settlementDetail.settlementAmount <= 0
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#785600] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
              Proceed to Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ======================================================
  // CONFIRMATION MODAL
  // ======================================================

  const renderConfirmModal = () => {
    if (!showConfirmModal) return null;

    const newBalance =
      settlementDetail.settlementType === 'receive'
        ? settlementDetail.pendingBalance - settlementDetail.settlementAmount
        : settlementDetail.pendingBalance + settlementDetail.settlementAmount;

    const signedAmount =
      settlementDetail.settlementType === 'receive'
        ? `-${formatNumber(settlementDetail.settlementAmount)}`
        : `+${formatNumber(settlementDetail.settlementAmount)}`;

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setShowConfirmModal(false);
          }
        }}
      >
        <div
          className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-slate-900"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowConfirmModal(false)}
            className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 absolute right-3 top-3 rounded-lg p-1.5 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#785600]/10">
                <CheckCircle className="h-6 w-6 text-[#785600]" />
              </div>
              <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Settlement
              </h2>
              <p className="text-sm text-[#4f4535] dark:text-slate-400">
                Please review the details below
              </p>
            </div>

            <div className="mb-5 space-y-2.5 rounded-lg border border-[#d3c4af]/20 bg-[#f9f9f7] p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex justify-between text-sm">
                <span className="text-[#4f4535] dark:text-slate-400">
                  Client:
                </span>
                <span className="font-medium text-[#1a1c1b] dark:text-white">
                  {settlementDetail.clientName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#4f4535] dark:text-slate-400">
                  Current Due:
                </span>
                <span className="font-medium text-[#1a1c1b] dark:text-white">
                  {formatNumber(settlementDetail.pendingBalance)} g
                </span>
              </div>
              {/* <div className="flex justify-between text-sm">
                <span className="text-[#4f4535] dark:text-slate-400">
                  Action:
                </span>
                <span
                  className={`font-semibold ${
                    settlementDetail.settlementType === 'receive'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {settlementDetail.settlementType === 'receive'
                    ? `Receive (-${formatNumber(settlementDetail.settlementAmount)} g)`
                    : `Give (+${formatNumber(settlementDetail.settlementAmount)} g)`}
                </span>
              </div> */}
              <div className="flex justify-between border-t border-[#d3c4af]/20 pt-2 text-sm dark:border-slate-700">
                <span className="font-semibold text-[#4f4535] dark:text-slate-300">
                  New Due Balance:
                </span>
                <span className="font-bold text-[#785600] dark:text-amber-400">
                  {formatNumber(newBalance)} g
                </span>
              </div>
            </div>

            <div className="flex">
              <button
                type="button"
                onClick={handleSaveSettlement}
                disabled={submitSettlementMutation.isPending}
                className="flex-1 rounded-lg bg-[#785600] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitSettlementMutation.isPending ? (
                  <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Confirm & Save'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ======================================================
  // MAIN RETURN
  // ======================================================

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 md:px-8 md:py-6">
        {/* PAGE HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <PageHeader
            title="Client & Settlement"
            subtitle="Manage client settlements and gold balances"
          />
          <GenericButton
            onClick={() => setShowAddClientModal(true)}
            variant="primary"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </GenericButton>
        </div>

        {/* STATISTICS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Total Clients
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {filteredSettlements.length}
                </span>
              </div>
              <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-blue-700/30 dark:bg-blue-900/30">
                <Users className="h-4 w-4 text-[#785600] dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Pending Settlements
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {totalPending}
                </span>
              </div>
              <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-yellow-700/30 dark:bg-yellow-900/30">
                <Clock className="h-4 w-4 text-[#785600] dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Settled
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {totalSettled}
                </span>
              </div>
              <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-green-700/30 dark:bg-green-900/30">
                <CheckCircle className="h-4 w-4 text-[#785600] dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Net Balance
                </span>
                <span className="text-lg font-bold text-black dark:text-white">
                  {formatNumber(totalPositiveBalance - totalNegativeBalance)} G
                </span>
              </div>
              <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-amber-700/30 dark:bg-amber-900/30">
                <Wallet className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search by client name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Balance</option>
              <option value="positive">Receiving (+)</option>
              <option value="negative">Giving (-)</option>
              <option value="zero">Zero Balance</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <GenericWeeklyDatePicker
              id="from-date-settlement"
              placeholder="DD/MM/YYYY"
              mode="from"
              initialDates={dateRange}
              onDateChange={(dates) => {
                if (dates && dates.length > 0) {
                  const from = new Date(dates[0]);
                  from.setHours(0, 0, 0, 0);
                  setDateRange((prev) => [from, prev[1] || from]);
                } else {
                  setDateRange((prev) => [undefined as any, prev[1]]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />

            <GenericWeeklyDatePicker
              id="to-date-settlement"
              placeholder="DD/MM/YYYY"
              mode="to"
              initialDates={dateRange}
              onDateChange={(dates) => {
                if (dates && dates.length > 0) {
                  const to = new Date(dates[0]);
                  to.setHours(23, 59, 59, 999);
                  setDateRange((prev) => [prev[0] || to, to]);
                } else {
                  setDateRange((prev) => [prev[0], undefined as any]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />

            <GenericButton
              onClick={() => {
                if (filteredSettlements.length === 0) {
                  toast.error('No records to print');
                  return;
                }
                handlePrintTable();
              }}
              className="!bg-[#785600] !text-white hover:!bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          </div>
        </div>

        {/* TABLE */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable<SettlementEntry>
            data={filteredSettlements}
            columns={columns}
            onSave={(item) => console.log('Save:', item)}
            emptyMessage={
              isSettlementsLoading
                ? 'Loading settlement data...'
                : 'No settlement entries found.'
            }
            isLoading={isSettlementsLoading}
            renderActions={renderActions}
            showSrNo={true}
            onRowClick={handleRowClick}
            srNoLabel="Sr No."
          />
        </div>
      </div>

      {/* MODALS */}
      {renderSettlementModal()}
      {renderConfirmModal()}
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onSuccess={() => refetchSettlements()}
      />
    </div>
  );
};

export default Settlement;
