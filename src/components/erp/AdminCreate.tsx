import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Key,
  MapPin,
  Sparkles,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  useGetAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  getAdminByIdApi,
  AdminPayload,
} from '@/lib/api/admin';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';
import toast from 'react-hot-toast';

export interface AdminItem {
  id: string;
  userId?: string;
  fullname: string;
  shopName: string;
  email: string;
  username: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
  address: string;
  accessType: 'ONLINE' | 'OFFLINE' | 'TRAIL' | 'TRIAL' | string;
  price?: string | number;
  renewalCharges?: string | number;
  expiryDate?: string;
  rawExpiryDate?: string;
  isExpired?: boolean;
  key?: string;
  role?: string;
  createdAt?: string;
  rawItem?: any;
}

// Calculate default expiry date: 7 days for TRAIL/TRIAL, 1 year for ONLINE/OFFLINE
const calculateDefaultExpiry = (type: string): string => {
  const d = new Date();
  const upperType = (type || 'ONLINE').toUpperCase();
  if (upperType === 'TRAIL' || upperType === 'TRIAL') {
    d.setDate(d.getDate() + 7);
  } else {
    d.setFullYear(d.getFullYear() + 1);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

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

const formatDisplayDateTime = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const AdminCreate: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedTab, setSelectedTab] = useState<
    'ALL' | 'ONLINE' | 'OFFLINE' | 'TRAIL' | 'EXPIRED'
  >('ALL');

  // Sorting state for Create Date & Expiry Date
  const [sortField, setSortField] = useState<'createdAt' | 'expiryDate' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullname: '',
    shopName: '',
    email: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    username: '',
    password: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
    address: '',
    accessType: 'ONLINE',
    price: '',
    renewalCharges: '',
    expiryDate: calculateDefaultExpiry('ONLINE'),
    key: '12345',
    role: 'ADMIN',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  // API Hooks
  const { data: adminsData, isLoading } = useGetAdmins();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();

  // Safely extract items array from response object
  const rawList = Array.isArray(adminsData)
    ? adminsData
    : Array.isArray(adminsData?.data)
      ? adminsData.data
      : [];

  const adminsList: AdminItem[] = useMemo(() => {
    const now = Date.now();
    return rawList.map((item: any, idx: number) => {
      const userObj = item.user || {};
      const rawExp =
        item.expiryDate ||
        userObj.expiryDate ||
        item.expiryDateTime ||
        userObj.expiryDateTime ||
        '';
      const expTime = rawExp ? new Date(rawExp).getTime() : NaN;
      const isExpired = !isNaN(expTime) && expTime < now;

      const shopNameVal =
        item.shopName ||
        userObj.shopName ||
        item.storeName ||
        userObj.storeName ||
        item.businessName ||
        userObj.businessName ||
        '';

      const cityVal =
        item.city ||
        userObj.city ||
        item.district ||
        userObj.district ||
        (item.address && item.address.includes(',')
          ? item.address.split(',').pop()?.trim()
          : item.address) ||
        '';

      return {
        id: item.id || `admin-${idx}`,
        userId: item.userId || userObj.id || item.id,
        fullname:
          userObj.fullname ||
          userObj.name ||
          item.fullname ||
          item.fullName ||
          'N/A',
        shopName: shopNameVal || 'N/A',
        email: userObj.email || item.contactPersonEmail || item.email || '',
        username:
          userObj.username || userObj.phoneNumber || item.phoneNumber || 'N/A',
        phoneNumber:
          userObj.phoneNumber || userObj.phone || item.phoneNumber || 'N/A',
        secondaryPhoneNumber:
          userObj.secondaryPhoneNumber ||
          userObj.secondazyPhoneNumber ||
          item.contactPersonNumber ||
          item.secondaryPhoneNumber ||
          '',
        pincode:
          item.pincode ||
          userObj.pincode ||
          item.pinCode ||
          userObj.pinCode ||
          item.postalCode ||
          '',
        city: cityVal,
        district: item.district || userObj.district || '',
        state: item.state || userObj.state || '',
        address: item.address || userObj.address || 'N/A',
        accessType: (
          item.accessType ||
          userObj.accessType ||
          'ONLINE'
        ).toUpperCase(),
        price: item.price ?? userObj.price ?? '',
        renewalCharges:
          item.renewalCharges ??
          userObj.renewalCharges ??
          item.renewalCharge ??
          userObj.renewalCharge ??
          '',
        rawExpiryDate: rawExp,
        expiryDate: rawExp ? formatDisplayDateTime(rawExp) : '',
        isExpired,
        key: item.key || item.offlineKey || '',
        role: userObj.role || item.role || 'ADMIN',
        createdAt: item.createdAt || userObj.createdAt || '',
        rawItem: item,
      };
    });
  }, [rawList]);

  // Extract unique cities for City filter dropdown
  const uniqueCities = useMemo(() => {
    const citySet = new Set<string>();
    adminsList.forEach((a) => {
      if (a.city && a.city !== 'N/A' && a.city.trim() !== '') {
        citySet.add(a.city.trim());
      }
    });
    return Array.from(citySet).sort();
  }, [adminsList]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let online = 0;
    let offline = 0;
    let trail = 0;
    let expired = 0;

    adminsList.forEach((a) => {
      const type = (a.accessType || 'ONLINE').toUpperCase();
      if (type === 'ONLINE') online++;
      if (type === 'OFFLINE') offline++;
      if (type === 'TRAIL' || type === 'TRIAL') trail++;
      if (a.isExpired) expired++;
    });

    return {
      all: adminsList.length,
      online,
      offline,
      trail,
      expired,
    };
  }, [adminsList]);

  // Filter admins by Search, City, and Tab
  const filteredAdmins = useMemo(() => {
    return adminsList.filter((admin) => {
      const query = searchTerm.toLowerCase().trim();

      // Tab filter
      if (selectedTab === 'EXPIRED') {
        if (!admin.isExpired) return false;
      } else if (selectedTab === 'ONLINE') {
        if (admin.accessType !== 'ONLINE') return false;
      } else if (selectedTab === 'OFFLINE') {
        if (admin.accessType !== 'OFFLINE') return false;
      } else if (selectedTab === 'TRAIL') {
        const t = admin.accessType.toUpperCase();
        if (t !== 'TRAIL' && t !== 'TRIAL') return false;
      }

      // City filter
      if (selectedCity !== 'ALL') {
        if (
          !admin.city ||
          admin.city.toLowerCase() !== selectedCity.toLowerCase()
        ) {
          return false;
        }
      }

      // Search query filter
      if (query) {
        const matchesShop =
          admin.shopName && admin.shopName.toLowerCase().includes(query);
        const matchesName =
          admin.fullname && admin.fullname.toLowerCase().includes(query);
        const matchesPhone =
          (admin.phoneNumber && admin.phoneNumber.includes(query)) ||
          (admin.secondaryPhoneNumber &&
            admin.secondaryPhoneNumber.includes(query));
        const matchesEmail =
          admin.email && admin.email.toLowerCase().includes(query);
        const matchesUser =
          admin.username && admin.username.toLowerCase().includes(query);
        const matchesCity =
          admin.city && admin.city.toLowerCase().includes(query);
        const matchesAddress =
          admin.address && admin.address.toLowerCase().includes(query);

        return (
          matchesShop ||
          matchesName ||
          matchesPhone ||
          matchesEmail ||
          matchesUser ||
          matchesCity ||
          matchesAddress
        );
      }

      return true;
    });
  }, [adminsList, searchTerm, selectedCity, selectedTab]);

  // Handle sorting for Create Date and Expiry Date
  const handleSort = (field: 'createdAt' | 'expiryDate') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedAdmins = useMemo(() => {
    if (!sortField) return filteredAdmins;
    return [...filteredAdmins].sort((a, b) => {
      let timeA = 0;
      let timeB = 0;
      if (sortField === 'createdAt') {
        timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (sortField === 'expiryDate') {
        const rawA = a.rawExpiryDate || a.expiryDate;
        const rawB = b.rawExpiryDate || b.expiryDate;
        timeA = rawA ? new Date(rawA).getTime() : 0;
        timeB = rawB ? new Date(rawB).getTime() : 0;
      }
      if (isNaN(timeA)) timeA = 0;
      if (isNaN(timeB)) timeB = 0;

      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [filteredAdmins, sortField, sortOrder]);

  // Lookup pincode to fetch city, district, state from India Postal API
  const handlePincodeLookup = async (pincodeVal: string) => {
    const cleanPin = pincodeVal.trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      return;
    }

    setIsPincodeLoading(true);
    try {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${cleanPin}`,
      );
      const data = response.data;
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0].Status === 'Success' &&
        Array.isArray(data[0].PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const po = data[0].PostOffice[0];
        const district = po.District || '';
        const state = po.State || '';
        const blockVal =
          po.Block && po.Block.trim().toUpperCase() !== 'NA'
            ? po.Block.trim()
            : '';
        const city = blockVal || district || po.Name || '';

        setFormData((prev) => ({
          ...prev,
          city: city,
          district: district,
          state: state,
        }));

        if (errors.pincode) {
          setErrors((prev) => ({ ...prev, pincode: '' }));
        }
        toast.success(`Location detected: ${city}, ${state}`);
      } else {
        toast.error('Invalid Pincode or no records found');
      }
    } catch (err) {
      console.warn('Pincode fetch error:', err);
    } finally {
      setIsPincodeLoading(false);
    }
  };

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
      shopName: '',
      email: '',
      phoneNumber: '',
      secondaryPhoneNumber: '',
      username: '',
      password: '',
      pincode: '',
      city: '',
      district: '',
      state: '',
      address: '',
      accessType: 'ONLINE',
      price: '',
      renewalCharges: '',
      expiryDate: calculateDefaultExpiry('ONLINE'),
      key: '12345',
      role: 'ADMIN',
    });
    setErrors({});
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (admin: AdminItem) => {
    setEditingAdmin(admin);
    setIsModalOpen(true);

    const raw = admin.rawItem || {};
    const userObj = raw.user || {};

    const emailVal =
      userObj.email || raw.email || raw.contactPersonEmail || admin.email || '';
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
      (admin.address !== 'N/A' ? admin.address : '');
    const rawExpiry = raw.expiryDate || admin.rawExpiryDate || admin.expiryDate;

    setFormData({
      fullname: admin.fullname !== 'N/A' ? admin.fullname : '',
      shopName: admin.shopName !== 'N/A' ? admin.shopName : '',
      email: emailVal,
      username: admin.username !== 'N/A' ? admin.username : admin.phoneNumber,
      password: '',
      phoneNumber: admin.phoneNumber !== 'N/A' ? admin.phoneNumber : '',
      secondaryPhoneNumber: secPhoneVal,
      pincode: admin.pincode || '',
      city: admin.city && admin.city !== 'N/A' ? admin.city : '',
      district: admin.district || '',
      state: admin.state || '',
      address: addressVal,
      accessType: (admin.accessType || 'ONLINE').toUpperCase(),
      price:
        admin.price !== undefined && admin.price !== null
          ? String(admin.price)
          : '',
      renewalCharges:
        admin.renewalCharges !== undefined && admin.renewalCharges !== null
          ? String(admin.renewalCharges)
          : '',
      expiryDate: formatForDatetimeLocal(rawExpiry).replace('T', ' ') + ':00',
      key: admin.key || '12345',
      role: admin.role || 'ADMIN',
    });
    setErrors({});
    setShowPassword(false);

    try {
      const targetId = admin.id || admin.userId;
      if (targetId) {
        const fullData = await getAdminByIdApi(targetId);
        if (fullData) {
          const u = fullData.user || fullData;
          setFormData((prev) => ({
            ...prev,
            fullname: u.fullname || u.name || prev.fullname,
            shopName:
              fullData.shopName ||
              u.shopName ||
              fullData.storeName ||
              u.storeName ||
              prev.shopName,
            email:
              u.email ||
              fullData.email ||
              fullData.contactPersonEmail ||
              prev.email,
            username: u.username || u.phoneNumber || prev.username,
            phoneNumber: u.phoneNumber || u.phone || prev.phoneNumber,
            secondaryPhoneNumber:
              u.secondaryPhoneNumber ||
              u.secondazyPhoneNumber ||
              fullData.secondaryPhoneNumber ||
              fullData.secondazyPhoneNumber ||
              fullData.contactPersonNumber ||
              prev.secondaryPhoneNumber,
            pincode:
              fullData.pincode ||
              u.pincode ||
              fullData.pinCode ||
              u.pinCode ||
              prev.pincode,
            city: fullData.city || u.city || prev.city,
            district: fullData.district || u.district || prev.district,
            state: fullData.state || u.state || prev.state,
            address: fullData.address || u.address || prev.address,
            accessType: (
              fullData.accessType ||
              u.accessType ||
              prev.accessType
            ).toUpperCase(),
            price:
              fullData.price !== undefined
                ? String(fullData.price)
                : prev.price,
            renewalCharges:
              fullData.renewalCharges !== undefined
                ? String(fullData.renewalCharges)
                : prev.renewalCharges,
            expiryDate: fullData.expiryDate
              ? formatForDatetimeLocal(fullData.expiryDate).replace('T', ' ') +
              ':00'
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (
        name === 'phoneNumber' &&
        (!prev.username || prev.username === prev.phoneNumber)
      ) {
        updated.username = value;
      }
      return updated;
    });

    if (name === 'pincode') {
      if (value.length === 6) {
        handlePincodeLookup(value);
      }
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle access type change and automatically calculate default expiry date
  const handleAccessTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const defaultExp = calculateDefaultExpiry(value);

    setFormData((prev) => ({
      ...prev,
      accessType: value,
      expiryDate: defaultExp,
      key:
        value === 'OFFLINE'
          ? prev.key && prev.key !== '12345'
            ? prev.key
            : generateKey()
          : '12345',
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

  const handleCopyKey = (keyVal?: string) => {
    const val = keyVal || formData.key;
    if (!val) {
      toast.error('No key to copy');
      return;
    }
    navigator.clipboard.writeText(val);
    toast.success('Offline key copied to clipboard!');
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'First Name / Full Name is required';
    }
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop Name is required';
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
    if (
      formData.secondaryPhoneNumber.trim() &&
      !/^\d{10}$/.test(formData.secondaryPhoneNumber.trim())
    ) {
      newErrors.secondaryPhoneNumber =
        'Secondary phone number must be 10 digits';
    }
    if (
      formData.pincode.trim() &&
      !/^\d{6}$/.test(formData.pincode.trim())
    ) {
      newErrors.pincode = 'Pincode must be 6 digits';
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
      toast.error('Please fix all form validation errors');
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
      shopName: formData.shopName.trim(),
      email: formData.email.trim(),
      username: formData.username.trim() || formData.phoneNumber.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      secondaryPhoneNumber: formData.secondaryPhoneNumber.trim() || undefined,
      pincode: formData.pincode.trim() || undefined,
      city: formData.city.trim() || undefined,
      district: formData.district.trim() || undefined,
      state: formData.state.trim() || undefined,
      address: formData.address.trim(),
      accessType: formData.accessType.toUpperCase(),
      price: formData.price ? Number(formData.price) || formData.price : undefined,
      renewalCharges: formData.renewalCharges
        ? Number(formData.renewalCharges) || formData.renewalCharges
        : undefined,
      expiryDate: formattedExpiry || undefined,
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

  // Table Columns Definition as requested
  const columns: Column<AdminItem>[] = [
    {
      key: 'shopName',
      header: 'Shop Name',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
            {item.shopName && item.shopName !== 'N/A'
              ? item.shopName
              : item.fullname}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {item.fullname}
          </span>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
            {item.city && item.city !== 'N/A' ? item.city : '-'}
          </span>
          {item.state && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {item.state}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone No.',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {item.phoneNumber}
          </span>
          {item.secondaryPhoneNumber && (
            <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
              Sec: {item.secondaryPhoneNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'accessType',
      header: 'Type',
      render: (item) => {
        const typeUpper = (item.accessType || 'ONLINE').toUpperCase();
        if (typeUpper === 'TRAIL' || typeUpper === 'TRIAL') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
              <Sparkles className="h-3 w-3" />
              TRAIL
            </span>
          );
        }
        if (typeUpper === 'OFFLINE') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              <Key className="h-3 w-3" />
              OFFLINE
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            ONLINE
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: (
        <button
          type="button"
          onClick={() => handleSort('createdAt')}
          className="group inline-flex items-center justify-center gap-1.5 font-semibold text-white transition-colors hover:text-amber-200"
          title={`Sort by Create Date (${
            sortField === 'createdAt'
              ? sortOrder === 'asc'
                ? 'Oldest to Newest'
                : 'Newest to Oldest'
              : 'Click to sort'
          })`}
        >
          <span>Create Date Time</span>
          {sortField === 'createdAt' ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 text-amber-300" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-amber-300" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-white/50 group-hover:text-white" />
          )}
        </button>
      ),
      render: (item) => (
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {formatDisplayDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      header: (
        <button
          type="button"
          onClick={() => handleSort('expiryDate')}
          className="group inline-flex items-center justify-center gap-1.5 font-semibold text-white transition-colors hover:text-amber-200"
          title={`Sort by Expiry Date (${
            sortField === 'expiryDate'
              ? sortOrder === 'asc'
                ? 'Oldest to Newest'
                : 'Newest to Oldest'
              : 'Click to sort'
          })`}
        >
          <span>Expiry Date Time</span>
          {sortField === 'expiryDate' ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 text-amber-300" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-amber-300" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-white/50 group-hover:text-white" />
          )}
        </button>
      ),
      render: (item) => {
        const expFormatted = formatDisplayDateTime(
          item.rawExpiryDate || item.expiryDate,
        );
        return (
          <div className="flex flex-col">
            <span
              className={`font-mono text-xs ${
                item.isExpired
                  ? 'font-semibold text-red-600 dark:text-red-400'
                  : 'text-[#1a1c1b] dark:text-white'
              }`}
            >
              {expFormatted !== 'N/A' ? expFormatted : 'Unlimited'}
            </span>
            {item.isExpired && (
              <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                <AlertTriangle className="h-2.5 w-2.5" /> Expired
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'renewalCharges',
      header: 'Renewal Charges',
      render: (item) => (
        <span className="font-semibold text-sm text-[#785600] dark:text-amber-400">
          {item.renewalCharges !== undefined &&
            item.renewalCharges !== null &&
            item.renewalCharges !== ''
            ? `₹${Number(item.renewalCharges).toLocaleString('en-IN')}`
            : '-'}
        </span>
      ),
    },
  ];

  // Action column with EDIT ONLY (Delete action removed as requested)
  const renderActions = (item: AdminItem) => (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={() => handleOpenEditModal(item)}
        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-amber-400 dark:hover:bg-slate-800"
        title="Edit Admin"
      >
        <Edit className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 space-y-4">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <PageHeader title="Admin Management" />
          <GenericButton
            type="button"
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Admin</span>
          </GenericButton>
        </div>

        {/* Unified Single Line Filter Toolbar: Search -> City -> Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d3c4af]/30 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* 1. First: Search Bar */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search shop, name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-[#fbf9f6] py-1.5 pl-8 pr-3 text-xs text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>


          {/* 3. Third: Status / Type Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
              City:
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-lg border border-[#d3c4af]/30 bg-[#fbf9f6] px-2.5 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">All Cities ({adminsList.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {(searchTerm || selectedCity !== 'ALL' || selectedTab !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCity('ALL');
                  setSelectedTab('ALL');
                }}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 whitespace-nowrap"
                title="Reset filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedTab('ALL')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${selectedTab === 'ALL'
                  ? 'bg-[#785600] text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200/70 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              All
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedTab === 'ALL'
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-200'
                  }`}
              >
                {tabCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('ONLINE')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${selectedTab === 'ONLINE'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 hover:bg-emerald-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Online
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedTab === 'ONLINE'
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}
              >
                {tabCounts.online}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('OFFLINE')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${selectedTab === 'OFFLINE'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 hover:bg-amber-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              <Key className="h-3.5 w-3.5" />
              Offline
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedTab === 'OFFLINE'
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}
              >
                {tabCounts.offline}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('TRAIL')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${selectedTab === 'TRAIL'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 hover:bg-purple-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Trail
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedTab === 'TRAIL'
                    ? 'bg-white/25 text-white'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                  }`}
              >
                {tabCounts.trail}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('EXPIRED')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${selectedTab === 'EXPIRED'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 hover:bg-red-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Expired
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedTab === 'EXPIRED'
                    ? 'bg-white/25 text-white'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                  }`}
              >
                {tabCounts.expired}
              </span>
            </button>
          </div>
        </div>

        {/* Admins Table */}
        <GenericTable<AdminItem>
          data={sortedAdmins}
          columns={columns}
          emptyMessage="No admin accounts match your filter criteria."
          isLoading={isLoading}
          renderActions={renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
          onSave={() => { }}
        />
      </div>

      {/* Modal for Create / Edit Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#d3c4af]/20 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="border-gray-100 mb-5 flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
                  {editingAdmin ? 'Edit Admin Account' : 'Create New Admin'}
                </h2>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">
                  {editingAdmin
                    ? 'Update admin details, shop information, and access parameters'
                    : 'Fill in all fields to register a new shop admin'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: First Name / Full Name & Shop Name */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    First Name / Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${errors.fullname
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                      }`}
                  />
                  {errors.fullname && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.fullname}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="e.g. Royal Jewellers"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${errors.shopName
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                      }`}
                  />
                  {errors.shopName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.shopName}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${errors.email ? 'border-red-500 focus:ring-red-500/20' : ''
                      }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Phone No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${errors.phoneNumber
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                      }`}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: 2nd Phone Number & Username */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    2nd Number (Secondary Phone)
                  </label>
                  <input
                    type="text"
                    name="secondaryPhoneNumber"
                    value={formData.secondaryPhoneNumber}
                    onChange={handleInputChange}
                    placeholder="Alternate phone number (optional)"
                    maxLength={10}
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${errors.secondaryPhoneNumber
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                      }`}
                  />
                  {errors.secondaryPhoneNumber && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.secondaryPhoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username (defaults to phone number)"
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 4: Pincode, City, District, State */}
              <div className="rounded-lg border border-[#d3c4af]/30 bg-[#fbf9f6] p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <div className="text-xs font-bold text-[#785600] dark:text-amber-400 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Address & Location Details
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      Pincode
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 pr-8 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white ${errors.pincode ? 'border-red-500' : ''
                          }`}
                      />
                      {isPincodeLoading && (
                        <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#785600]" />
                      )}
                    </div>
                    {errors.pincode && (
                      <p className="mt-1 text-[11px] text-red-500">
                        {errors.pincode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Auto-filled via pincode"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="District"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Address Line / Street <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. Shop No. 12, MG Road Market"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${errors.address
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                      }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5: Type, Price, Renewal Charges, Expiry Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="accessType"
                    value={formData.accessType}
                    onChange={handleAccessTypeChange}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="ONLINE">ONLINE (1 Year)</option>
                    <option value="OFFLINE">OFFLINE (1 Year)</option>
                    <option value="TRAIL">TRAIL (7 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 5000"
                    min={0}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Renewal Charges (₹)
                  </label>
                  <input
                    type="number"
                    name="renewalCharges"
                    value={formData.renewalCharges}
                    onChange={handleInputChange}
                    placeholder="e.g. 2000"
                    min={0}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Expiry Date & Time
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
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 5b: Offline Key when OFFLINE */}
              {formData.accessType === 'OFFLINE' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Offline Key <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="key"
                      value={formData.key}
                      onChange={handleInputChange}
                      placeholder="Offline key"
                      className="font-mono flex-1 rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-xs text-[#1a1c1b] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyKey(formData.key)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#d3c4af]/40 bg-white px-3 py-2 text-xs font-medium text-[#785600] transition-colors hover:bg-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
                      title="Copy Key to Clipboard"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateKey}
                      className="rounded-lg bg-[#785600] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5d4200]"
                    >
                      Generate Key
                    </button>
                  </div>
                  {errors.key && (
                    <p className="mt-1 text-xs text-red-500">{errors.key}</p>
                  )}
                </div>
              )}

              {/* Row 6: Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                  Password{' '}
                  {editingAdmin ? (
                    <span className="text-gray-400 font-normal">
                      (Leave blank to keep unchanged)
                    </span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingAdmin ? '••••••••' : 'Pass@123'}
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 pr-10 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${errors.password ? 'border-red-500' : ''
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] hover:text-[#785600]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="border-gray-100 flex justify-end gap-3 border-t pt-4 dark:border-slate-800">
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
