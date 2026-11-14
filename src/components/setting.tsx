import {useState, useEffect} from 'react';
import {Lock, Loader2, CheckCircle2} from 'lucide-react';
import toast from 'react-hot-toast';
import {useAccessForBackup, useUpdateProfile} from '@/lib/api/profile';
import AdminProfile from './AdminProfile';
import HeaderPdfDesign from './HeaderPdfDesign';
import BackupAndRestorePage from './Backup&RestorePage';
import ScaleSetting from './ScaleSetting';
import AlertManagement from './AlertManagement';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'header' | 'backup' | 'scale' | 'alert'
  >('profile');

  const [isBackupUnlocked, setIsBackupUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const updateProfileMutation = useAccessForBackup();

  // Automatically call the API to verify password as user enters it
  useEffect(() => {
    const trimmed = adminPassword.trim();
    if (!trimmed || isBackupUnlocked) return;

    const timer = setTimeout(async () => {
      setIsVerifying(true);
      try {
        const res: any = await updateProfileMutation.mutateAsync({
          password: trimmed,
        });

        if (res?.data !== true) {
          return;
        }

        setIsBackupUnlocked(true);
        setActiveTab('backup');
        setAdminPassword('');
        toast.success('Access granted: Backup & Restore tab unlocked!', {
          id: 'password-verify',
        });
      } catch (error: any) {
        // Suppress backend error message as requested
      } finally {
        setIsVerifying(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [adminPassword, isBackupUnlocked]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = adminPassword.trim();
      if (!trimmed) return;

      setIsVerifying(true);
      try {
        const res: any = await updateProfileMutation.mutateAsync({
          password: trimmed,
        });

        if (res?.data !== true) {
          return;
        }

        setIsBackupUnlocked(true);
        setActiveTab('backup');
        setAdminPassword('');
        toast.success('Access granted: Backup & Restore tab unlocked!', {
          id: 'password-verify',
        });
      } catch (error: any) {
        // Suppress backend error message as requested
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const tabs = [
    {id: 'profile', label: 'Admin Profile'},
    {id: 'header', label: 'Bill Header'},
    ...(isBackupUnlocked
      ? [{id: 'backup', label: 'Backup & Restore Data'}]
      : []),
    {id: 'scale', label: 'Weight Scale'},
    // { id: 'alert', label: 'Alert Management' },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Tab Bar Header with Top-Right Small Password Field */}
        <div
          className={`mb-4 flex gap-2 border-b border-slate-200 pb-1 dark:border-slate-700 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-2 ${
            isBackupUnlocked
              ? 'flex-col-reverse'
              : 'flex-row items-center justify-between'
          }`}
        >
          {/* Tab Navigation */}
          <div
            className="no-scrollbar flex min-w-0 flex-1 gap-4 overflow-x-auto sm:gap-6"
            style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | 'profile'
                      | 'header'
                      | 'backup'
                      | 'scale'
                      | 'alert',
                  )
                }
                className={`whitespace-nowrap border-b-2 pb-2.5 text-sm font-semibold transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-[#785600] text-[#785600] dark:border-amber-400 dark:text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tab.id === 'backup' ? (
                  <>
                    <span className="sm:hidden">Backup</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </>
                ) : (
                  tab.label
                )}
              </button>
            ))}
          </div>

          {/* Right Top Corner Small Password Field (No Button, Auto-Verifies) */}
          <div
            className={`shrink-0 ${isBackupUnlocked ? 'self-end sm:self-auto' : ''}`}
          >
            {!isBackupUnlocked ? (
              <div className="relative flex items-center">
                <input
                  type="password"
                  name="admin_secret_token"
                  id="admin_secret_token"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  spellCheck={false}
                  className="h-8 w-20 rounded-lg border border-[#d3c4af]/50 bg-white px-2.5 text-xs text-transparent caret-transparent selection:bg-transparent selection:text-transparent focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600] dark:border-slate-700 dark:bg-slate-900 sm:w-36"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Backup</span> Unlocked
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsBackupUnlocked(false);
                    if (activeTab === 'backup') {
                      setActiveTab('profile');
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  title="Lock Backup Tab"
                >
                  <Lock className="h-3 w-3" />
                  <span>Lock</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'profile' && <AdminProfile />}
          {activeTab === 'header' && <HeaderPdfDesign />}
          {activeTab === 'backup' && isBackupUnlocked && (
            <BackupAndRestorePage />
          )}
          {activeTab === 'scale' && <ScaleSetting />}
          {/* {activeTab === 'alert' && <AlertManagement />} */}
        </div>
      </div>
    </div>
  );
};
