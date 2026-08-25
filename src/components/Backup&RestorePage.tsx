import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, Trash2, AlertTriangle } from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getBackFile, useRestore, useDeleteDatabase } from '@/lib/api/backup';

import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';

const BackupAndRestorePage = () => {
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const restore = useRestore(queryClient);
  const deleteDbMutation = useDeleteDatabase(queryClient);

  /**
   * ============================================
   * DOWNLOAD BACKUP
   * ============================================
   */
  const handleDownloadBackup = async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      toast.loading('Generating database backup...', {
        id: 'backup-download',
      });

      const blob = await getBackFile();

      if (!(blob instanceof Blob)) {
        throw new Error('Invalid backup file received');
      }

      if (blob.size === 0) {
        throw new Error('Backup file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.download = `database-backup-${today}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast.success('SQL backup downloaded successfully', {
        id: 'backup-download',
      });
    } catch (error: any) {
      console.error('========== DOWNLOAD ERROR ==========', error);
      toast.error(error?.message || 'Failed to download database backup', {
        id: 'backup-download',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * ============================================
   * SELECT SQL FILE
   * ============================================
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.sql')) {
      toast.error('Please select a .sql backup file');
      event.target.value = '';
      return;
    }

    if (file.size === 0) {
      toast.error('Selected SQL backup file is empty');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  /**
   * ============================================
   * RESTORE DATABASE
   * ============================================
   */
  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error('Please select a backup file');
      return;
    }

    const confirmed = window.confirm(
      'This will overwrite all existing database data.\n\n' +
        'Are you sure you want to restore this backup?',
    );

    if (!confirmed) {
      return;
    }

    setIsUploading(true);

    try {
      toast.loading('Restoring database...', {
        id: 'database-restore',
      });

      const formData = new FormData();
      formData.append('file', selectedFile);

      await restore.mutateAsync(formData);

      toast.success('Data restored successfully', {
        id: 'database-restore',
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await queryClient.invalidateQueries();
    } catch (error: any) {
      console.error('========== RESTORE ERROR ==========', error);
      toast.error(error?.message || 'Failed to restore database', {
        id: 'database-restore',
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * ============================================
   * DELETE DATABASE
   * ============================================
   */
  const handleDeleteDatabase = async () => {
    try {
      toast.loading('Deleting database records...', {
        id: 'database-delete',
      });

      await deleteDbMutation.mutateAsync();

      toast.success('Database records deleted successfully', {
        id: 'database-delete',
      });

      setShowDeleteConfirmModal(false);
      await queryClient.invalidateQueries();
    } catch (error: any) {
      console.error('========== DELETE DATABASE ERROR ==========', error);
      toast.error(error?.message || 'Failed to delete database', {
        id: 'database-delete',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            title="Data Backup & Management"
            subtitle="Backup, restore, or reset your database"
          />
        </div>

        {/* 3 Action Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Download Backup */}
          <div className="flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Download className="h-5 w-5 text-[#785600] dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-[#1a1c1b] dark:text-white">
                  Download Backup
                </h2>
              </div>
              <p className="mb-6 text-sm text-[#4f4535] dark:text-slate-400">
                Download a complete SQL backup of your database safely to your device.
              </p>
            </div>

            <GenericButton
              type="button"
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              variant="primary"
              className="w-full !px-6"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup
                </>
              )}
            </GenericButton>
          </div>

          {/* Card 2: Restore Data */}
          <div className="flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#785600] dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-[#1a1c1b] dark:text-white">
                  Restore Data
                </h2>
              </div>
              <p className="mb-4 text-sm text-[#4f4535] dark:text-slate-400">
                Upload an existing SQL backup file to restore database data.
              </p>

              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql,application/sql,text/plain"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#785600] hover:file:bg-amber-100 dark:file:bg-slate-800 dark:file:text-amber-400"
                />
              </div>
            </div>

            <GenericButton
              type="button"
              onClick={handleRestore}
              disabled={!selectedFile || restore.isPending || isUploading}
              className={`w-full !whitespace-nowrap !px-6 ${
                !selectedFile || restore.isPending || isUploading
                  ? '!cursor-not-allowed !bg-gray-300 !text-gray-500 dark:!bg-slate-800 dark:!text-slate-600'
                  : '!bg-emerald-600 !text-white hover:!bg-emerald-700'
              }`}
            >
              {restore.isPending || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Restore Data
                </>
              )}
            </GenericButton>
          </div>

          {/* Card 3: Delete Database */}
          <div className="flex flex-col justify-between rounded-xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/30 dark:bg-slate-900">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Delete Database
                </h2>
              </div>
              <p className="mb-6 text-sm text-[#4f4535] dark:text-slate-400">
                Permanently clear and reset all database records. This action cannot be undone.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteConfirmModal(true)}
              disabled={deleteDbMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteDbMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Database</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal (Simple popup without top icon & Hindi in brackets) */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
              <div className="p-6">
                <h3 className="mb-2 text-center text-lg font-bold text-red-600 dark:text-red-400">
                  Confirm Database Deletion (डेटाबेस डिलीट करा)
                </h3>
                <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                  Are you sure you want to permanently delete all database data? This action cannot be reversed.
                  <br />
                  <span className="mt-2 block font-medium text-red-600 dark:text-red-400">
                    (सर्व डेटा नष्ट केला जाईल, कृपया खात्री करा.)
                  </span>
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirmModal(false)}
                    disabled={deleteDbMutation.isPending}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel (रद्द करा)
                  </button>
                  <button
                    onClick={handleDeleteDatabase}
                    disabled={deleteDbMutation.isPending}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteDbMutation.isPending ? 'Deleting...' : 'Delete Database (डिलीट करा)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupAndRestorePage;

