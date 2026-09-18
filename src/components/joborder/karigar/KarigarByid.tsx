/*eslint-disable*/
import React, {useState, useMemo} from 'react';
import {useNavigate} from '@tanstack/react-router';
import {usePermission} from '@/hooks/usePermission';
import {
  ArrowLeft,
  Search,
  Calendar,
  X,
  Plus,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {useGetKarigerById} from './karigarapi';
import {Route} from '@/routes/_app/joborder/karigerbyid.$id';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {useGetAccounts} from '@/components/account/accountapi';
import {StatsCards} from './StatsCards';
import {JobStagesTable} from './JobStagesTable';
import {PaymentsTable} from './PaymentsTable';
import {PaymentModal} from './PaymentModal';
import toast from 'react-hot-toast';
import {useSubmitPayment} from './paymentApi';
import {formatCurrency} from '@/utils/utilities';

export interface JobStage {
  id: string;
  jobId: string;
  jobNo: string;
  itemName: string;
  processName: string;
  metal: string;
  giveM: number;
  issueDate: string;
  takenWt: number;
  returnDate: string | null;
  wastage: number;
  labourAmount: number | null;
  payment: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  payments?: any[];
}

const metalOptions = [
  {value: 'ALL', label: 'All Metals'},
  {value: 'GOLD', label: 'Gold'},
  {value: 'SILVER', label: 'Silver'},
  {value: 'PLATINUM', label: 'Platinum'},
];

const KarigarByid: React.FC = () => {
  const {canEdit} = usePermission('karigar');
  const navigate = useNavigate();
  const {id} = Route.useParams();
  const {data, isLoading, isError, refetch} = useGetKarigerById(id);
  const {data: accountsData, isLoading: accountsLoading} = useGetAccounts();
  const submitPayment = useSubmitPayment();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'jobs' | 'payments'>('jobs');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStageForPayment, setSelectedStageForPayment] =
    useState<JobStage | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedMetal, setSelectedMetal] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const karigar = data?.data || data;
  const accounts = accountsData?.data || accountsData || [];
  const ledgerData = karigar?.ledger || [];

  const totalPaymentFromApi = karigar?.totalAmount || 0;
  const totalPaidFromApi = karigar?.givenAmount || 0;
  const totalPendingFromApi = karigar?.pendingAmount || 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return !isNaN(d.getTime())
      ? d.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '—';
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return `${formatDate(dateString)} • ${formatTime(dateString)}`;
  };

  const calculateStagePayments = () => {
    const paymentMap = new Map();

    ledgerData.forEach((entry: any) => {
      if (entry.amount > 0 && entry.stageId) {
        const current = paymentMap.get(entry.stageId) || 0;
        paymentMap.set(entry.stageId, current + entry.amount);
      } else if (entry.amount > 0 && !entry.stageId) {
        const key = `${entry.job}_${entry.stage}`;
        const current = paymentMap.get(key) || 0;
        paymentMap.set(key, current + entry.amount);
      }
    });

    return paymentMap;
  };

  const stagePaymentsMap = calculateStagePayments();

  const stagesData: JobStage[] =
    karigar?.jobStages?.map((stage: any) => {
      const stageId = stage.id;
      const jobKey = `${stage.job?.jobNo}_${stage.process?.name}`;

      let paidAmount = stagePaymentsMap.get(stageId) || 0;
      if (paidAmount === 0) {
        paidAmount = stagePaymentsMap.get(jobKey) || 0;
      }

      const labourCharges = stage.labourCharges || 0;

      return {
        id: stage.id,
        jobId: stage.jobId,
        jobNo: stage.job?.jobNo || 'N/A',
        itemName: stage.job?.itemName || 'N/A',
        processName: stage.process?.name || 'Unknown',
        metal: stage.job?.metal || 'GOLD',
        giveM: stage.fineGoldIssued || 0,
        issueDate: stage.dateIssued,
        takenWt: stage.goldReceived || 0,
        returnDate: stage.returnDate || null,
        wastage: stage.wastage || 0,
        labourAmount: stage.labourAmount,
        payment: labourCharges,
        paidAmount: paidAmount,
        pendingAmount: labourCharges - paidAmount,
        status: stage.status,
        payments: stage.payments,
      };
    }) || [];

  const filteredStages = useMemo(() => {
    return stagesData.filter((stage) => {
      if (fromDate && new Date(stage.issueDate) < new Date(fromDate))
        return false;
      if (toDate && new Date(stage.issueDate) > new Date(toDate)) return false;

      if (
        searchTerm &&
        !stage.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !stage.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !stage.processName.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;

      if (selectedMetal !== 'ALL' && stage.metal !== selectedMetal)
        return false;

      return true;
    });
  }, [stagesData, fromDate, toDate, searchTerm, selectedMetal]);

  const filteredGoldMetrics = useMemo(() => {
    let totalGoldIssued = 0;
    let totalGoldReceived = 0;
    let totalWastage = 0;

    filteredStages.forEach((stage) => {
      totalGoldIssued += stage.giveM || 0;
      totalGoldReceived += stage.takenWt || 0;
      totalWastage += stage.wastage || 0;
    });

    return {
      totalGoldIssued,
      totalGoldReceived,
      totalWastage,
    };
  }, [filteredStages]);

  const noOfWorks = filteredStages.length;
  const givenGold = filteredGoldMetrics.totalGoldIssued;
  const takenGold = filteredGoldMetrics.totalGoldReceived;
  const goldInPossession = givenGold - takenGold;

  const validPayments = ledgerData.filter((l: any) => l.amount && l.amount > 0);
  const lastPaidDate =
    validPayments.length > 0
      ? Math.max(...validPayments.map((l: any) => new Date(l.date).getTime()))
      : null;
  const pastPaidDate =
    lastPaidDate && lastPaidDate > 0
      ? formatDateTime(new Date(lastPaidDate).toISOString())
      : 'No payments yet';

  const handlePaymentSubmit = async () => {
    if (!selectedStageForPayment) return;

    if (paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    const maxPending = selectedStageForPayment.pendingAmount;
    if (paymentAmount > maxPending) {
      toast.error(
        `Amount cannot exceed pending amount of ₹${maxPending.toLocaleString()}`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPayment.mutateAsync({
        stageId: selectedStageForPayment.id,
        cash: paymentAmount,
        accountId: selectedAccount,
        karigarId: id,
      });

      toast.success(
        `Payment of ₹${paymentAmount.toLocaleString()} recorded successfully`,
      );
      setShowPaymentModal(false);
      setSelectedStageForPayment(null);
      setPaymentAmount(0);
      setSelectedAccount('');
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statsCardData = {
    noOfWorks,
    noGoldHandle: givenGold,
    givenGold,
    takenGold,
    goldInPossession,
    totalPayment: totalPaymentFromApi,
    totalPaid: totalPaidFromApi,
    totalPending: totalPendingFromApi,
    totalWastage: filteredGoldMetrics.totalWastage,
    pastPaidDate,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#785600] border-t-transparent"></div>
          <p className="text-sm font-medium text-[#4f4535] dark:text-slate-400">
            Loading karigar details...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !karigar) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate({to: '/joborder/kariger'})}
            className="mb-6 flex items-center gap-2 rounded-xl border border-[#d3c4af]/30 px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <ArrowLeft size={18} />
            Back to Karigars
          </button>
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-3 font-semibold text-red-600">
              Failed to load artisan details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div>
        <button
          onClick={() => navigate({to: '/joborder/kariger'})}
          className="mb-6 flex items-center gap-2 rounded-xl border border-[#d3c4af]/30 px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          <ArrowLeft size={18} />
          Back to Karigars
        </button>

        <div className="mb-8">
          <PageHeader
            title={karigar.name}
            subtitle={`${karigar.type === 'IN_HOUSE' ? 'Inhouse Artisan' : 'Outsource Artisan'} • ${karigar.phoneNumber || 'No phone'}`}
          />
        </div>

        <StatsCards data={statsCardData} formatCurrency={formatCurrency} />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#d3c4af]/20 pb-4 dark:border-slate-800">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-2 text-sm font-bold transition-colors ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-[#785600] text-[#785600] dark:text-amber-400'
                  : 'text-[#4f4535] hover:text-[#785600] dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Job Stages ({filteredStages.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-2 text-sm font-bold transition-colors ${
                activeTab === 'payments'
                  ? 'border-b-2 border-[#785600] text-[#785600] dark:text-amber-400'
                  : 'text-[#4f4535] hover:text-[#785600] dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Disbursement History
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-2 rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
              <Calendar
                size={14}
                className="text-[#785600] dark:text-amber-400"
              />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-[110px] rounded border-none bg-transparent text-xs text-[#1a1c1b] focus:outline-none dark:text-white"
              />
              <span className="text-xs text-[#817563]">-</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-[110px] rounded border-none bg-transparent text-xs text-[#1a1c1b] focus:outline-none dark:text-white"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Metal Filter */}
            <div className="flex items-center gap-2 rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
              <Filter
                size={14}
                className="text-[#785600] dark:text-amber-400"
              />
              <select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                className="rounded border-none bg-transparent text-xs text-[#1a1c1b] focus:outline-none dark:text-white"
              >
                {metalOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="dark:bg-slate-900"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search stages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[180px] rounded-xl border border-[#d3c4af]/30 bg-white py-1.5 pl-8 pr-3 text-xs outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Make Payment */}
            {canEdit && (
              <button
                onClick={() => {
                  const pendingStage = filteredStages.find(
                    (s) => s.pendingAmount > 0,
                  );
                  if (pendingStage) {
                    setSelectedStageForPayment(pendingStage);
                    setPaymentAmount(pendingStage.pendingAmount);
                    setShowPaymentModal(true);
                  } else {
                    toast.error('No pending payments available');
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-[#785600]/20 transition-all hover:brightness-105"
              >
                <Plus size={14} />
                Disburse Payment
              </button>
            )}
          </div>
        </div>

        {activeTab === 'jobs' && (
          <JobStagesTable
            stages={filteredStages}
            onViewJob={(jobId) =>
              navigate({to: `/joborder/jewelleryjoborder/${jobId}` as any})
            }
            onMakePayment={
              canEdit
                ? (stage) => {
                    setSelectedStageForPayment(stage);
                    setPaymentAmount(stage.pendingAmount);
                    setShowPaymentModal(true);
                  }
                : () => {}
            }
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTable
            stages={filteredStages}
            formatDate={formatDate}
            formatTime={formatTime}
            ledgerData={ledgerData}
            totalPendingFromApi={totalPendingFromApi}
          />
        )}
      </div>

      {canEdit && showPaymentModal && selectedStageForPayment && (
        <PaymentModal
          karigarName={karigar.name}
          stage={selectedStageForPayment}
          totalPendingAllStages={totalPendingFromApi}
          paymentAmount={paymentAmount}
          selectedAccount={selectedAccount}
          accounts={accounts}
          accountsLoading={accountsLoading}
          isSubmitting={isSubmitting}
          onAmountChange={setPaymentAmount}
          onAccountChange={setSelectedAccount}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedStageForPayment(null);
            setPaymentAmount(0);
            setSelectedAccount('');
          }}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  );
};

export default KarigarByid;
