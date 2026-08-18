import React, {useRef, useState} from 'react';
import {Download, Upload, Loader2, AlertCircle} from 'lucide-react';

import {useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {getBackFile, useRestore} from '@/lib/api/backup';

import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';

const BackupAndRestorePage = () => {
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const restore = useRestore(queryClient);

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

      /**
       * IMPORTANT:
       *
       * getBackFile() returns the Blob directly.
       *
       * Do NOT use:
       * result.data
       *
       * Do NOT use:
       * result
       *
       * Just use:
       * blob
       */
      const blob = await getBackFile();

      console.log('========== DOWNLOAD ==========');

      console.log('Blob:', blob);
      console.log('Is Blob:', blob instanceof Blob);
      console.log('Size:', blob.size);
      console.log('Type:', blob.type);

      console.log('==============================');

      if (!(blob instanceof Blob)) {
        throw new Error('Invalid backup file received');
      }

      if (blob.size === 0) {
        throw new Error('Backup file is empty');
      }

      /**
       * Create download URL
       */
      const url = window.URL.createObjectURL(blob);

      /**
       * Create download link
       */
      const link = document.createElement('a');

      link.href = url;

      /**
       * Current date
       */
      const today = new Date().toISOString().split('T')[0];

      /**
       * SQL filename
       */
      link.download = `database-backup-${today}.sql`;

      /**
       * Trigger download
       */
      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      /**
       * Free memory
       */
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast.success('SQL backup downloaded successfully', {
        id: 'backup-download',
      });
    } catch (error: any) {
      console.error('========== DOWNLOAD ERROR ==========');

      console.error(error);

      console.error('====================================');

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

    /**
     * Validate extension
     */
    if (!file.name.toLowerCase().endsWith('.sql')) {
      toast.error('Please select a .sql backup file');

      event.target.value = '';

      return;
    }

    /**
     * Validate file size
     */
    if (file.size === 0) {
      toast.error('Selected SQL backup file is empty');

      event.target.value = '';

      return;
    }

    console.log('========== SELECTED FILE ==========');

    console.log('Name:', file.name);
    console.log('Size:', file.size);
    console.log('Type:', file.type);

    console.log('===================================');

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

      console.log('========== RESTORE ==========');

      console.log('File name:', selectedFile.name);

      console.log('File size:', selectedFile.size);

      console.log('File type:', selectedFile.type);

      console.log('=============================');

      await restore.mutateAsync(formData);

      toast.success('Data restored successfully', {
        id: 'database-restore',
      });

      /**
       * Clear selected file
       */
      setSelectedFile(null);

      /**
       * Clear file input
       */
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      /**
       * Refresh application data
       */
      await queryClient.invalidateQueries();
    } catch (error: any) {
      console.error('========== RESTORE ERROR ==========');

      console.error(error);

      console.error('===================================');

      toast.error(error?.message || 'Failed to restore database', {
        id: 'database-restore',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            title="Data Backup"
            subtitle="Backup and restore your database"
          />
        </div>

        {/* Download Backup */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="col:span-6 mb-4 rounded-lg border border-stroke bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-semibold text-black">
                Download Backup
              </h2>
            </div>

            <p className="text-gray-500 mb-4 text-sm">
              Download a complete SQL backup of your database.
            </p>

            <GenericButton
              type="button"
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              variant="primary"
              className="!px-6"
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

          {/* Restore */}
          <div className="mb-4 rounded-lg border border-stroke bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-semibold text-black">Restore Data</h2>
            </div>

            <p className="text-gray-500 mb-4 text-sm">
              Upload a SQL backup file to restore your database.
            </p>

            {/* File Input & Restore Button */}
            <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql,application/sql,text/plain"
                onChange={handleFileSelect}
                className="text-gray-500 block w-full flex-1 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />

              <GenericButton
                type="button"
                onClick={handleRestore}
                disabled={!selectedFile || restore.isPending || isUploading}
                className={`!whitespace-nowrap !px-6 ${
                  !selectedFile || restore.isPending || isUploading
                    ? '!bg-gray-300 !text-gray-500 cursor-not-allowed'
                    : '!bg-red-600 !text-white hover:!bg-red-700'
                } `}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupAndRestorePage;
