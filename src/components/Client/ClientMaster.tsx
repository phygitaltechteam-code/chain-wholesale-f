import React, { useState, useEffect } from 'react';
import { Plus, X, ArrowLeft, Edit, Trash2, Save, Search } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { z } from 'zod';
import { useGetClients, useCreateClient, useUpdateClient, useDeleteClient, Client, } from '@/lib/api/client';

// Client Schema for validation
const ClientSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits"),
    address: z.string().min(1, "Address is required"),
    openingBalance: z.number().min(0, "Opening balance cannot be negative"),
});

type ClientFormData = z.infer<typeof ClientSchema>;

const ClientMaster: React.FC = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        address: '',
        openingBalance: '',
    });
    const [formErrors, setFormErrors] = useState<{
        fullName?: string;
        phoneNumber?: string;
        address?: string;
        openingBalance?: string;
    }>({});

    // React Query hooks
    const { data: clients = [], isLoading, refetch } = useGetClients();
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const deleteClient = useDeleteClient();

    // Filter clients based on search term
    const filteredClients = searchTerm
        ? clients.filter((client: Client) =>
            client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phoneNumber?.includes(searchTerm) ||
            client.address?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : clients;

    // Handle form input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'openingBalance') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            const parts = sanitized.split('.');
            const formatted = parts.length > 2
                ? `${parts[0]}.${parts.slice(1).join('')}`
                : sanitized;
            setFormData((prev) => ({ ...prev, [name]: formatted }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    // Validate form data
    const validateForm = (): boolean => {
        try {
            ClientSchema.parse({
                fullName: formData.fullName.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                address: formData.address.trim(),
                openingBalance: parseFloat(formData.openingBalance) || 0,
            });
            setFormErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: any = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        errors[err.path[0]] = err.message;
                    }
                });
                setFormErrors(errors);
                toast.error(errors[Object.keys(errors)[0]] || 'Please fix the errors');
            }
            return false;
        }
    };

    // Handle add new client
    const handleAddClient = async () => {
        if (!validateForm()) return;

        try {
            await createClient.mutateAsync({
                fullName: formData.fullName.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                address: formData.address.trim(),
                openingBalance: parseFloat(formData.openingBalance) || 0,
            });
            resetForm();
            setIsModalOpen(false);
            refetch();
        } catch (error) {
            // Error handled in mutation
        }
    };

    // Handle edit client
    const handleEditClient = async () => {
        if (!editingClient) return;
        if (!validateForm()) return;

        try {
            await updateClient.mutateAsync({
                id: editingClient.id,
                data: {
                    fullName: formData.fullName.trim(),
                    phoneNumber: formData.phoneNumber.trim(),
                    address: formData.address.trim(),
                    openingBalance: parseFloat(formData.openingBalance) || 0,
                },
            });
            resetForm();
            setIsModalOpen(false);
            setEditingClient(null);
            refetch();
        } catch (error) {
            // Error handled in mutation
        }
    };

    // Handle delete client
    const handleDeleteClient = async (client: Client) => {
        if (window.confirm(`Are you sure you want to delete "${client.fullName}"?`)) {
            try {
                await deleteClient.mutateAsync(client.id);
                refetch();
            } catch (error) {
                // Error handled in mutation
            }
        }
    };

    // Handle edit button click
    const handleEditClick = (client: Client) => {
        setEditingClient(client);
        setFormData({
            fullName: client.fullName || '',
            phoneNumber: client.phoneNumber || '',
            address: client.address || '',
            openingBalance: client.openingBalance?.toString() || '',
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            fullName: '',
            phoneNumber: '',
            address: '',
            openingBalance: '',
        });
        setFormErrors({});
        setEditingClient(null);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    // Format number
    const formatNumber = (value: number) => {
        if (value === 0 || !value) return '0';
        const str = value.toString();
        if (str.includes('.')) {
            return str.replace(/\.?0+$/, '');
        }
        return str;
    };

    // Table columns
    const columns: Column<Client>[] = [
        {
            key: 'fullName',
            header: 'Name',
            render: (item) => (
                <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                    {item.fullName}
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
            key: 'address',
            header: 'Address',
            render: (item) => (
                <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {item.address}
                </span>
            ),
        },
        {
            key: 'openingBalance',
            header: 'Opening Balance (G)',
            render: (item) => (
                <span className="text-sm text-[#1a1c1b] dark:text-white">
                    {formatNumber(item.openingBalance)}
                </span>
            ),
        },
    ];

    // Custom actions renderer
    const renderActions = (item: Client, index: number) => (
        <div className="flex items-center justify-center gap-2">
            <button
                onClick={() => handleEditClick(item)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:bg-[#785600]/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
                title="Edit"
            >
                <Edit className="h-4 w-4" />
            </button>
            <button
                onClick={() => handleDeleteClient(item)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:bg-[#785600]/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
                title="Delete"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );

    const isSubmitting = createClient.isPending || updateClient.isPending || deleteClient.isPending;

    return (
        <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 gap-3">
                    {/* Left side - Back button and Title */}
                    <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                        <div className="h-5 w-px bg-[#d3c4af]/30 dark:bg-slate-600 flex-shrink-0" />
                        <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
                            Client Master
                        </h2>
                    </div>

                    {/* Right side - Search and Add Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                            <input
                                type="text"
                                placeholder="Search by name, phone or address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                            />
                        </div>

                        {/* Add Button */}
                        <GenericButton
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-1.5 !px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !bg-amber-600 hover:!bg-amber-700 !text-white whitespace-nowrap"
                        >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Add Client</span>
                            <span className="xs:hidden">Add</span>
                        </GenericButton>
                    </div>
                </div>
            </div>

            <div className="px-3 sm:px-4 md:px-6 pb-4">
                {/* Table */}
                <div className="-mx-3 sm:-mx-4 md:mx-0">
                    <GenericTable
                        data={filteredClients}
                        columns={columns}
                        onSave={(item) => console.log('Save:', item)}
                        emptyMessage="No clients found. Click 'Add Client' to create one."
                        isLoading={isLoading || isSubmitting}
                        renderActions={renderActions}
                        showSrNo={true}
                        srNoLabel="Sr No."
                    />
                </div>

                {/* Footer */}
                {clients.length > 0 && (
                    <div className="mt-3 flex items-center justify-end border-t border-[#d3c4af]/10 pt-3 text-xs text-[#4f4535] dark:border-slate-700 dark:text-slate-400">
                        <span className="font-medium text-[#785600] dark:text-[#986d00]">
                            Total Clients: {clients.length}
                        </span>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
                    <div className="w-full max-w-[95%] sm:max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-[#d3c4af]/10 p-3 sm:p-4 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <h3 className="text-base sm:text-lg font-bold text-[#1a1c1b] dark:text-white">
                                {editingClient ? 'Edit Client' : 'Add New Client'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-4 p-3 sm:p-4">
                            {/* Name */}
                            <div>
                                <label className="mb-1 block text-[9px] sm:text-[10px] font-bold uppercase text-[#4f4535] dark:text-slate-400">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter client name"
                                    className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${formErrors.fullName ? 'ring-2 ring-red-500' : ''
                                        }`}
                                    autoFocus
                                />
                                {formErrors.fullName && (
                                    <p className="mt-1 text-[10px] sm:text-xs text-red-500">{formErrors.fullName}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-1 block text-[9px] sm:text-[10px] font-bold uppercase text-[#4f4535] dark:text-slate-400">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                    className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white ${formErrors.phoneNumber ? 'ring-2 ring-red-500' : ''
                                        }`}
                                />
                                {formErrors.phoneNumber && (
                                    <p className="mt-1 text-[10px] sm:text-xs text-red-500">{formErrors.phoneNumber}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="mb-1 block text-[9px] sm:text-[10px] font-bold uppercase text-[#4f4535] dark:text-slate-400">
                                    Address <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter address"
                                    rows={3}
                                    className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white resize-none ${formErrors.address ? 'ring-2 ring-red-500' : ''
                                        }`}
                                />
                                {formErrors.address && (
                                    <p className="mt-1 text-[10px] sm:text-xs text-red-500">{formErrors.address}</p>
                                )}
                            </div>

                            {/* Opening Balance */}
                            <div>
                                <label className="mb-1 block text-[9px] sm:text-[10px] font-bold uppercase text-[#4f4535] dark:text-slate-400">
                                    Opening Balance (G) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="openingBalance"
                                    value={formData.openingBalance}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 50.5"
                                    className={`w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white font-mono ${formErrors.openingBalance ? 'ring-2 ring-red-500' : ''
                                        }`}
                                />
                                {formErrors.openingBalance && (
                                    <p className="mt-1 text-[10px] sm:text-xs text-red-500">{formErrors.openingBalance}</p>
                                )}
                                <p className="mt-1 text-[8px] sm:text-[10px] text-[#4f4535]/60 dark:text-slate-500">
                                    Enter opening balance in grams
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-[#d3c4af]/10 p-3 sm:p-4 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-900">
                            <button
                                onClick={closeModal}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <GenericButton
                                type="button"
                                onClick={editingClient ? handleEditClient : handleAddClient}
                                disabled={isSubmitting}
                                className="!px-4 !py-2 !text-sm !bg-amber-600 hover:!bg-amber-700 !text-white"
                            >
                                {isSubmitting
                                    ? 'Saving...'
                                    : editingClient
                                        ? 'Update Client'
                                        : 'Add Client'}
                            </GenericButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientMaster;