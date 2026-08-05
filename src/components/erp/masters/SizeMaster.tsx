import React, { useState } from 'react';
import { Plus, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { useNavigate } from '@tanstack/react-router';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { z } from 'zod';
import {
  Size,
  SizeSchema,
  useCreateSize,
  useDeleteSize,
  useGetSizes,
  useUpdateSize,
} from '@/lib/api/sizes';

const SizeMaster: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [formData, setFormData] = useState({
    size: '',
  });
  const [formErrors, setFormErrors] = useState<{ size?: string }>({});

  // React Query hooks
  const { data: sizes = [], isLoading, refetch } = useGetSizes();
  const createSize = useCreateSize();
  const updateSize = useUpdateSize();
  const deleteSize = useDeleteSize();

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : sanitized;

    setFormData((prev) => ({ ...prev, [name]: formatted }));
    if (formErrors.size) {
      setFormErrors({});
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      SizeSchema.parse({ size: formData.size.trim() });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { size?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'size') {
            errors.size = err.message;
          }
        });
        setFormErrors(errors);
        toast.error(errors.size || 'Please fix the errors');
      }
      return false;
    }
  };

  // Handle add new size
  const handleAddSize = async () => {
    if (!validateForm()) return;
    try {
      await createSize.mutateAsync({ size: formData.size.trim() });
      resetForm();
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle edit size
  const handleEditSize = async () => {
    if (!editingSize) return;
    if (!validateForm()) return;

    try {
      await updateSize.mutateAsync({
        id: editingSize.id,
        data: { size: formData.size.trim() },
      });
      resetForm();
      setIsModalOpen(false);
      setEditingSize(null);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle delete size
  const handleDeleteSize = async (item: Size) => {
    if (window.confirm(`Are you sure you want to delete size "${item.size}"?`)) {
      try {
        await deleteSize.mutateAsync(item.id);
        refetch();
      } catch (error) {
        // Error handled in mutation
      }
    }
  };

  // Handle edit button click
  const handleEditClick = (item: Size) => {
    setEditingSize(item);
    setFormData({ size: item.size });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ size: '' });
    setFormErrors({});
    setEditingSize(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Table columns
  const columns: Column<Size>[] = [
    {
      key: 'size',
      header: 'Size',
      align: 'left',
      className: 'font-medium',
      render: (item) => (
        <span className="text-xs sm:text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.size}
        </span>
      ),
    },
  ];

  const isSubmitting = createSize.isPending || updateSize.isPending || deleteSize.isPending;

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header - Back Button, Title, and Add Button on Same Line */}
      <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          {/* Left side - Back button and Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate({ to: '/Stocks/stockpage' })}
              className="flex items-center gap-1 text-[#785600] hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-medium">Back</span>
            </button>
            <div className="h-5 w-px bg-[#d3c4af]/30 dark:bg-slate-600 flex-shrink-0" />
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#1a1c1b] dark:text-white truncate">
              Size Master
            </h1>
          </div>

          {/* Right side - Add Size Button */}
          <GenericButton
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 !px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !bg-amber-600 hover:!bg-amber-700 !text-white whitespace-nowrap shadow-sm hover:shadow-md transition-all flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Add Size</span>
            <span className="xs:hidden">Add</span>
          </GenericButton>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 pb-4">


        {/* Sizes Table - Full width */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={sizes}
            showSrNo={true}
            columns={columns}
            searchFields={['size']}
            searchPlaceholder="Search by size..."
            onSave={(item) => {
              console.log('Save size:', item);
            }}
            onEdit={handleEditClick}
            onDelete={handleDeleteSize}
            showEdit={true}
            showDelete={true}
            emptyMessage="No sizes found. Click 'Add Size' to create one."
            isLoading={isLoading || isSubmitting}
          />
        </div>
      </div>

      {/* Add/Edit Modal - Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-[95%] sm:max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/10 p-3 sm:p-4 dark:border-slate-700">
              <h3 className="text-base sm:text-lg font-bold text-[#1a1c1b] dark:text-white">
                {editingSize ? 'Edit Size' : 'Add New Size'}
              </h3>
              <GenericButton
                type="button"
                variant="ghost"
                onClick={closeModal}
                className="!p-1 !h-8 !w-8 !min-w-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-[#4f4535] dark:text-slate-400" />
              </GenericButton>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
              <div>
                <label className="mb-1 block text-[9px] sm:text-[10px] font-bold uppercase text-[#4f4535] dark:text-slate-400">
                  Size <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="e.g., 16, 18.5, 20"
                  className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${formErrors.size ? 'ring-2 ring-red-500' : ''
                    }`}
                  autoFocus
                />
                {formErrors.size && (
                  <p className="mt-1 text-[10px] sm:text-xs text-red-500">{formErrors.size}</p>
                )}
                <p className="mt-1 text-[8px] sm:text-[10px] text-[#4f4535]/60 dark:text-slate-500">
                  Enter decimal numbers only (e.g., 16, 16.5, 0.5)
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-[#d3c4af]/10 p-3 sm:p-4 dark:border-slate-700">
              <GenericButton
                type="button"
                onClick={editingSize ? handleEditSize : handleAddSize}
                disabled={isSubmitting}
                className="!px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !bg-amber-600 hover:!bg-amber-700 !text-white"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingSize
                    ? 'Update Size'
                    : 'Add Size'}
              </GenericButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizeMaster;