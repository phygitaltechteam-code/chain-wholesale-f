// manufacturingprocess/Settlement.tsx

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
import {
  GenericTable,
  Column,
} from '@/components/Forms/Table/GenericTable';

import toast from 'react-hot-toast';

import {
  useSubmitSettlement,
} from '@/lib/api/settlement';

import { useGetClients } from '@/lib/api/client';

import GenericInputField from '../Forms/Input/GenericInputField';
import { useReactToPrint } from 'react-to-print';
import PDFHeader from '../Forms/Common/PDFHeader';
import GenericButton from '../Forms/Buttons/GenericButton';

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

interface ApiResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: any[];
  errors: null;
}


// ======================================================
// COMPONENT
// ======================================================

const Settlement: React.FC = () => {
  // ----------------------------------------------------
  // TABLE STATES
  // ----------------------------------------------------

  const [settlements, setSettlements] = useState<SettlementEntry[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [balanceFilter, setBalanceFilter] =
    useState<string>('all');

  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });


  // ----------------------------------------------------
  // MODAL STATES
  // ----------------------------------------------------

  const [showSettleModal, setShowSettleModal] =
    useState(false);

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);


  // ----------------------------------------------------
  // AMOUNT STATE
  // ----------------------------------------------------

  const [localAmount, setLocalAmount] =
    useState<string>('');


  // ----------------------------------------------------
  // SETTLEMENT DETAIL
  // ----------------------------------------------------

  const [settlementDetail, setSettlementDetail] =
    useState<SettlementDetail>({
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
  // INPUT REF
  // ----------------------------------------------------

  const inputRef =
    useRef<HTMLInputElement>(null);


  // ----------------------------------------------------
  // PRINT REF
  // ----------------------------------------------------

  const tablePrintRef = useRef<HTMLDivElement>(null);


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

  const submitSettlementMutation =
    useSubmitSettlement();


  // ======================================================
  // DEFAULT DATE RANGE
  // ======================================================

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


  // ======================================================
  // PROCESS API DATA
  // ======================================================

  useEffect(() => {
    if (
      settlementsData &&
      Array.isArray(settlementsData)
    ) {
      const apiData: SettlementEntry[] =
        settlementsData.map(
          (item: any, index: number) => ({
            id:
              item.id ||
              `settlement-${index}`,

            srNo: index + 1,

            clientName:
              item.fullName ||
              item.clientName ||
              item.client?.name ||
              'Unknown Client',

            phoneNumber:
              item.phoneNumber ||
              item.client?.phone ||
              'N/A',

            goldBalance:
              Number(
                item.openingBalance ??
                item.balance ??
                item.goldBalance ??
                0
              ),

            totalBill:
              Number(
                item.totalBills ??
                item.totalBill ??
                item.totalGiven ??
                0
              ),

            status:
              item.status ||
              (
                Number(
                  item.openingBalance ?? 0
                ) === 0
                  ? 'settled'
                  : 'pending'
              ),

            clientId:
              item.id ||
              item.clientId ||
              item.client?.id ||
              '',

            openingBalance:
              Number(
                item.openingBalance ?? 0
              ),

            due:
              item.due ?? null,

            address:
              item.address || '',

            totalBills:
              Number(
                item.totalBills ??
                item._count?.receipts ??
                0
              ),

            // Amount from opening balance
            amount: Number(item.openingBalance ?? 0),

            // Remark based on balance
            remark: Number(item.openingBalance ?? 0) > 0 ? 'Received' : 'Given',
          })
        );

      setSettlements(apiData);
    } else if (
      settlementsData &&
      !settlementsData?.status
    ) {
      toast.error(
        settlementsData?.message ||
        'Failed to fetch settlement data'
      );

      setSettlements([]);
    }
  }, [settlementsData]);


  // ======================================================
  // NUMBER FORMAT - Removed trailing zeros
  // ======================================================

  const formatNumber = (
    value: number | string | null | undefined
  ) => {
    const numberValue = Number(value ?? 0);

    if (Number.isNaN(numberValue)) {
      return '0';
    }

    // Remove trailing zeros
    return parseFloat(numberValue.toFixed(3)).toString();
  };


  // ======================================================
  // BALANCE COLOR
  // ======================================================

  const getBalanceColor = (
    balance: number
  ) => {
    if (balance > 0) {
      return 'text-green-600 dark:text-green-400';
    }

    if (balance < 0) {
      return 'text-red-600 dark:text-red-400';
    }

    return 'text-gray-600 dark:text-gray-400';
  };


  // ======================================================
  // BALANCE ICON
  // ======================================================

  const getBalanceIcon = (
    balance: number
  ) => {
    if (balance > 0) {
      return <Plus className="h-3 w-3" />;
    }

    if (balance < 0) {
      return <Minus className="h-3 w-3" />;
    }

    return null;
  };


  // ======================================================
  // STATUS BADGE
  // ======================================================

  const getStatusBadge = (
    status: string
  ) => {
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
  // PRINT TABLE REPORT - A4 Size
  // ======================================================

  const handlePrintTable = useReactToPrint({
    contentRef: tablePrintRef,
    documentTitle: `Settlement-Report-${new Date().toLocaleDateString()}`,
    pageStyle: `
      @page { 
        size: A4 landscape; 
        margin: 10mm; 
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        #settlement-print { 
          page-break-inside: avoid; 
          break-inside: avoid; 
        }
        .no-print { 
          display: none !important; 
        }
      }
    `,
  });


  // ======================================================
  // SETTLEMENT PRINT PREVIEW - A4 Size with Amount & Remark
  // ======================================================

  const SettlementPrintPreview = () => {
    const printData = filteredSettlements;
    const totalDue = printData.reduce((sum, item) => sum + Math.abs(item.goldBalance), 0);
    const totalBills = printData.reduce((sum, item) => sum + (item.totalBills || 0), 0);
    const totalAmount = printData.reduce((sum, item) => sum + Math.abs(item.amount), 0);

    return (
      <div
        className="bg-white p-6 max-w-full mx-auto font-sans text-xs"
        ref={tablePrintRef}
        id="settlement-print"
        style={{ width: '297mm', minHeight: '210mm' }}
      >
        {/* PDF Header */}
        <PDFHeader />

        <div className="border-b-2 border-[#c43d5c] my-3" />

        {/* Title */}
        <div className="mb-3 text-center">
          <h2 className="text-base font-bold text-gray-800">Settlement Report</h2>
          <p className="text-xs text-gray-500">
            {dateRange.from && dateRange.to
              ? `Period: ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`
              : 'All Dates'}
          </p>
          <p className="text-xs text-gray-500">
            Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Table */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-white">
              <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Sr</th>
              <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Client Name</th>
              <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">Phone</th>
              <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">Due Balance (g)</th>

              <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">Total Bills</th>
              <th className="border border-[#785600] px-2 py-1.5 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {printData.map((entry, index) => (
              <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-2 py-1.5 text-center">{index + 1}</td>
                <td className="border border-gray-300 px-2 py-1.5">{entry.clientName}</td>
                <td className="border border-gray-300 px-2 py-1.5">{entry.phoneNumber}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">
                  {formatNumber(Math.abs(entry.goldBalance))}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-right">{entry.totalBills || 0}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">
                  <span className={`px-2 py-0.5 text-[9px] font-medium capitalize ${entry.status === 'settled' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="border border-gray-300 px-2 py-1.5 text-right">Total:</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(totalDue)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNumber(totalAmount)}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center">-</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right">{totalBills}</td>
              <td className="border border-gray-300 px-2 py-1.5 text-center">{printData.length} entries</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t-2 border-[#785600] text-center">
          <p className="text-xs text-gray-500">This is a system-generated report</p>
          <div className="mt-0.5 flex justify-center gap-3 text-[10px] text-gray-400">
            <span>Powered by Matoshree Gold</span>
            <span>|</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };


  // ======================================================
  // OPEN SETTLEMENT MODAL
  // ======================================================

  const handleSettle = (
    entry: SettlementEntry
  ) => {
    const amount =
      Math.abs(
        Number(entry.goldBalance || 0)
      );

    setSettlementDetail({
      clientName:
        entry.clientName,

      phoneNumber:
        entry.phoneNumber,

      address:
        entry.address || '',

      pendingBalance:
        amount,

      totalBills:
        entry.totalBills || 0,

      settlementAmount:
        amount,

      settlementType:
        entry.goldBalance > 0
          ? 'receive'
          : 'give',

      date:
        new Date()
          .toISOString()
          .split('T')[0],

      clientId:
        entry.clientId,

      openingBalance:
        entry.openingBalance || 0,

      due:
        entry.due || null,
    });


    setLocalAmount(
      amount > 0
        ? amount.toString()
        : ''
    );


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
      date: new Date()
        .toISOString()
        .split('T')[0],
      clientId: '',
      openingBalance: 0,
      due: null,
    });
  };


  // ======================================================
  // PROCEED TO CONFIRM
  // ======================================================

  const handleProceedToConfirm = () => {
    const amount =
      Number(
        settlementDetail.settlementAmount
      );

    if (
      !amount ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      toast.error(
        'Please enter a valid settlement amount'
      );
      return;
    }


    if (
      !settlementDetail.clientId
    ) {
      toast.error(
        'Client ID is missing'
      );
      return;
    }


    if (
      settlementDetail.settlementType ===
      'receive' &&
      amount >
      settlementDetail.pendingBalance
    ) {
      toast.error(
        `Settlement amount cannot exceed pending balance of ${formatNumber(
          settlementDetail.pendingBalance
        )}g`
      );

      return;
    }


    setShowConfirmModal(true);
  };

  // ======================================================
  // SAVE SETTLEMENT - WITH REMARK
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

      // Send amount as number (positive for receive, negative for give)
      const signedAmount = settlementDetail.settlementType === 'receive'
        ? amount
        : -amount;

      // Determine remark based on settlement type
      const remark = settlementDetail.settlementType === 'receive' ? 'Received' : 'Given';

      const settlementData = {
        clientId: settlementDetail.clientId,
        amount: signedAmount,
        remark: remark,
      };

      const response = await submitSettlementMutation.mutateAsync(settlementData);

      // Success - close modals and reset
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

    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to save settlement');
    }
  };


  // ======================================================
  // FILTER
  // ======================================================

  const filteredSettlements =
    settlements.filter(
      (entry) => {
        const search =
          searchTerm.toLowerCase();

        const matchesSearch =
          entry.clientName
            .toLowerCase()
            .includes(search) ||
          entry.phoneNumber
            .includes(search);


        const matchesBalance =
          balanceFilter === 'all' ||
          (
            balanceFilter === 'positive' &&
            entry.goldBalance > 0
          ) ||
          (
            balanceFilter === 'negative' &&
            entry.goldBalance < 0
          ) ||
          (
            balanceFilter === 'zero' &&
            entry.goldBalance === 0
          );


        return (
          matchesSearch &&
          matchesBalance
        );
      }
    );


  // ======================================================
  // TOTALS
  // ======================================================

  const totalPositiveBalance =
    settlements.reduce(
      (sum, item) =>
        item.goldBalance > 0
          ? sum + item.goldBalance
          : sum,
      0
    );


  const totalNegativeBalance =
    settlements.reduce(
      (sum, item) =>
        item.goldBalance < 0
          ? sum +
          Math.abs(
            item.goldBalance
          )
          : sum,
      0
    );


  const totalPending =
    settlements.filter(
      (item) =>
        item.status !== 'settled'
    ).length;


  const totalSettled =
    settlements.filter(
      (item) =>
        item.status === 'settled'
    ).length;


  // ======================================================
  // ACTION BUTTON - Disabled after settlement
  // ======================================================

  const renderActions = (
    item: SettlementEntry
  ) => (
    <button
      type="button"
      onClick={() =>
        handleSettle(item)
      }
      disabled={
        item.status === 'settled'
      }
      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${item.status === 'settled'
        ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-600'
        : 'bg-[#785600] text-white hover:bg-[#5d4200]'
        }`}
    >
      {item.status === 'settled' ? (
        <>
          <CheckCircle className="h-3 w-3" />
          Settled
        </>
      ) : (
        <>
          <CheckCircle className="h-3 w-3" />
          Settle
        </>
      )}
    </button>
  );


  // ======================================================
  // TABLE COLUMNS - With Amount and Remark
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
      key: 'goldBalance',
      header: 'Due Balance(G)',

      render: (item) => (
        <div
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-bold ${getBalanceColor(
            item.goldBalance
          )}`}
        >
          {getBalanceIcon(
            item.goldBalance
          )}

          {formatNumber(
            Math.abs(
              item.goldBalance
            )
          )}

          {' g'}
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

  const renderSettlementModal =
    () => {
      if (!showSettleModal) {
        return null;
      }


      const remainingBalance =
        settlementDetail
          .settlementType ===
          'receive'
          ? settlementDetail
            .pendingBalance -
          settlementDetail
            .settlementAmount
          : settlementDetail
            .pendingBalance +
          settlementDetail
            .settlementAmount;


      // Get signed amount display
      const getSignedDisplay = () => {
        const amount = settlementDetail.settlementAmount;
        if (amount <= 0) return '';
        return settlementDetail.settlementType === 'receive'
          ? `+${formatNumber(amount)}`
          : `-${formatNumber(amount)}`;
      };


      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeSettlementModal();
            }
          }}
        >
          <div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-slate-900"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d3c4af]/20 bg-white/95 px-6 py-3 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/95">

              <div className="flex items-center gap-3">

                <div className="rounded-full bg-[#785600]/10 p-2 dark:bg-[#785600]/20">
                  <Wallet className="h-5 w-5 text-[#785600]" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                    Settlement
                  </h2>
                </div>

              </div>


              <button
                type="button"
                onClick={
                  closeSettlementModal
                }
                className="rounded-full bg-red-500 p-2 text-white transition-colors duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>

            </div>


            {/* BODY */}
            <div className="p-6">

              {/* CLIENT INFORMATION */}
              <div className="mb-5 rounded-lg bg-[#f4f4f2] p-4 dark:bg-slate-800">

                <div className="space-y-2">

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#785600]" />
                    <label className="text-sm font-semibold text-[#1a1c1b] dark:text-white">Client Name : </label>
                    <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
                      {settlementDetail.clientName}
                    </span>
                  </div>


                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#785600]" />
                    <label className="text-sm font-semibold text-[#1a1c1b] dark:text-white">Phone Number : </label>
                    <span className="text-sm text-[#1a1c1b] dark:text-white">
                      {settlementDetail.phoneNumber}
                    </span>
                  </div>


                  {settlementDetail.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#785600]" />
                      <label className="text-sm font-semibold text-[#1a1c1b] dark:text-white">Address : </label>
                      <span className="truncate text-sm text-[#1a1c1b] dark:text-white">
                        {
                          settlementDetail.address
                        }
                      </span>
                    </div>
                  )}

                </div>


                <div className="my-3 border-t border-[#d3c4af]/30 dark:border-slate-700/50" />


                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <p className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400">
                      Due Balance
                    </p>

                    <p
                      className={`text-sm font-bold ${settlementDetail.pendingBalance >
                        0
                        ? 'text-red-600'
                        : 'text-green-600'
                        }`}
                    >
                      {formatNumber(
                        settlementDetail.pendingBalance
                      )}
                      g
                    </p>
                  </div>


                  <div>
                    <p className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400">
                      Total Bills
                    </p>

                    <p className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                      {
                        settlementDetail.totalBills
                      }
                    </p>
                  </div>

                </div>

              </div>


              {/* RECEIVE / GIVEN */}
              <div className="mb-4 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setSettlementDetail(
                      (prev) => ({
                        ...prev,
                        settlementType:
                          'receive',
                      })
                    );

                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    }, 50);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${settlementDetail.settlementType ===
                    'receive'
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                >
                  <Plus className="h-4 w-4" />
                  Receive
                </button>


                <button
                  type="button"
                  onClick={() => {
                    setSettlementDetail(
                      (prev) => ({
                        ...prev,
                        settlementType:
                          'give',
                      })
                    );

                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    }, 50);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${settlementDetail.settlementType ===
                    'give'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                >
                  <Minus className="h-4 w-4" />
                  Given
                </button>

              </div>


              {/* AMOUNT INPUT - With 3 decimal places */}
              <GenericInputField
                ref={inputRef}
                name="settlementAmount"
                type="text"
                inputMode="decimal"
                label="Amount (g)"
                value={localAmount}

                onChange={(e) => {
                  const value =
                    e.target.value;

                  // Allow only numbers and up to 3 decimal places
                  if (
                    !/^\d*\.?\d{0,3}$/.test(
                      value
                    )
                  ) {
                    return;
                  }


                  setLocalAmount(value);


                  if (value === '') {
                    setSettlementDetail(
                      (prev) => ({
                        ...prev,
                        settlementAmount:
                          0,
                      })
                    );

                    return;
                  }


                  const numberValue =
                    Number(value);


                  if (
                    !Number.isNaN(
                      numberValue
                    )
                  ) {
                    setSettlementDetail(
                      (prev) => ({
                        ...prev,
                        settlementAmount:
                          numberValue,
                      })
                    );
                  }
                }}


                onFocus={(e) => {
                  e.target.select();
                }}


                onBlur={() => {
                  const amount =
                    Number(
                      localAmount
                    );


                  if (
                    localAmount === '' ||
                    Number.isNaN(amount)
                  ) {
                    setLocalAmount('');

                    setSettlementDetail(
                      (prev) => ({
                        ...prev,
                        settlementAmount:
                          0,
                      })
                    );

                    return;
                  }


                  let finalAmount =
                    amount;


                  if (
                    settlementDetail
                      .settlementType ===
                    'receive'
                  ) {
                    finalAmount =
                      Math.min(
                        Math.max(
                          amount,
                          0
                        ),
                        settlementDetail.pendingBalance
                      );
                  } else {
                    finalAmount =
                      Math.max(
                        amount,
                        0
                      );
                  }


                  finalAmount =
                    Number(
                      finalAmount.toFixed(
                        3
                      )
                    );


                  setSettlementDetail(
                    (prev) => ({
                      ...prev,
                      settlementAmount:
                        finalAmount,
                    })
                  );


                  // Show without trailing zeros
                  setLocalAmount(
                    finalAmount > 0
                      ? parseFloat(finalAmount.toFixed(3)).toString()
                      : ''
                  );
                }}


                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter'
                  ) {
                    e.preventDefault();

                    handleProceedToConfirm();
                  }

                  if (
                    e.key === 'Escape'
                  ) {
                    e.preventDefault();

                    closeSettlementModal();
                  }
                }}


                placeholder={`Max ${formatNumber(
                  settlementDetail.pendingBalance
                )}g`}

                suffix="g"
              />

              {/* REMAINING BALANCE */}
              {settlementDetail.settlementAmount >
                0 && (
                  <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Remaining Balance:
                      </span>

                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(
                          remainingBalance
                        )}
                        g
                      </span>

                    </div>

                  </div>
                )}


              {/* ACTION BUTTONS */}
              <div className="flex gap-2 pt-2">

                <button
                  type="button"
                  onClick={
                    closeSettlementModal
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={
                    handleProceedToConfirm
                  }
                  disabled={
                    submitSettlementMutation.isPending ||
                    settlementDetail.settlementAmount <=
                    0
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#785600] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4" />
                  Proceed to Confirm
                </button>

              </div>

            </div>

          </div>
        </div>
      );
    };


  // ======================================================
  // CONFIRMATION MODAL
  // ======================================================

  const renderConfirmModal = () => {
    if (!showConfirmModal) {
      return null;
    }

    const newBalance =
      settlementDetail.settlementType === 'receive'
        ? settlementDetail.pendingBalance - settlementDetail.settlementAmount
        : settlementDetail.pendingBalance + settlementDetail.settlementAmount;

    const signedAmount = settlementDetail.settlementType === 'receive'
      ? `+${formatNumber(settlementDetail.settlementAmount)}`
      : `-${formatNumber(settlementDetail.settlementAmount)}`;

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
          {/* CLOSE */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-gray-200 p-1.5 text-gray-600 transition-colors hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6">
            {/* Simple Header */}
            <div className="mb-4 text-center">
              <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Settlement
              </h2>
            </div>

            {/* Confirmation Message */}
            <div className="mb-5 space-y-3">
              <div className="text-center">
                <p className="text-sm text-[#4f4535] dark:text-slate-400">
                  Are you sure you want to proceed with this settlement?
                </p>
              </div>

              <div className="rounded-lg bg-[#f4f4f2] p-4 dark:bg-slate-800">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4f4535] dark:text-slate-400">Client:</span>
                    <span className="font-medium text-[#1a1c1b] dark:text-white">
                      {settlementDetail.clientName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4f4535] dark:text-slate-400">Amount:</span>
                    <span className={`font-bold ${settlementDetail.settlementType === 'receive'
                      ? 'text-green-600'
                      : 'text-red-600'
                      }`}>
                      {signedAmount}g
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4f4535] dark:text-slate-400">New Balance:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(newBalance)}g
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitSettlementMutation.isPending}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveSettlement}
                disabled={submitSettlementMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#785600] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitSettlementMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm & Save
                  </>
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
            title="Settlement"
            subtitle="Manage client settlements and gold balances"
          />

        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL CLIENTS */}
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">
                  Total Clients
                </p>

                <p className="text-2xl font-bold text-black">
                  {settlements.length}
                </p>
              </div>

              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>

            </div>

          </div>


          {/* PENDING */}
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">
                  Pending Settlements
                </p>

                <p className="text-2xl font-bold text-black">
                  {totalPending}
                </p>
              </div>

              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>

            </div>

          </div>


          {/* SETTLED */}
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">
                  Settled
                </p>

                <p className="text-2xl font-bold text-black">
                  {totalSettled}
                </p>
              </div>

              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>

            </div>

          </div>


          {/* NET BALANCE */}
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">
                  Net Balance
                </p>

                <p className="text-2xl font-bold text-black">
                  {formatNumber(
                    totalPositiveBalance -
                    totalNegativeBalance
                  )}
                 G
                </p>
              </div>

              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 sm:max-w-md">

            <div className="relative flex-1">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />

              <input
                type="text"
                placeholder="Search by client name or phone..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

            </div>


            <select
              value={
                balanceFilter
              }
              onChange={(e) =>
                setBalanceFilter(
                  e.target.value
                )
              }
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">
                All Balance
              </option>

              <option value="positive">
                Receiving (+)
              </option>

              <option value="negative">
                Giving (-)
              </option>

              <option value="zero">
                Zero Balance
              </option>
            </select>

          </div>

          <div className="flex items-center gap-2">

            <input
              type="date"
              value={
                dateRange.from
              }
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  from: e.target.value,
                })
              }
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />


            <span className="text-[#4f4535] dark:text-slate-400">
              to
            </span>


            <input
              type="date"
              value={
                dateRange.to
              }
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  to: e.target.value,
                })
              }
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {/* Print Report Button */}
            <GenericButton
              onClick={() => {
                if (filteredSettlements.length === 0) {
                  toast.error('No records to print');
                  return;
                }
                handlePrintTable();
              }}
            >
              <Printer className="h-4 w-4" />
              <span >Print</span>
            </GenericButton>
          </div>



        </div>


        {/* =================================================
            TABLE
        ================================================= */}

        <div className="-mx-3 sm:-mx-4 md:mx-0">

          <GenericTable<SettlementEntry>
            data={
              filteredSettlements
            }

            columns={
              columns
            }

            onSave={(item) =>
              console.log(
                'Save:',
                item
              )
            }

            emptyMessage={
              isSettlementsLoading
                ? 'Loading settlement data...'
                : 'No settlement entries found.'
            }

            isLoading={
              isSettlementsLoading
            }

            renderActions={
              renderActions
            }

            showSrNo={
              true
            }

            srNoLabel="Sr No."
          />

        </div>

      </div>


      {/* =================================================
          MODALS
      ================================================= */}

      {renderSettlementModal()}

      {renderConfirmModal()}

      {/* Hidden Print Component */}
      <div className="hidden">
        <SettlementPrintPreview />
      </div>

    </div>
  );
};


export default Settlement;