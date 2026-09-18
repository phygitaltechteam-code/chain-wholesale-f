import React, {useState} from 'react';
import {usePermission} from '@/hooks/usePermission';
import {Plus, Search, ChevronLeft} from 'lucide-react';
import {
  useGetKarigars,
  useAddKarigar,
  useUpdateKarigar,
  useDeleteKarigar,
  KarigarData,
} from './karigarapi';
import KarigarForm from './KarigarForm';
import KarigarStats from './KarigarStats';
import KarigarTable from './KarigarTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {useNavigate} from '@tanstack/react-router';
import PinPopUp from '@/components/pin/PinPopUp';

export interface ExtendedKarigarData extends KarigarData {
  employmentType?: 'inhouse' | 'outhouse';
  salary?: number;
  password?: string;
}

const Kariger: React.FC = () => {
  const navigate = useNavigate();
  const {canEdit} = usePermission('karigar');

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKarigar, setEditingKarigar] =
    useState<ExtendedKarigarData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ExtendedKarigarData | null>(null);

  // PIN verification states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    karigar: ExtendedKarigarData | null;
  } | null>(null);

  const [pendingEditData, setPendingEditData] =
    useState<ExtendedKarigarData | null>(null);

  const itemsPerPage = 8;

  // API hooks
  const {data: karigarsData, refetch, isLoading: isFetching} = useGetKarigars();
  const addKarigar = useAddKarigar();
  const updateKarigar = useUpdateKarigar();
  const deleteKarigar = useDeleteKarigar();

  // Extract karigars array from response
  const rawData = karigarsData?.data || karigarsData;
  const karigars: ExtendedKarigarData[] = Array.isArray(rawData)
    ? rawData.map((k: any) => ({
        ...k,
        id: String(k.id || k._id || ''),
      }))
    : [];

  const handleAddKarigar = async (data: any) => {
    try {
      const apiType =
        data.employmentType === 'inhouse' ? 'IN_HOUSE' : 'OUT_SOURCE';
      const payload: any = {
        name: data.name,
        phoneNumber: data.phoneNumber,
        address: data.address || '',
        type: apiType,
        password: data.password,
      };
      if (data.employmentType === 'inhouse' && data.salary) {
        payload.salary = parseFloat(data.salary);
      }
      await addKarigar.mutateAsync(payload);
      setIsAdding(false);
      refetch();
    } catch {
      // Handled in mutation hook
    }
  };

  const handleUpdateKarigar = async (data: any) => {
    if (!pendingEditData) return;
    try {
      const apiType =
        data.employmentType === 'inhouse' ? 'IN_HOUSE' : 'OUT_SOURCE';
      const payload: any = {
        id: pendingEditData.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
        address: data.address || '',
        type: apiType,
        password: data.password,
      };
      if (data.employmentType === 'inhouse' && data.salary) {
        payload.salary = parseFloat(data.salary);
      }
      await updateKarigar.mutateAsync(payload);
      setIsEditing(false);
      setEditingKarigar(null);
      setPendingEditData(null);
      refetch();
    } catch {
      // Handled in mutation hook
    }
  };

  const handleEditClick = (
    karigar: ExtendedKarigarData,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setPendingEditData(karigar);
    setPendingAction({type: 'edit', karigar});
    setShowPinModal(true);
  };

  const executeEdit = () => {
    if (pendingEditData) {
      setEditingKarigar(pendingEditData);
      setIsEditing(true);
      setIsAdding(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingKarigar(null);
    setPendingEditData(null);
  };

  const handleDeleteClick = (
    karigar: ExtendedKarigarData,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setPendingAction({type: 'delete', karigar});
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setTimeout(() => {
      if (pendingAction?.type === 'edit' && pendingAction.karigar) {
        executeEdit();
        setPendingAction(null);
      } else if (pendingAction?.type === 'delete' && pendingAction.karigar) {
        setItemToDelete(pendingAction.karigar);
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
      await deleteKarigar.mutateAsync(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      refetch();
    } catch {
      // Handled in mutation hook
    }
  };

  const handleRowClick = (karigar: ExtendedKarigarData) => {
    try {
      navigate({
        to: `/joborder/karigerbyid/${karigar.id}` as any,
      });
    } catch {
      // fallback
    }
  };

  const filteredKarigars = karigars.filter(
    (karigar) =>
      karigar.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      karigar.phoneNumber?.includes(searchTerm) ||
      karigar.address?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isLoading =
    isFetching ||
    addKarigar.isPending ||
    updateKarigar.isPending ||
    deleteKarigar.isPending;

  if (isEditing && editingKarigar) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] p-4 sm:p-6 dark:bg-slate-950">
        {showPinModal && (
          <PinPopUp onSuccess={handlePinSuccess} onClose={handlePinClose} />
        )}

        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={handleCancelEdit}
              className="rounded-xl border border-[#d3c4af]/30 p-2 text-[#4f4535] transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <ChevronLeft size={20} />
            </button>
            <PageHeader
              title="Edit Karigar"
              subtitle="Update artisan profile & credentials"
            />
          </div>

          <KarigarForm
            onSuccess={handleUpdateKarigar}
            onCancel={handleCancelEdit}
            isPending={updateKarigar.isPending}
            initialData={editingKarigar}
            isEditMode={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      {showPinModal && (
        <PinPopUp onSuccess={handlePinSuccess} onClose={handlePinClose} />
      )}

      <div>
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-6">
            <PageHeader
              title="Karigar Management"
              subtitle="Add and manage artisans, wages and assignment credentials"
            />

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-[#d3c4af]/30 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 sm:w-72 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Search name, phone, address..."
                  type="text"
                />
              </div>
              {canEdit && (
                <GenericButton
                  onClick={() => {
                    setIsAdding(true);
                    setIsEditing(false);
                    setEditingKarigar(null);
                  }}
                  className="flex items-center gap-2 !px-5 !py-2.5 shadow-md shadow-[#785600]/20"
                >
                  <Plus size={18} />
                  <span>Add Karigar</span>
                </GenericButton>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <KarigarStats karigars={karigars} />

        {/* Add Form */}
        {canEdit && isAdding && (
          <div className="mb-6">
            <KarigarForm
              onSuccess={handleAddKarigar}
              onCancel={() => setIsAdding(false)}
              isPending={addKarigar.isPending}
              isEditMode={false}
            />
          </div>
        )}

        {/* Table View */}
        <KarigarTable
          filteredKarigars={filteredKarigars}
          isLoading={isLoading}
          canEdit={canEdit}
          itemsPerPage={itemsPerPage}
          onRowClick={handleRowClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && !showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-[#4f4535] dark:text-slate-300">
              Are you sure you want to delete artisan{' '}
              <span className="font-semibold text-red-600">{itemToDelete.name}</span>? This action cannot be undone.
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
                disabled={deleteKarigar.isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 font-medium text-white shadow-md shadow-red-600/20 transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteKarigar.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kariger;
