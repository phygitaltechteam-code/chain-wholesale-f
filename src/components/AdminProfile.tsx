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
  Save,
  Lock,
  Eye,
  EyeOff,
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

  // Password change states
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!getdata?.data && !user) return;

    const resData = getdata?.data?.data || getdata?.data || {};
    const userObj = resData.user || resData;

    setFormData({
      fullname: userObj?.fullname || userObj?.name || user?.fullname || '',
      email: userObj?.email || resData?.contactPersonEmail || user?.email || '',
      phoneNumber: userObj?.phoneNumber || userObj?.phone || user?.phoneNumber || '',
      secondaryPhoneNumber: userObj?.secondaryPhoneNumber || userObj?.secondazyPhoneNumber || resData?.contactPersonNumber || '',
      address: userObj?.address || resData?.address || resData?.city || user?.address || '',
      accessType: (resData?.accessType || userObj?.accessType || 'ONLINE').toUpperCase(),
      key: resData?.key !== undefined ? resData.key : user?.key || '',
      expiryDate: resData?.expiryDate || user?.expiryDate || '',
    });
  }, [getdata?.data, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // Combined save - handles both profile update and password change
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Prepare payload with profile data
    const payload: any = {
      fullname: formData.fullname,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      secondaryPhoneNumber: formData.secondaryPhoneNumber,
      address: formData.address,
    };

    // Check if password fields are filled
    const hasOldPassword = passwordData.oldPassword.trim() !== '';
    const hasNewPassword = passwordData.newPassword.trim() !== '';
    const hasConfirmPassword = passwordData.confirmPassword.trim() !== '';

    // If any password field is filled, validate all
    if (hasOldPassword || hasNewPassword || hasConfirmPassword) {
      // Validate old password
      if (!hasOldPassword) {
        toast.error('Please enter your current password');
        return;
      }

      // Validate new password
      if (!hasNewPassword) {
        toast.error('Please enter a new password');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }

      // Validate confirm password
      if (!hasConfirmPassword) {
        toast.error('Please confirm your new password');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New password and confirm password do not match');
        return;
      }

      // Add password fields to payload
      payload.oldPassword = passwordData.oldPassword;
      payload.newPassword = passwordData.newPassword;
    }

    try {
      await updateProfile.mutateAsync(payload);
      toast.success('Profile updated successfully!');

      // Clear password fields after successful update
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error?.message || 'Failed to update profile');
    }
  };

  const resData = getdata?.data?.data || getdata?.data || {};
  const userObj = resData.user || resData;

  return (
    <div className="min-h-screen bg-[#f9f9f7] px-4 py-6 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto space-y-6">
        {/* Profile Form with Password Change */}
        <form
          onSubmit={handleSave}
          className="space-y-6 rounded-xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Account Information Section */}
          <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#1a1c1b] dark:text-white">
              <User className="h-5 w-5 text-[#785600] dark:text-amber-400" />
              Account Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Full Name */}
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-amber-50 p-2.5 text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3.5 py-2 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Primary Phone */}
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-amber-50 p-2.5 text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                  Primary Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter primary phone"
                  className="font-mono w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3.5 py-2 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Secondary Phone */}
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-amber-50 p-2.5 text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                  Secondary Phone Number
                </label>
                <input
                  type="text"
                  name="secondaryPhoneNumber"
                  value={formData.secondaryPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter secondary phone"
                  className="font-mono w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3.5 py-2 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-amber-50 p-2.5 text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                  Location / Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3.5 py-2 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-amber-50 p-2.5 text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                  Expiry Date & Time
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={(() => {
                    const raw = formData.expiryDate || resData?.expiryDate || user?.expiryDate;
                    if (!raw) return 'N/A';
                    const parsed = new Date(raw);
                    return isNaN(parsed.getTime()) ? raw : parsed.toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });
                  })()}
                  disabled
                  className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3.5 py-2 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Access Type */}
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-amber-50 p-2.5 text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                  Access Type
                </label>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase text-green-800 dark:bg-green-950/40 dark:text-green-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {formData.accessType || '-'}
                </span>
              </div>
            </div>

            {/* Old Password */}
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-amber-50 p-2.5 text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3.5 py-2 pr-10 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3.5 py-2 pr-10 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Single Save Button */}
          <div className="flex justify-end border-t border-stroke pt-4 dark:border-slate-800">
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