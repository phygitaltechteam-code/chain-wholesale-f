import React, { useState } from 'react';
import { Plus, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useNavigate } from '@tanstack/react-router';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import {
  useGetItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  Item,
  ItemSchema
} from '@/lib/api/items';
import { z } from 'zod';

const ItemMaster: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  // React Query hooks
  const { data: items = [], isLoading, refetch } = useGetItems();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors.name) {
      setFormErrors({});
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      ItemSchema.parse({ name: formData.name.trim() });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { name?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'name') {
            errors.name = err.message;
          }
        });
        setFormErrors(errors);
        toast.error(errors.name || 'Please fix the errors');
      }
      return false;
    }
  };

  // Handle add new item
  const handleAddItem = async () => {
    if (!validateForm()) return;
    try {
      await createItem.mutateAsync({ name: formData.name.trim() });
      resetForm();
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle edit item
  const handleEditItem = async () => {
    if (!editingItem) return;
    if (!validateForm()) return;

    try {
      await updateItem.mutateAsync({
        id: editingItem.id,
        data: { name: formData.name.trim() },
      });
      resetForm();
      setIsModalOpen(false);
      setEditingItem(null);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle delete item
  const handleDeleteItem = async (item: Item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteItem.mutateAsync(item.id);
        refetch();
      } catch (error) {
        // Error handled in mutation
      }
    }
  };

  // Handle edit button click
  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setFormData({ name: item.name });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '' });
    setFormErrors({});
    setEditingItem(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Table columns
  const columns: Column<Item>[] = [
    {
      key: 'name',
      header: 'Item Name',
      align: 'left',
      className: 'font-medium',
      render: (item) => (
        <span className="text-xs sm:text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.name}
        </span>
      ),
    },
  ];

  const isSubmitting = createItem.isPending || updateItem.isPending || deleteItem.isPending;

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
              Item Master
            </h1>
          </div>

          {/* Right side - Add Item Button */}
          <GenericButton
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 !px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !bg-amber-600 hover:!bg-amber-700 !text-white whitespace-nowrap shadow-sm hover:shadow-md transition-all flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Add Item</span>
            <span className="xs:hidden">Add</span>
          </GenericButton>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 pb-4">
        {/* Items Table - Full width */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            showSrNo={true}
            data={items}
            columns={columns}
            searchFields={['name']}
            searchPlaceholder="Search by item name..."
            onSave={(item) => {
              console.log('Save item:', item);
            }}
            onEdit={handleEditClick}
            onDelete={handleDeleteItem}
            showEdit={true}
            showDelete={true}
            emptyMessage="No items found. Click 'Add Item' to create one."
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
                {editingItem ? 'Edit Item' : 'Add New Item'}
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
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Chain, Bracelet, Necklace"
                  className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${formErrors.name ? 'ring-2 ring-red-500' : ''
                    }`}
                  autoFocus
                />
                {formErrors.name && (
                  <p className="mt-1 text-[10px] sm:text-xs text-red-500">{formErrors.name}</p>
                )}
                <p className="mt-1 text-[8px] sm:text-[10px] text-[#4f4535]/60 dark:text-slate-500">
                  Minimum 3 characters required
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-[#d3c4af]/10 p-3 sm:p-4 dark:border-slate-700">
              <GenericButton
                type="button"
                onClick={editingItem ? handleEditItem : handleAddItem}
                disabled={isSubmitting}
                className="!px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !bg-amber-600 hover:!bg-amber-700 !text-white"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingItem
                    ? 'Update Item'
                    : 'Add Item'}
              </GenericButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemMaster;