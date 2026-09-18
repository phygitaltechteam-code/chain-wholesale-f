import React from 'react';
import {Home, Building} from 'lucide-react';
import {ExtendedKarigarData} from './Kariger';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';

interface KarigarTableProps {
  karigars?: ExtendedKarigarData[];
  filteredKarigars?: ExtendedKarigarData[];
  paginatedData?: ExtendedKarigarData[];
  isLoading?: boolean;
  canEdit?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  startIdx?: number;
  endIdx?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (karigar: ExtendedKarigarData) => void;
  onEditClick?: (karigar: ExtendedKarigarData, e?: React.MouseEvent) => void;
  onDeleteClick?: (karigar: ExtendedKarigarData, e?: React.MouseEvent) => void;
}

export const KarigarTable: React.FC<KarigarTableProps> = ({
  karigars = [],
  filteredKarigars,
  isLoading = false,
  canEdit = false,
  itemsPerPage = 10,
  onRowClick,
  onEditClick,
  onDeleteClick,
}) => {
  const data = filteredKarigars || karigars;

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

  const getEmploymentBadge = (type?: string) => {
    if (type === 'IN_HOUSE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Home size={12} />
          Inhouse
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
        <Building size={12} />
        Outhouse
      </span>
    );
  };

  const columns: Column<ExtendedKarigarData>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      align: 'center',
      render: (karigar) => (
        <div>
          <span className="block text-sm font-medium text-[#1a1c1b] dark:text-white">
            {formatDate(karigar.createdAt)}
          </span>
          <span className="block text-xs text-[#817563]">
            {formatTime(karigar.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Karigar Name',
      align: 'center',
      render: (karigar) => (
        <div className="flex flex-col items-center">
          <span className="block text-sm font-medium text-[#1a1c1b] dark:text-white">
            {karigar.name}
          </span>
          <div className="mt-1">{getEmploymentBadge(karigar.type)}</div>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone Number',
      align: 'center',
      render: (karigar) => (
        <span className="text-sm text-[#4f4535] dark:text-slate-300">
          {karigar.phoneNumber || '—'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Employment Type',
      align: 'center',
      render: (karigar) => (
        <span className="text-sm text-[#4f4535] dark:text-slate-300">
          {karigar.type === 'IN_HOUSE' ? 'Inhouse' : 'Outhouse'}
        </span>
      ),
    },
    {
      key: 'salary',
      header: 'Monthly Salary',
      align: 'center',
      render: (karigar) =>
        karigar.type === 'IN_HOUSE' && karigar.salary ? (
          <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
            ₹{karigar.salary.toLocaleString()}
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      key: 'address',
      header: 'Address',
      align: 'center',
      render: (karigar) => (
        <span
          className="block max-w-[180px] truncate text-sm text-[#4f4535] dark:text-slate-300"
          title={karigar.address}
        >
          {karigar.address || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="-mx-3 sm:-mx-4 md:mx-0">
      <GenericTable<ExtendedKarigarData>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pageSize={itemsPerPage}
        emptyMessage="No karigars found. Add your first karigar above."
        showSrNo={true}
        srNoLabel="Sr No."
        onRowClick={onRowClick}
        showEdit={canEdit}
        showDelete={canEdit}
        onEdit={onEditClick ? (item) => onEditClick(item) : undefined}
        onDelete={onDeleteClick ? (item) => onDeleteClick(item) : undefined}
      />
    </div>
  );
};

export default KarigarTable;
