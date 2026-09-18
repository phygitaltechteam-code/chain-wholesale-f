import React, {useState, useMemo} from 'react';
import {
  Image as ImageIcon,
  X,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Eye,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import {formatCurrency} from '@/utils/utilities';
import {Job, JobImage} from './types';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';

interface JobCreationDisplayProps {
  jobs: Job[];
  onViewJob?: (job: Job) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  IN_PROGRESS: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
  COMPLETED: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
  CANCELLED: 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const JobCreationDisplay: React.FC<JobCreationDisplayProps> = ({
  jobs = [],
  onViewJob,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Image modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState<JobImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const getStatusBadge = (status: string) => {
    const color = statusColors[status] || 'bg-slate-100 text-slate-800';
    const label = statusLabels[status] || status;
    return (
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
        {label}
      </span>
    );
  };

  const openImageModal = (images: JobImage[], startIndex: number = 0, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImages(images);
    setCurrentImageIndex(startIndex);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setCurrentImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex < currentImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleRowClick = (job: Job) => {
    if (onViewJob) {
      onViewJob(job);
    } else {
      navigate({to: `/joborder/jewelleryjoborder/${job.id}` as any});
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const currentStatus = job.calculatedStatus || job.status || 'PENDING';
      return selectedStatus === 'all' || currentStatus === selectedStatus;
    });
  }, [jobs, selectedStatus]);

  const columns: Column<Job>[] = [
    {
      key: 'jobNo',
      header: 'Job Reference',
      align: 'center',
      render: (job) => (
        <div>
          <span className="block text-xs font-bold text-[#1a1c1b] dark:text-white">
            {job.jobNo || job.id?.slice(0, 8)}
          </span>
          <span className="block text-[10px] text-[#817563]">
            Created: {formatDate(job.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client Name',
      align: 'center',
      render: (job) => (
        <div>
          <span className="block text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {job.client?.fullName || 'Walk-in Customer'}
          </span>
          {job.client?.phoneNumber && (
            <span className="block text-[10px] text-[#817563]">
              {job.client.phoneNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'itemName',
      header: 'Item & Metal',
      align: 'center',
      render: (job) => (
        <div className="flex flex-col items-center">
          <span className="block text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {job.itemName}
          </span>
          {job.metal && (
            <span className="mt-0.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#785600] dark:bg-amber-950/40 dark:text-amber-400">
              {job.metal}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'netWeight',
      header: 'Net Wt',
      align: 'center',
      render: (job) => (
        <span className="text-xs font-medium text-[#1a1c1b] dark:text-white">
          {(job.netWeight || job.fineWeight || 0).toFixed(3)}g
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity',
      align: 'center',
      render: (job) => (
        <span className="text-xs text-[#4f4535] dark:text-slate-300">
          {job.purity ? `${job.purity}%` : '—'}
        </span>
      ),
    },
    {
      key: 'deliveryDate',
      header: 'Delivery Date',
      align: 'center',
      render: (job) => (
        <span className="text-xs text-[#4f4535] dark:text-slate-300">
          {formatDate(job.deliveryDate)}
        </span>
      ),
    },
    {
      key: 'advances',
      header: 'Advances',
      align: 'center',
      render: (job) => (
        <div className="space-y-0.5 text-xs">
          {job.cashAdvance ? (
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(job.cashAdvance)}
            </p>
          ) : null}
          {job.goldAdvance ? (
            <p className="text-[11px] font-semibold text-[#785600] dark:text-amber-400">
              {job.goldAdvance}g Gold
            </p>
          ) : null}
          {!job.cashAdvance && !job.goldAdvance && (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'images',
      header: 'Media',
      align: 'center',
      render: (job) =>
        job.images && job.images.length > 0 ? (
          <div className="flex items-center justify-center gap-1">
            <img
              src={job.images[0].image}
              alt="Design"
              className="h-8 w-8 cursor-pointer rounded-lg border border-[#d3c4af]/30 object-cover shadow-sm transition-transform hover:scale-110"
              onClick={(e) => openImageModal(job.images, 0, e)}
            />
            {job.images.length > 1 && (
              <span className="text-[10px] font-semibold text-[#785600]">
                +{job.images.length - 1}
              </span>
            )}
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
            <ImageIcon size={14} />
          </div>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (job) => getStatusBadge(job.calculatedStatus || job.status || 'PENDING'),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      render: (job) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(job);
          }}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#1a1c1b] dark:hover:bg-slate-800 dark:hover:text-white"
          title="View Job Details"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Status Badges Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => {
          const count =
            status === 'all'
              ? jobs.length
              : jobs.filter((j) => (j.calculatedStatus || j.status) === status).length;
          const label = status === 'all' ? 'All Orders' : statusLabels[status] || status;
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedStatus === status
                  ? 'bg-[#785600] text-white shadow-md shadow-[#785600]/20'
                  : 'border border-[#d3c4af]/20 bg-white text-[#4f4535] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedStatus === status
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Display using GenericTable */}
      <div className="-mx-3 sm:-mx-4 md:mx-0">
        <GenericTable<Job>
          data={filteredJobs}
          columns={columns}
          isLoading={isLoading}
          pageSize={10}
          emptyMessage="No manufacturing job orders found."
          showSrNo={true}
          srNoLabel="Sr No."
          onRowClick={handleRowClick}
        />
      </div>

      {/* Image Full Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] rounded-2xl bg-white p-3 shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute -right-3 -top-3 z-10 rounded-full bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600"
            >
              <X size={16} />
            </button>
            <div className="flex items-center justify-center">
              <img
                src={currentImages[currentImageIndex]?.image}
                alt="Job Design"
                className="max-h-[80vh] max-w-[85vw] rounded-xl object-contain"
              />
            </div>
            {currentImages.length > 1 && (
              <div className="mt-3 flex items-center justify-between px-2">
                <button
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                  className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                >
                  <PrevIcon size={16} />
                </button>
                <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                  {currentImageIndex + 1} of {currentImages.length}
                </span>
                <button
                  onClick={nextImage}
                  disabled={currentImageIndex === currentImages.length - 1}
                  className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                >
                  <NextIcon size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
