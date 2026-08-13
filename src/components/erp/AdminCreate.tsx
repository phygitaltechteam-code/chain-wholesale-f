import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Eye, EyeOff, ShieldCheck, Key, User, Phone, Mail, MapPin } from 'lucide-react';
import { useGetAdmins, useCreateAdmin, useUpdateAdmin, useDeleteAdmin, getAdminByIdApi, AdminPayload } from '@/lib/api/admin';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';
import toast from 'react-hot-toast';

export interface AdminItem {
  id: string;
  userId?: string;
  fullname: string;
  email: string;
  username: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  address: string;
  accessType: 'ONLINE' | 'OFFLINE' | string;
  expiryDate?: string;
  rawExpiryDate?: string;
  key?: string;
  role?: string;
  createdAt?: string;
  rawItem?: any;
}

const formatForDatetimeLocal = (isoString?: string) => {
  if (!isoString) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
};

const AdminCreate: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);

  // Form state according to exact API requirements
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    address: '',
    accessType: 'ONLINE',
    expiryDate: new Date().toISOString().slice(0, 16).replace('T', ' ') + ':00',
    key: '12345',
    role: 'ADMIN',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // API Hooks
  const { data: adminsData, isLoading } = useGetAdmins();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();

  // Safely extract items array from response object { statusCode, status, data: [...] }
  const rawList = Array.isArray(adminsData)
    ? adminsData
    : Array.isArray(adminsData?.data)
      ? adminsData.data
      : [];

  const adminsList: AdminItem[] = rawList.map((item: any, idx: number) => {
    const userObj = item.user || {};
    return {
      id: item.id || `admin-${idx}`,
      userId: item.userId || userObj.id || item.id,
      fullname: userObj.fullname || userObj.name || item.fullname || item.fullName || 'N/A',
      email: userObj.email || item.contactPersonEmail || item.email || '',
      username: userObj.username || userObj.phoneNumber || item.phoneNumber || 'N/A',
      phoneNumber: userObj.phoneNumber || userObj.phone || item.phoneNumber || 'N/A',
      secondaryPhoneNumber: userObj.secondaryPhoneNumber || item.contactPersonNumber || item.secondaryPhoneNumber || '',
      address: item?.user?.address,
      accessType: (item.accessType || 'ONLINE').toUpperCase(),
      rawExpiryDate: item.expiryDate || item.expiryDateTime || '',
      expiryDate: item.expiryDate
        ? new Date(item.expiryDate).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        : '',
      key: item.key || item.offlineKey || '',
      role: userObj.role || item.role || 'ADMIN',
      createdAt: item.createdAt || '',
      rawItem: item,
    };
  });

  // Filter admins by search term
  const filteredAdmins = adminsList.filter((admin) => {
    const query = searchTerm.toLowerCase();
    return (
      admin.fullname.toLowerCase().includes(query) ||
      admin.email.toLowerCase().includes(query) ||
      admin.username.toLowerCase().includes(query) ||
      admin.phoneNumber.includes(query) ||
      admin.address.toLowerCase().includes(query) ||
      admin.accessType.toLowerCase().includes(query)
    );
  });

  // Generate random key for offline access
  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newKey = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) newKey += '-';
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return newKey;
  };

  const handleOpenCreateModal = () => {
    setEditingAdmin(null);
    setFormData({
      fullname: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      secondaryPhoneNumber: '',
      address: '',
      accessType: 'ONLINE',
      expiryDate: new Date().toISOString().slice(0, 16).replace('T', ' ') + ':00',
      key: '12345',
      role: 'ADMIN',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (admin: AdminItem) => {
    setEditingAdmin(admin);
    setIsModalOpen(true);

    const raw = admin.rawItem || {};
    const userObj = raw.user || {};

    const emailVal = userObj.email || raw.email || raw.contactPersonEmail || admin.email || '';
    const secPhoneVal =
      userObj.secondaryPhoneNumber ||
      userObj.secondazyPhoneNumber ||
      raw.secondaryPhoneNumber ||
      raw.secondazyPhoneNumber ||
      raw.contactPersonNumber ||
      admin.secondaryPhoneNumber ||
      '';
    const addressVal =
      userObj.address ||
      raw.address ||
      raw.city ||
      userObj.city ||
      (admin.address !== 'N/A' ? admin.address : '');
    const rawExpiry = raw.expiryDate || admin.rawExpiryDate || admin.expiryDate;

    setFormData({
      fullname: admin.fullname !== 'N/A' ? admin.fullname : '',
      email: emailVal,
      username: admin.username !== 'N/A' ? admin.username : admin.phoneNumber,
      password: '',
      confirmPassword: '',
      phoneNumber: admin.phoneNumber !== 'N/A' ? admin.phoneNumber : '',
      secondaryPhoneNumber: secPhoneVal,
      address: addressVal,
      accessType: (admin.accessType || 'ONLINE').toUpperCase(),
      expiryDate: formatForDatetimeLocal(rawExpiry).replace('T', ' ') + ':00',
      key: admin.key || '12345',
      role: admin.role || 'ADMIN',
    });
    setErrors({});

    try {
      const targetId = admin.id || admin.userId;
      if (targetId) {
        const fullData = await getAdminByIdApi(targetId);
        if (fullData) {
          const u = fullData.user || fullData;
          setFormData((prev) => ({
            ...prev,
            fullname: u.fullname || u.name || prev.fullname,
            email: u.email || fullData.email || fullData.contactPersonEmail || prev.email,
            username: u.username || u.phoneNumber || prev.username,
            phoneNumber: u.phoneNumber || u.phone || prev.phoneNumber,
            secondaryPhoneNumber:
              u.secondaryPhoneNumber ||
              u.secondazyPhoneNumber ||
              fullData.secondaryPhoneNumber ||
              fullData.secondazyPhoneNumber ||
              fullData.contactPersonNumber ||
              prev.secondaryPhoneNumber,
            address: fullData.address || fullData.city || u.address || u.city || prev.address,
            accessType: (fullData.accessType || u.accessType || prev.accessType).toUpperCase(),
            expiryDate: fullData.expiryDate
              ? formatForDatetimeLocal(fullData.expiryDate).replace('T', ' ') + ':00'
              : prev.expiryDate,
            key: fullData.key || prev.key,
            role: u.role || prev.role,
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch single admin details by ID:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-set username to phoneNumber if username is empty or matches previous phoneNumber
      if (name === 'phoneNumber' && (!prev.username || prev.username === prev.phoneNumber)) {
        updated.username = value;
      }
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAccessTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      accessType: value,
      key: value === 'ONLINE' ? '12345' : prev.key === '12345' ? generateKey() : prev.key,
    }));
    if (errors.accessType) {
      setErrors((prev) => ({ ...prev, accessType: '' }));
    }
  };

  const handleGenerateKey = () => {
    const newKey = generateKey();
    setFormData((prev) => ({ ...prev, key: newKey }));
    toast.success('Offline access key generated!');
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    if (formData.secondaryPhoneNumber.trim() && !/^\d{10}$/.test(formData.secondaryPhoneNumber.trim())) {
      newErrors.secondaryPhoneNumber = 'Secondary phone number must be 10 digits';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!editingAdmin) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.accessType === 'OFFLINE' && !formData.key) {
      newErrors.key = 'Please generate an offline key';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix all errors');
      return;
    }

    // Format expiry date to YYYY-MM-DD HH:mm:ss if provided
    let formattedExpiry = formData.expiryDate;
    if (formattedExpiry && formattedExpiry.includes('T')) {
      formattedExpiry = formattedExpiry.replace('T', ' ');
      if (formattedExpiry.length === 16) {
        formattedExpiry += ':00';
      }
    }

    const payload: AdminPayload = {
      fullname: formData.fullname.trim(),
      email: formData.email.trim(),
      username: formData.username.trim() || formData.phoneNumber.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      secondaryPhoneNumber: formData.secondaryPhoneNumber.trim() || undefined,
      address: formData.address.trim(),
      accessType: formData.accessType.toUpperCase(),
      expiryDate: formData.accessType === 'ONLINE' ? formattedExpiry : undefined,
      key: formData.accessType === 'OFFLINE' ? formData.key : '12345',
      role: formData.role || 'ADMIN',
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (editingAdmin) {
        await updateAdmin.mutateAsync({ id: editingAdmin.id, data: payload });
      } else {
        await createAdmin.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Submit Admin Error:', err);
    }
  };

  const handleDelete = async (admin: AdminItem) => {
    if (!window.confirm(`Are you sure you want to delete admin "${admin.fullname}"?`)) {
      return;
    }
    try {
      await deleteAdmin.mutateAsync(admin.id);
    } catch (err: any) {
      console.error('Delete Admin Error:', err);
    }
  };

  // Table Columns Definition
  const columns: Column<AdminItem>[] = [
    {
      key: 'fullname',
      header: 'Admin Details',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
            {item.fullname}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {item.email}
          </span>
        </div>
      ),
    },
    {
      key: 'username',
      header: 'Username / Phone',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
            {item.phoneNumber}
          </span>
          {item.secondaryPhoneNumber && (
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              Sec: {item.secondaryPhoneNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white truncate max-w-[180px] block">
          {item.address}
        </span>
      ),
    },
    {
      key: 'accessType',
      header: 'Access Type',
      render: (item) => {
        const typeUpper = (item.accessType || 'ONLINE').toUpperCase();
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${typeUpper === 'OFFLINE'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
              : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'
              }`}
          >
            {typeUpper === 'OFFLINE' ? <Key className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            {typeUpper}
          </span>
        );
      },
    },
    {
      key: 'expiryDate',
      header: 'Expiry / Key',
      render: (item) => {
        const typeUpper = (item.accessType || 'ONLINE').toUpperCase();
        if (typeUpper === 'OFFLINE') {
          return (
            <span className="text-xs font-mono bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded border border-gray-200 dark:border-slate-700">
              {item.key || '12345'}
            </span>
          );
        }
        return (
          <span className="text-xs font-mono text-[#1a1c1b] dark:text-white">
            {item.expiryDate ? item.expiryDate : 'Unlimited'}
          </span>
        );
      },
    },
  ];

  const renderActions = (item: AdminItem) => (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenEditModal(item);
        }}
        className="rounded-lg p-1.5 text-[#785600] hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20 transition-colors"
        title="Edit Admin"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(item);
        }}
        disabled={deleteAdmin.isPending}
        className="rounded-lg p-1.5 text-[#785600] hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20 transition-colors"
        title="Delete Admin"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950 min-h-screen">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 mx-auto">
        {/* Page Header with Right Side Add Admin Button */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <PageHeader title="Admin Management" />
          <GenericButton type="button" onClick={handleOpenCreateModal} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span>Add Admin</span>
          </GenericButton>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search by name, email, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
          </div>
        </div>

        {/* Admins Table */}
        <GenericTable<AdminItem>
          data={filteredAdmins}
          columns={columns}
          emptyMessage="No admin accounts found."
          isLoading={isLoading}
          renderActions={renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
        />
      </div>

      {/* Modal for Add / Edit Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#d3c4af]/20 dark:border-slate-700 shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
                  {editingAdmin ? 'Edit Admin Account' : 'Create New Admin'}
                </h2>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">
                  {editingAdmin
                    ? 'Update admin details and access parameters'
                    : 'Fill in admin details to register a new admin'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Full Name (fullname) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 ${errors.fullname ? 'border-red-500 focus:ring-red-500/20' : ''
                      }`}
                  />
                  {errors.fullname && <p className="mt-1 text-xs text-red-500">{errors.fullname}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@example.com"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 ${errors.email ? 'border-red-500 focus:ring-red-500/20' : ''
                      }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>

              {/* Row 2: Phone Number & Secondary Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Phone Number (phoneNumber) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500/20' : ''
                      }`}
                  />
                  {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Secondary Phone (secondaryPhoneNumber)
                  </label>
                  <input
                    type="text"
                    name="secondaryPhoneNumber"
                    value={formData.secondaryPhoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter secondary phone number"
                    maxLength={10}
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 ${errors.secondaryPhoneNumber ? 'border-red-500 focus:ring-red-500/20' : ''
                      }`}
                  />
                  {errors.secondaryPhoneNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.secondaryPhoneNumber}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Username & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username (defaults to phone)"
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. Baner, Pune"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 ${errors.address ? 'border-red-500 focus:ring-red-500/20' : ''
                      }`}
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                </div>
              </div>

              {/* Row 4: Access Type & Expiry/Key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Access Type (accessType) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="accessType"
                    value={formData.accessType}
                    onChange={handleAccessTypeChange}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>

                {formData.accessType === 'ONLINE' ? (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      Expiry Date & Time (expiryDate)
                    </label>
                    <input
                      type="datetime-local"
                      name="expiryDate"
                      value={formData.expiryDate.slice(0, 16).replace(' ', 'T')}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          expiryDate: e.target.value.replace('T', ' ') + ':00',
                        }))
                      }
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      Offline Key (key) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="key"
                        value={formData.key}
                        onChange={handleInputChange}
                        placeholder="Offline key"
                        className="flex-1 rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-xs font-mono text-[#1a1c1b] dark:bg-slate-800 dark:text-white dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateKey}
                        className="px-3 py-2 bg-[#785600] text-white rounded-lg hover:bg-[#5d4200] transition-colors text-xs font-medium"
                      >
                        Generate
                      </button>
                    </div>
                    {errors.key && <p className="mt-1 text-xs text-red-500">{errors.key}</p>}
                  </div>
                )}
              </div>

              {/* Row 5: Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Password {editingAdmin ? '(Leave blank to keep unchanged)' : <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={editingAdmin ? '••••••••' : 'Pass@123'}
                      className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 pr-10 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 ${errors.password ? 'border-red-500' : ''
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] hover:text-[#785600]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                {!editingAdmin && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 pr-10 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 ${errors.confirmPassword ? 'border-red-500' : ''
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] hover:text-[#785600]"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-3 pt-4 border-t justify-end border-gray-100 dark:border-slate-800">
                <GenericButton
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="!px-5"
                >
                  Cancel
                </GenericButton>
                <GenericButton
                  type="submit"
                  disabled={createAdmin.isPending || updateAdmin.isPending}
                  variant="primary"
                  className="!px-5"
                >
                  {createAdmin.isPending || updateAdmin.isPending
                    ? 'Saving...'
                    : editingAdmin
                      ? 'Update Admin'
                      : 'Create Admin'}
                </GenericButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreate;