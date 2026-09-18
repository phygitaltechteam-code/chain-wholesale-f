import React, {useState} from 'react';
import {
  useAddProcess,
  useGetProcesses,
  useUpdateProcess,
  useDeleteProcess,
} from './processapi';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {Plus, Check, X} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/Forms/Common/PageHeader';
import PinPopUp from '@/components/pin/PinPopUp';
import {usePermission} from '@/hooks/usePermission';

export interface ProcessData {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

const Process: React.FC = () => {
  const {canEdit} = usePermission('addProcess');
  const [processName, setProcessName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProcessData | null>(null);

  // PIN verification states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    process: ProcessData | null;
  } | null>(null);

  // Store edit data for when PIN verification succeeds
  const [pendingEditData, setPendingEditData] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // API hooks
  const addProcess = useAddProcess();
  const updateProcess = useUpdateProcess();
  const deleteProcess = useDeleteProcess();
  const {data: processesData, refetch, isLoading} = useGetProcesses();

  // Extract processes array from response
  const rawList = processesData?.data || processesData;
  const processes: ProcessData[] = Array.isArray(rawList)
    ? rawList.map((item: any) => ({
        ...item,
        id: String(item.id || item._id || ''),
      }))
    : [];

  // Handle add process
  const handleAddProcess = async () => {
    if (!processName.trim()) {
      toast.error('Please enter process name');
      return;
    }

    try {
      await addProcess.mutateAsync({name: processName.trim()});
      toast.success('Process added successfully');
      setProcessName('');
      refetch();
    } catch {
      // Handled in mutation hook
    }
  };

  // Handle edit process - opens PIN modal first
  const handleEditClick = (process: ProcessData) => {
    setPendingEditData({
      id: process.id,
      name: process.name,
    });
    setPendingAction({type: 'edit', process});
    setShowPinModal(true);
  };

  // Execute edit after PIN verification
  const executeEdit = () => {
    if (pendingEditData) {
      setIsEditing(true);
      setEditingId(pendingEditData.id);
      setEditingName(pendingEditData.name);
      setPendingEditData(null);
    }
  };

  const handleUpdateProcess = async () => {
    if (!editingName.trim()) {
      toast.error('Please enter process name');
      return;
    }

    if (!editingId) return;

    try {
      await updateProcess.mutateAsync({id: editingId, name: editingName.trim()});
      toast.success('Process updated successfully');
      setIsEditing(false);
      setEditingId(null);
      setEditingName('');
      refetch();
    } catch {
      // Handled in mutation hook
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setEditingName('');
  };

  // Handle delete process - opens PIN modal first
  const handleDeleteClick = (process: ProcessData) => {
    setPendingAction({type: 'delete', process});
    setShowPinModal(true);
  };

  // Execute action after PIN verification
  const handlePinSuccess = () => {
    setShowPinModal(false);
    setTimeout(() => {
      if (pendingAction?.type === 'edit') {
        executeEdit();
        setPendingAction(null);
      } else if (pendingAction?.type === 'delete' && pendingAction.process) {
        setItemToDelete(pendingAction.process);
        setShowDeleteModal(true);
        setPendingAction(null);
      }
    }, 150);
  };

  const handlePinClose = () => {
    setShowPinModal(false);
    setPendingAction(null);
    setPendingEditData(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteProcess.mutateAsync(itemToDelete.id);
      toast.success('Process deleted successfully');
      setShowDeleteModal(false);
      setItemToDelete(null);
      refetch();
    } catch {
      // Handled in mutation hook
    }
  };

  // Table columns
  const columns: Column<ProcessData>[] = [
    {
      key: 'createdAt',
      header: 'Created Date',
      align: 'left',
      render: (item: ProcessData) => {
        const date = item.createdAt ? new Date(item.createdAt) : null;
        return (
          <div>
            <div className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {date && !isNaN(date.getTime())
                ? date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </div>
            {date && !isNaN(date.getTime()) && (
              <div className="text-xs text-[#4f4535] dark:text-slate-400">
                {date.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'name',
      header: 'Process Name',
      align: 'left',
      render: (item: ProcessData) => {
        if (isEditing && editingId === item.id) {
          return (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="flex-1 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                autoFocus
              />
              <button
                onClick={handleUpdateProcess}
                className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                title="Save"
              >
                <Check size={18} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Cancel"
              >
                <X size={18} />
              </button>
            </div>
          );
        }
        return (
          <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
            {item.name}
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-4 sm:p-6 dark:bg-slate-950">
      {/* PIN Verification Modal */}
      {showPinModal && (
        <PinPopUp onSuccess={handlePinSuccess} onClose={handlePinClose} />
      )}

      <div>
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            title="Process Management"
            subtitle="Add and manage jewellery manufacturing processes"
          />
        </div>

        {/* Add Process Form */}
        {canEdit && (
          <div className="mb-6 rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
                  Process Name
                </label>
                <input
                  type="text"
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                  placeholder="Enter process name (e.g., Casting, Polishing, Setting)"
                  className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-2.5 text-sm transition-all focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddProcess();
                    }
                  }}
                />
              </div>
              <GenericButton
                onClick={handleAddProcess}
                className="flex items-center gap-2 !px-5 !py-2.5"
              >
                <Plus size={18} />
                Add Process
              </GenericButton>
            </div>
          </div>
        )}

        {/* Processes Table */}
        <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between border-b border-[#d3c4af]/10 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-[#1a1c1b] dark:text-white">
                All Processes
              </h2>
              <p className="text-xs text-[#4f4535] dark:text-slate-400">
                Total {processes.length} process{processes.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>

          <GenericTable<ProcessData>
            data={processes}
            columns={columns}
            isLoading={isLoading}
            pageSize={10}
            emptyMessage="No processes found. Add your first process above."
            showEdit={canEdit}
            showDelete={canEdit}
            onEdit={canEdit ? handleEditClick : undefined}
            onDelete={canEdit ? handleDeleteClick : undefined}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && !showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-[#4f4535] dark:text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-red-600">{itemToDelete.name}</span>? This
              action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="flex-1 rounded-xl border border-[#d3c4af]/30 py-2.5 font-medium text-[#4f4535] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteProcess.isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 font-medium text-white shadow-md shadow-red-600/20 transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProcess.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Process;
