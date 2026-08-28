import React, {useState, useEffect} from 'react';
import {useAuthContext} from '@/context/AuthContext';
import {useGetProfileData, useUpdateProfile} from '@/lib/api/profile';
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
} from 'lucide-react';

const AdminProfile: React.FC = () => {
  const {user} = useAuthContext();
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

  useEffect(() => {
    // Extract data accurately from response structure { statusCode, status, message, data: { ... user: { ... } } }
    const resData = getdata?.data?.data || getdata?.data || {};
    const userObj = resData.user || resData;

    if (getdata || user) {
      setFormData({
        fullname:
          userObj?.fullname ||
          userObj?.name ||
          user?.fullname ||
          user?.name ||
          '',
        email:
          userObj?.email || resData?.contactPersonEmail || user?.email || '',
        phoneNumber:
          userObj?.phoneNumber ||
          userObj?.phone ||
          user?.phoneNumber ||
          user?.phone ||
          '',
        secondaryPhoneNumber:
          userObj?.secondaryPhoneNumber ||
          userObj?.secondazyPhoneNumber ||
          resData?.contactPersonNumber ||
          user?.secondaryPhoneNumber ||
          '',
        address:
          userObj?.address ||
          resData?.address ||
          resData?.city ||
          user?.address ||
          '',
        accessType: (
          resData?.accessType ||
          userObj?.accessType ||
          user?.accessType ||
          'ONLINE'
        ).toUpperCase(),
        key: resData?.key !== undefined ? resData.key : user?.key || '',
        expiryDate: resData?.expiryDate || user?.expiryDate || '',
      });
    }
  }, [getdata, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await updateProfile.mutateAsync(formData);
      // toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error?.message || 'Failed to update profile');
    }
  };

  const resData = getdata?.data?.data || getdata?.data || {};
  const userObj = resData.user || resData;

  const adminData = {
    fullname:
      formData.fullname ||
      userObj?.fullname ||
      userObj?.name ||
      user?.fullname ||
      user?.name ||
      'Super Admin',
    username:
      userObj?.username ||
      userObj?.phoneNumber ||
      user?.username ||
      user?.phone ||
      'admin',
    role: userObj?.role || user?.role || 'SUPERADMIN',
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7] px-4 py-6 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto space-y-6">
        {/* Directly Editable Profile Form */}
        <form
          onSubmit={handleSave}
          className="space-y-6 rounded-xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
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

            {/* Email */}
            {/* <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-amber-50 p-2.5 text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 mb-1 block text-xs font-semibold dark:text-slate-400">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3.5 py-2 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div> */}

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
                    const raw =
                      formData.expiryDate ||
                      resData?.expiryDate ||
                      user?.expiryDate;
                    if (!raw) return 'N/A';
                    const parsed = new Date(raw);
                    return isNaN(parsed.getTime())
                      ? raw
                      : parsed.toLocaleString('en-IN', {
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
          </div>

          {/* Single Prominent Save Button at Bottom */}
          <div className="flex justify-end border-t border-stroke pt-4 dark:border-slate-800">
            <GenericButton
              type="submit"
              variant="primary"
              disabled={updateProfile.isPending}
            >
              <Save className="h-4 w-4" />
              <span>
                {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
              </span>
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
