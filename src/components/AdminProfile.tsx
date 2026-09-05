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
  Clock,
  Clock8,
  CalendarDays,
} from 'lucide-react';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {
  getSavedWeekCycle,
  saveWeekCycle,
  WEEK_DAYS,
  getCurrentAppWeekRange,
  WeekCycleConfig,
} from '@/utils/weekRangeUtils';

// Helpers for converting between "HH:mm" time inputs and ISO Date strings expected by backend
const formatTimeToISO = (time?: string | null): string | null => {
  if (!time || !time.trim()) return null;
  if (time.includes('T') || time.includes('Z')) {
    const d = new Date(time);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  }
  const parts = time.split(':').map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const d = new Date();
    d.setHours(parts[0], parts[1], parts[2] || 0, 0);
    return d.toISOString();
  }
  return null;
};

const formatISOToTime = (isoOrTimeString?: string | null): string => {
  if (!isoOrTimeString) return '';
  if (/^\d{2}:\d{2}$/.test(isoOrTimeString)) {
    return isoOrTimeString;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(isoOrTimeString)) {
    return isoOrTimeString.slice(0, 5);
  }
  try {
    const d = new Date(isoOrTimeString);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch (e) { }
  return '';
};

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
    workStartTime: '',
    workEndTime: '',
    workStatus: 'active', // 'active' | 'inactive' | 'on_leave'
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Weekly Date Cycle Settings
  const [weekConfig, setWeekConfig] = useState<WeekCycleConfig>(() => getSavedWeekCycle());
  const [weekRangeDates, setWeekRangeDates] = useState<{ from: Date; to: Date }>(() => {
    const range = getCurrentAppWeekRange();
    return { from: range.fromDate, to: range.toDate };
  });

  const handleWeekFromDateChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const selected = new Date(dates[0]);
      selected.setHours(0, 0, 0, 0);
      const startDay = selected.getDay();

      const newTo = new Date(selected);
      if (weekConfig.startDay === weekConfig.endDay) {
        newTo.setDate(selected.getDate() + 7);
      } else {
        const span = (weekConfig.endDay - startDay + 7) % 7;
        newTo.setDate(selected.getDate() + (span === 0 ? 6 : span));
      }
      newTo.setHours(23, 59, 59, 999);

      const updated: WeekCycleConfig = {
        ...weekConfig,
        startDay,
        cycleId: 'custom',
      };
      setWeekConfig(updated);
      setWeekRangeDates({ from: selected, to: newTo });
      saveWeekCycle(updated);
      const startName = WEEK_DAYS.find((d) => d.value === startDay)?.label;
      const endName = WEEK_DAYS.find((d) => d.value === updated.endDay)?.label;
      toast.success(`Week cycle set: ${startName} to ${endName}`);
    }
  };

  const handleWeekToDateChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const selected = new Date(dates[0]);
      selected.setHours(23, 59, 59, 999);
      const endDay = selected.getDay();

      const updated: WeekCycleConfig = {
        ...weekConfig,
        endDay,
        cycleId: 'custom',
      };
      setWeekConfig(updated);
      setWeekRangeDates((prev) => ({ ...prev, to: selected }));
      saveWeekCycle(updated);
      const startName = WEEK_DAYS.find((d) => d.value === updated.startDay)?.label;
      const endName = WEEK_DAYS.find((d) => d.value === endDay)?.label;
      toast.success(`Week cycle set: ${startName} to ${endName}`);
    }
  };

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
      expiryDate: resData?.expiryDate || '',
      workStartTime: formatISOToTime(resData?.workStartTime || userObj?.workStartTime),
      workEndTime: formatISOToTime(resData?.workEndTime || userObj?.workEndTime),
      workStatus: resData?.workStatus || userObj?.workStatus || 'active',
    });
  }, [getdata?.data, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      workStartTime: formatTimeToISO(formData.workStartTime),
      workEndTime: formatTimeToISO(formData.workEndTime),
    };

    // Check if password fields are filled
    const hasCurrentPassword = passwordData.currentPassword.trim() !== '';
    const hasNewPassword = passwordData.newPassword.trim() !== '';

    if (hasCurrentPassword || hasNewPassword) {
      payload.currentPassword = passwordData.currentPassword;
      payload.newPassword = passwordData.newPassword;
    }

    try {
      await updateProfile.mutateAsync(payload);
      // Clear password fields after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
      });
    } catch (error: any) {
      console.error('Update error:', error);
    }
  };

  const resData = getdata?.data?.data || getdata?.data || {};
  const userObj = resData.user || resData;

  return (
    <div className="bg-[#f9f9f7] px-4 py-3 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-3">
        {/* Profile Form with Header Actions and 2-Column Compact Layout */}
        <form onSubmit={handleSave} className="space-y-3">


          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 items-stretch">
            {/* LEFT COLUMN: Account Information (Compact 2-col field grid) */}
            <div className="flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-slate-800">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                    <User className="h-4 w-4" />
                    Account Information
                  </h3>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* Full Name */}
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type="text"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-2.5 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email"
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-2.5 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Primary Phone */}
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Primary Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Primary phone"
                        className="font-mono w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-2.5 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Secondary Phone */}
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Secondary Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type="text"
                        name="secondaryPhoneNumber"
                        value={formData.secondaryPhoneNumber}
                        onChange={handleInputChange}
                        placeholder="Secondary phone"
                        className="font-mono w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-2.5 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Location / Address
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter location / address"
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-2.5 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Expiry Date & Time
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type="text"
                        name="expiryDate"
                        value={(() => {
                          const raw = formData.expiryDate || resData?.expiryDate || user?.expiryDate;
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
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-gray-50 pl-8 pr-2.5 py-1.5 text-xs font-medium text-[#1a1c1b] dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Access Type */}
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Access Type
                    </label>
                    <div className="flex items-center h-[30px]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase text-green-800 dark:bg-green-950/40 dark:text-green-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {formData.accessType || 'ONLINE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Work Hours, Password & Weekly Date Cycle */}
            <div className="space-y-3">
              {/* Work Hours & Security Card */}
              <div className="rounded-xl border border-[#d3c4af]/30 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-slate-800">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    Work Schedule & Security
                  </h3>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* Work Start Time */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Work Start Time
                    </label>
                    <div className="relative flex items-center">
                      <Clock className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type="time"
                        name="workStartTime"
                        value={formData.workStartTime}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-2 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Work End Time */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Work End Time
                    </label>
                    <div className="relative flex items-center">
                      <Clock8 className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type="time"
                        name="workEndTime"
                        value={formData.workEndTime}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-2 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Current Password */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      Current Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Current password"
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-8 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      New Password
                    </label>
                    <div className="relative flex items-center">
                      <Key className="absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="New password"
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white pl-8 pr-8 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Date Cycle Settings Card */}
              <div className="rounded-xl border border-[#d3c4af]/30 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-slate-800">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                    <CalendarDays className="h-4 w-4" />
                    Default Weekly Date Cycle
                  </h3>
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-[#785600] dark:bg-slate-800 dark:text-amber-300">
                    <span>Active:</span>
                    <span className="font-bold">
                      {WEEK_DAYS.find((d) => d.value === weekConfig.startDay)?.label} - {WEEK_DAYS.find((d) => d.value === weekConfig.endDay)?.label}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* From Date Picker */}
                  <div>
                    <GenericWeeklyDatePicker
                      id="admin-week-from-date"
                      label="Week Start Date (From)"
                      mode="from"
                      placeholder="DD/MM/YYYY"
                      initialDates={weekRangeDates.from ? [weekRangeDates.from] : []}
                      onDateChange={handleWeekFromDateChange}
                      className="w-full !text-xs"
                    />
                    <p className="mt-0.5 text-[10px] text-[#817563] dark:text-slate-400">
                      Starts on: <span className="font-semibold text-[#1a1c1b] dark:text-white">{WEEK_DAYS.find((d) => d.value === weekConfig.startDay)?.label || 'Monday'}</span>
                    </p>
                  </div>

                  {/* To Date Picker */}
                  <div>
                    <GenericWeeklyDatePicker
                      id="admin-week-to-date"
                      label="Week End Date (To)"
                      mode="to"
                      placeholder="DD/MM/YYYY"
                      initialDates={weekRangeDates.to ? [weekRangeDates.to] : []}
                      onDateChange={handleWeekToDateChange}
                      className="w-full !text-xs"
                    />
                    <p className="mt-0.5 text-[10px] text-[#817563] dark:text-slate-400">
                      Ends on: <span className="font-semibold text-[#1a1c1b] dark:text-white">{WEEK_DAYS.find((d) => d.value === weekConfig.endDay)?.label || 'Sunday'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <GenericButton
              type="submit"
              variant="primary"
              disabled={updateProfile.isPending}
              className="!py-1.5 !px-4 !text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{updateProfile.isPending ? 'Saving...' : 'Save Changes'}</span>
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;