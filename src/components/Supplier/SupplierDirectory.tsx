import React, {useState} from 'react';
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import AddSupplier from './AddSupplier';
import EditSupplier from './EditSupplier';
import PageHeader from '@/components/Forms/Common/PageHeader';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PinPopUp from '@/components/pin/PinPopUp';
import {usePermission} from '@/hooks/usePermission';
import {useGetsupplier, useDeletesupplier, Supplier} from './api';

export const SupplierDirectory: React.FC = () => {
  const {canEdit} = usePermission('supplier');
  const navigate = useNavigate();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSupplierData, setSelectedSupplierData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Supplier | null>(null);

  // PIN verification states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    supplier: Supplier | null;
  } | null>(null);

  const itemsPerPage = 8;

  const {data: rawData, refetch, isLoading} = useGetsupplier();
  const deleteSupplierMutation = useDeletesupplier();

  const rawList = Array.isArray(rawData?.data || rawData)
    ? rawData?.data || rawData
    : [];

  const suppliers: Supplier[] = rawList.map((item: any) => ({
    id: String(item.id || item._id || ''),
    fullname: item.fullname || item.name || '',
    shopName: item.shopName || '',
    phoneNumber: item.phoneNumber || '',
    secondaryPhoneNumber: item.secondaryPhoneNumber,
    city: item.city || '',
    address: item.address || '',
    birthday: item.birthday,
    anniversary: item.anniversary,
    GST: item.GST || '',
    PAN: item.PAN || '',
    due: item.due || 0,
    aadhar: item.aadhar || '',
    adminId: item.adminId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tier: item.tier || 'Regular',
    balance: item.balance || 0,
    gold: item.gold || '0',
    silver: item.silver || '0',
  }));

  const handleSupplierClick = (supplier: Supplier) => {
    if (supplier?.id) {
      try {
        navigate({
          to: `/supplier/supplierdetails/${supplier.id}` as any,
        });
      } catch {
        // fallback
      }
    }
  };

  const handleEditSupplier = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingAction({type: 'edit', supplier});
    setShowPinModal(true);
  };

  const handleDeleteClick = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingAction({type: 'delete', supplier});
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setTimeout(() => {
      if (pendingAction?.type === 'edit' && pendingAction.supplier) {
        const supplier = pendingAction.supplier;
        const raw = rawList.find((d: any) => String(d.id || d._id) === supplier.id);
        setSelectedSupplierId(supplier.id);
        setSelectedSupplierData(raw || supplier);
        setIsEditOpen(true);
        setPendingAction(null);
      } else if (pendingAction?.type === 'delete' && pendingAction.supplier) {
        setItemToDelete(pendingAction.supplier);
        setShowDeleteModal(true);
        setPendingAction(null);
      }
    }, 150);
  };

  const handlePinClose = () => {
    setShowPinModal(false);
    setPendingAction(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    deleteSupplierMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
        refetch();
      },
    });
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phoneNumber?.includes(searchTerm) ||
      supplier.GST?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.PAN?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalItems = filteredSuppliers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedData = filteredSuppliers.slice(startIdx, endIdx);

  const totalSuppliers = suppliers.length;
  const suppliersWithGST = suppliers.filter((c) => c.GST && c.GST.trim() !== '').length;
  const suppliersWithPAN = suppliers.filter((c) => c.PAN && c.PAN.trim() !== '').length;
  const suppliersWithAadhar = suppliers.filter((c) => c.aadhar && c.aadhar.trim() !== '').length;

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

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      {/* PIN Verification Modal */}
      {showPinModal && (
        <PinPopUp onSuccess={handlePinSuccess} onClose={handlePinClose} />
      )}

      {/* Header & Search */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-6">
          <PageHeader
            title="Supplier Directory"
            subtitle="Manage your curated list of trusted suppliers, bullions, casting & gemstone vendors"
          />

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="group relative flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 sm:w-72 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Search name, shop, phone, GST..."
                type="text"
              />
            </div>
            {canEdit && (
              <GenericButton
                onClick={() => setIsAddDrawerOpen(true)}
                className="flex items-center gap-2 !px-5 !py-2.5 shadow-md shadow-[#785600]/20"
              >
                <UserPlus size={18} />
                <span>Add Supplier</span>
              </GenericButton>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mb-8 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Total Suppliers
          </p>
          <p className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1c1b] dark:text-white">
            {totalSuppliers}
          </p>
        </div>

        <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            GST Registered
          </p>
          <p className="font-['Playfair_Display'] text-2xl font-bold text-[#785600] dark:text-amber-400">
            {suppliersWithGST}
          </p>
        </div>

        <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            PAN Registered
          </p>
          <p className="font-['Playfair_Display'] text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {suppliersWithPAN}
          </p>
        </div>

        <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4f4535]/80 dark:text-slate-400">
            Aadhar Registered
          </p>
          <p className="font-['Playfair_Display'] text-2xl font-bold text-blue-600 dark:text-blue-400">
            {suppliersWithAadhar}
          </p>
        </div>
      </div>

      {/* Table Display */}
      <div className="overflow-hidden rounded-2xl border border-[#d3c4af]/20 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-[#d3c4af]/10 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-[#1a1c1b] dark:text-white">
              All Suppliers
            </h2>
            <p className="text-xs text-[#4f4535] dark:text-slate-400">
              Total {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-[#d3c4af]/10 bg-[#f4f4f2]/60 text-xs uppercase tracking-[0.15em] text-[#4f4535] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                <th className="px-5 py-4 text-left font-semibold">Created Date & Time</th>
                <th className="px-5 py-4 text-left font-semibold">Supplier Name</th>
                <th className="px-5 py-4 text-left font-semibold">Contact</th>
                <th className="px-5 py-4 text-left font-semibold">GST/PAN</th>
                <th className="px-5 py-4 text-left font-semibold">Address</th>
                <th className="px-5 py-4 text-left font-semibold">Balance Due</th>
                {canEdit && <th className="px-5 py-4 text-center font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d3c4af]/10 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading suppliers...
                  </td>
                </tr>
              )}
              {!isLoading && paginatedData.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="group cursor-pointer transition-colors hover:bg-[#f4f4f2]/40 dark:hover:bg-slate-800/40"
                  onClick={() => handleSupplierClick(supplier)}
                >
                  <td className="px-5 py-4">
                    <span className="block text-sm font-medium text-[#1a1c1b] dark:text-white">
                      {formatDate(supplier.createdAt)}
                    </span>
                    <span className="block text-xs text-[#817563]">
                      {formatTime(supplier.createdAt)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="block text-sm font-semibold text-[#1a1c1b] dark:text-white">
                      {supplier.fullname || 'N/A'}
                    </span>
                    {supplier.shopName && (
                      <span className="inline-block text-xs font-medium text-[#785600] dark:text-amber-400">
                        {supplier.shopName}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="block text-sm text-[#4f4535] dark:text-slate-300">
                      {supplier.phoneNumber || 'N/A'}
                    </span>
                    {supplier.city && (
                      <span className="block text-xs text-[#817563]">
                        {supplier.city}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-0.5 text-xs">
                      {supplier.GST ? (
                        <p className="text-[#4f4535] dark:text-slate-300">
                          GST: <span className="font-medium">{supplier.GST}</span>
                        </p>
                      ) : null}
                      {supplier.PAN ? (
                        <p className="text-[#4f4535] dark:text-slate-300">
                          PAN: <span className="font-medium">{supplier.PAN}</span>
                        </p>
                      ) : null}
                      {!supplier.GST && !supplier.PAN && (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className="block max-w-[200px] truncate text-sm text-[#4f4535] dark:text-slate-300"
                      title={supplier.address}
                    >
                      {supplier.address || '—'}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
                      ₹{supplier.due?.toLocaleString() || 0}
                    </span>
                  </td>

                  {canEdit && (
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => handleEditSupplier(supplier, e)}
                          className="rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-amber-400"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(supplier, e)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!isLoading && paginatedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#4f4535] dark:text-slate-400">
                    No suppliers found. Click "Add Supplier" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > itemsPerPage && (
          <div className="flex flex-col justify-between gap-4 border-t border-[#d3c4af]/10 p-5 sm:flex-row sm:items-center dark:border-slate-800">
            <span className="text-xs text-[#4f4535] dark:text-slate-400">
              Showing {startIdx + 1} to {Math.min(endIdx, totalItems)} of {totalItems} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3c4af]/30 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-[#1a1c1b] dark:text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3c4af]/30 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {canEdit && (
        <AddSupplier
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          onSave={() => refetch()}
        />
      )}

      {/* Edit Supplier Modal */}
      {canEdit && (
        <EditSupplier
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          supplierId={selectedSupplierId}
          supplierData={selectedSupplierData}
          onSuccess={() => refetch()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && !showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-[#4f4535] dark:text-slate-300">
              Are you sure you want to delete supplier{' '}
              <span className="font-semibold text-red-600">{itemToDelete.fullname}</span>? This action cannot be undone.
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
                disabled={deleteSupplierMutation.isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 font-medium text-white shadow-md shadow-red-600/20 transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteSupplierMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDirectory;
