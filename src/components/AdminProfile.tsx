import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useGetProfileData, useUpdateProfile } from '@/lib/api/profile';
import PageHeader from '@/components/Forms/Common/PageHeader';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';
import {
    User,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    Key,
    Calendar,
    BadgeCheck,
    Save
} from 'lucide-react';

const AdminProfile: React.FC = () => {
    const { user } = useAuthContext();
    const getdata = useGetProfileData();
    const updateProfile = useUpdateProfile();

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phoneNumber: '',
        secondaryPhoneNumber: '',
        address: '',
        accessType: 'ONLINE',
        key: '',
        expiryDate: '',
    });

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Extract data accurately from response structure { statusCode, status, message, data: { ... user: { ... } } }
        const resData = getdata?.data?.data || getdata?.data || {};
        const userObj = resData.user || resData;

        if ((getdata?.data || user) && !isInitialized) {
            setFormData({
                fullname: userObj?.fullname || userObj?.name || user?.fullname || user?.name || '',
                email: userObj?.email || resData?.contactPersonEmail || user?.email || '',
                phoneNumber: userObj?.phoneNumber || userObj?.phone || user?.phoneNumber || user?.phone || '',
                secondaryPhoneNumber: userObj?.secondaryPhoneNumber || userObj?.secondazyPhoneNumber || resData?.contactPersonNumber || user?.secondaryPhoneNumber || '',
                address: userObj?.address || resData?.address || resData?.city || user?.address || '',
                accessType: (resData?.accessType || userObj?.accessType || user?.accessType || 'ONLINE').toUpperCase(),
                key: resData?.key !== undefined ? resData.key : (user?.key || ''),
                expiryDate: resData?.expiryDate ? resData.expiryDate.split('T')[0] : (user?.expiryDate || ''),
            });
            setIsInitialized(true);
        }
    }, [getdata?.data, user, isInitialized]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            await updateProfile.mutateAsync(formData);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error?.message || 'Failed to update profile');
        }
    };

    const resData = getdata?.data?.data || getdata?.data || {};
    const userObj = resData.user || resData;

    const adminData = {
        fullname: formData.fullname || userObj?.fullname || userObj?.name || user?.fullname || user?.name || 'Super Admin',
        username: userObj?.username || userObj?.phoneNumber || user?.username || user?.phone || 'admin',
        role: userObj?.role || user?.role || 'SUPERADMIN',
    };

    return (
        <div className="bg-[#f9f9f7] dark:bg-slate-950 min-h-screen py-6 px-4 sm:px-6">
            <div className="mx-auto space-y-6">
                {/* Directly Editable Profile Form */}
                <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-xl border border-[#d3c4af]/30 dark:border-slate-800 p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-slate-800">
                        <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-[#785600] dark:text-amber-400" />
                            Account Information
                        </h3>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-[#785600] dark:text-amber-400 mt-1">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleInputChange}
                                    placeholder="Enter full name"
                                    className="w-full px-3.5 py-2 text-sm border border-[#d3c4af]/40 rounded-lg bg-white dark:bg-slate-800 text-[#1a1c1b] dark:text-white focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 font-medium"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-[#785600] dark:text-amber-400 mt-1">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email address"
                                    className="w-full px-3.5 py-2 text-sm border border-[#d3c4af]/40 rounded-lg bg-white dark:bg-slate-800 text-[#1a1c1b] dark:text-white focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 font-medium"
                                />
                            </div>
                        </div>

                        {/* Primary Phone */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-[#785600] dark:text-amber-400 mt-1">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Primary Phone Number</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter primary phone"
                                    className="w-full px-3.5 py-2 text-sm border border-[#d3c4af]/40 rounded-lg bg-white dark:bg-slate-800 text-[#1a1c1b] dark:text-white focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 font-mono font-medium"
                                />
                            </div>
                        </div>

                        {/* Secondary Phone */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-[#785600] dark:text-amber-400 mt-1">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Secondary Phone Number</label>
                                <input
                                    type="text"
                                    name="secondaryPhoneNumber"
                                    value={formData.secondaryPhoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter secondary phone"
                                    className="w-full px-3.5 py-2 text-sm border border-[#d3c4af]/40 rounded-lg bg-white dark:bg-slate-800 text-[#1a1c1b] dark:text-white focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 font-mono font-medium"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-[#785600] dark:text-amber-400 mt-1">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Location / Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter address"
                                    className="w-full px-3.5 py-2 text-sm border border-[#d3c4af]/40 rounded-lg bg-white dark:bg-slate-800 text-[#1a1c1b] dark:text-white focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 font-medium"
                                />
                            </div>
                        </div>



                        {/* Expiry Date */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-[#785600] dark:text-amber-400 mt-1">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Expiry Date</label>
                                <input
                                    type="text"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 2026-12-31"
                                    className="w-full px-3.5 py-2 text-sm border border-[#d3c4af]/40 rounded-lg bg-white dark:bg-slate-800 text-[#1a1c1b] dark:text-white focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 font-medium"
                                />
                            </div>
                        </div>

                        {/* Access Type */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-[#785600] dark:text-amber-400 mt-1">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Access Type</label>
                                <span className="inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {formData.accessType || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Single Prominent Save Button at Bottom */}
                    <div className="pt-4 border-t border-stroke dark:border-slate-800 flex justify-end">
                        <GenericButton
                            type="submit"
                            variant="primary"
                            disabled={updateProfile.isPending}
                        >
                            <Save className="h-4 w-4" />
                            <span>{updateProfile.isPending ? 'Saving...' : 'Save Profile'}</span>
                        </GenericButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminProfile;