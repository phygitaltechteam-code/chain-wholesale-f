import React, {useState} from 'react';
import {usePermission} from '@/hooks/usePermission';
import {Plus, Search, X} from 'lucide-react';
import PageHeader from '@/components/Forms/Common/PageHeader';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetJobs} from './jobcreationapi';
import {useGetClients} from '@/lib/api/client';
import {JobCreationDisplay} from './JobCreationDisplay';
import {AddJobModal} from './AddJobModal';
import AddClientModal from '@/components/Client/AddClientModal';
import {Job, Stage} from './types';

const calculateJobStatus = (stages: Stage[]): string => {
  if (!stages || stages.length === 0) return 'PENDING';
  const allCompleted = stages.every((stage) => stage.status === 'COMPLETED');
  const hasInProgress = stages.some((stage) => stage.status === 'IN_PROGRESS');
  if (allCompleted) return 'COMPLETED';
  if (hasInProgress) return 'IN_PROGRESS';
  return 'PENDING';
};

const JobCreation: React.FC = () => {
  const {canEdit} = usePermission('jobCreation');
  const [showAddJobForm, setShowAddJobForm] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  // Search & Date filters
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const {data: jobsData, refetch: refetchJobs, isLoading: jobsLoading} = useGetJobs();
  const {data: clientsData, isLoading: clientsLoading, refetch: refetchClients} = useGetClients();

  const clients = Array.isArray(clientsData) ? clientsData : [];

  const processedJobs: Job[] = (jobsData || []).map((job: any) => ({
    ...job,
    calculatedStatus: calculateJobStatus(job.stages || []),
  }));

  const filteredJobs = processedJobs.filter((job) => {
    const matchesSearch =
      !searchTerm ||
      job.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobNo?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (fromDate) {
      const startOfDay = new Date(fromDate);
      startOfDay.setHours(0, 0, 0, 0);
      if (new Date(job.createdAt) < startOfDay) {
        matchesDate = false;
      }
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(job.createdAt) > endOfDay) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const handleFromDateChange = (dates: Date[]) => {
    setFromDate(dates && dates.length > 0 ? dates[0] : null);
  };

  const handleToDateChange = (dates: Date[]) => {
    setToDate(dates && dates.length > 0 ? dates[0] : null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFromDate(null);
    setToDate(null);
  };

  const hasActiveFilters = Boolean(searchTerm || fromDate || toDate);

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div>
        {/* Page Header & Action */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <PageHeader
            title="Job Creation & Management"
            subtitle="Initiate custom manufacturing work orders, design specs & stone allocations"
          />

          {canEdit && (
            <button
              onClick={() => setShowAddJobForm(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#785600]/20 transition-all hover:brightness-105"
            >
              <Plus size={18} />
              <span>Create New Job</span>
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="mb-6 rounded-2xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search job no, client, item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white py-2 pl-10 pr-4 text-xs outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Weekly Date Filters */}
            <div className="flex items-center gap-2">
              <GenericWeeklyDatePicker
                id="job-creation-from-date"
                placeholder="From Date"
                mode="from"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={handleFromDateChange}
                className="w-32 sm:w-36 md:w-40"
              />

              <GenericWeeklyDatePicker
                id="job-creation-to-date"
                placeholder="To Date"
                mode="to"
                initialDates={toDate ? [toDate] : []}
                onDateChange={handleToDateChange}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <X size={14} />
                Clear
              </button>
            )}

            <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400">
              {filteredJobs.length} Order{filteredJobs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Job List View */}
        <JobCreationDisplay
          jobs={filteredJobs}
          isLoading={jobsLoading}
        />

        {/* Add Job Modal */}
        <AddJobModal
          isOpen={showAddJobForm}
          onClose={() => setShowAddJobForm(false)}
          onSuccess={() => {
            refetchJobs();
          }}
          clients={clients}
          clientsLoading={clientsLoading}
          onAddNewClient={() => setIsAddClientModalOpen(true)}
        />

        {/* Add Client Modal */}
        <AddClientModal
          isOpen={isAddClientModalOpen}
          onClose={() => setIsAddClientModalOpen(false)}
          onSuccess={() => {
            refetchClients();
          }}
        />
      </div>
    </div>
  );
};

export default JobCreation;
