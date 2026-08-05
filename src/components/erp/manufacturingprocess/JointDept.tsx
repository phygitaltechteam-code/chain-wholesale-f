import React, { useState, useEffect } from 'react';
import { Edit, Trash2, X, Search, Save } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import toast from 'react-hot-toast';
import { manufacturingStore } from '@/utils/manufacturingStore';


interface JointEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: string;
  chainGiven: number;
  chainReceived: number;
  powder: number;
  powderReceived: number;
  srp: number;
  isEditing?: boolean;
  isSaved?: boolean;
  powderReceivedRaw?: string;
  srpRaw?: string;
}

const JointDept: React.FC = () => {
  const navigate = useNavigate();
  const [jointEntries, setJointEntries] = useState<JointEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load data from store
  useEffect(() => {
    const entries = manufacturingStore.getEntries();
    const jointData = entries.map((entry, index) => ({
      id: entry.id,
      srNo: index + 1,
      dateTime: entry.dateTime,
      item: entry.item,
      size: entry.size,
      purity: entry.purity || '22K',
      chainGiven: entry.chainGiven || entry.chainWeight || 0,
      chainReceived: entry.chainReceived || 0,
      powder: entry.powder || 0,
      powderReceived: entry.powderReceived || 0,
      srp: entry.srp || 0,
      isEditing: false,
      isSaved: entry.isSaved || false,
      powderReceivedRaw: '',
      srpRaw: '',
    }));
    setJointEntries(jointData);
  }, []);

  // Handle row edit toggle
  const handleRowEdit = (index: number) => {
    setJointEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        return {
          ...entry,
          isEditing: !entry.isEditing,
          powderReceivedRaw: entry.powderReceived !== 0 ? entry.powderReceived.toString() : '',
          srpRaw: entry.srp !== 0 ? entry.srp.toString() : '',
        };
      }
      return entry;
    }));
  };

  // Handle inline field change
  const handleInlineChange = (index: number, field: 'powderReceived' | 'srp', value: string) => {
    setJointEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updated = { ...entry };

        if (field === 'powderReceived') {
          updated.powderReceivedRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.powderReceived = 0;
          } else {
            const numValue = parseFloat(value);
            updated.powderReceived = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'srp') {
          updated.srpRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.srp = 0;
          } else {
            const numValue = parseFloat(value);
            updated.srp = isNaN(numValue) ? 0 : numValue;
          }
        }

        return updated;
      }
      return entry;
    }));
  };

  // Handle row save - Navigate to Cutting after save
  const handleRowSave = (index: number) => {
    const entry = jointEntries[index];

    if (!entry.powderReceived || entry.powderReceived < 0) {
      toast.error('Please enter a valid powder received weight');
      return;
    }

    if (!entry.srp || entry.srp < 0) {
      toast.error('Please enter a valid SRP (Majuri)');
      return;
    }

    setIsLoading(true);

    try {
      // Update the store with joint data
      manufacturingStore.updateEntry(entry.id, {
        powderReceived: entry.powderReceived,
        srp: entry.srp,
        isSaved: true,
      });

      toast.success('Joint entry saved successfully! Moving to Cutting...');
      setIsLoading(false);

      // Navigate to Cutting after successful save
      navigate({ to: '/manufacturingprocess/cutting/cuttingdept' });
    } catch (error) {
      console.error('Error saving joint:', error);
      toast.error('Failed to save joint entry');
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = (index: number) => {
    const entry = jointEntries[index];
    if (window.confirm(`Are you sure you want to delete joint entry for "${entry.item}"?`)) {
      setJointEntries(prev => prev.filter((_, i) => i !== index));
      toast.success('Joint entry deleted successfully');
    }
  };

  const formatNumber = (value: number) => {
    if (value === 0) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  const filteredEntries = jointEntries.filter(entry =>
    entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.purity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 md:px-8 md:py-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <PageHeader
              title="Joint Department"
              subtitle="Manage joint entries - Chain Given, Chain Received, Powder, Powder Received, SRP (Majuri)"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              type="text"
              placeholder="Search by item, size or purity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#d3c4af]/10 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f2] text-xs uppercase tracking-[0.15em] text-[#4f4535] dark:bg-slate-800 dark:text-slate-400">
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Sr No</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Date & Time</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Item</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Size</th>
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">Chain Given</th>
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">Chain Received</th>
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">Powder</th>
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">Powder Received</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Purity (टंच)</th>
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">SRP (Majuri)</th>
                  <th className="px-3 py-3 text-center font-semibold lg:px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[#4f4535] dark:text-slate-400">
                      No joint entries found. Please save Soldering entry first.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, index) => (
                    <tr key={entry.id} className="group transition-colors hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-3 text-sm text-[#4f4535] dark:text-slate-400 lg:px-4">
                        {entry.srNo}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {entry.dateTime}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-[#1a1c1b] dark:text-white lg:px-4">
                        {entry.item}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {entry.size}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {formatNumber(entry.chainGiven)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {formatNumber(entry.chainReceived)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-[#1a1c1b] dark:text-white lg:px-4">
                        {formatNumber(entry.powder)}
                      </td>
                      <td className="px-3 py-3 text-right lg:px-4">
                        {entry.isEditing ? (
                          <input
                            type="text"
                            value={entry.powderReceivedRaw !== undefined ? entry.powderReceivedRaw : (entry.powderReceived === 0 ? '' : entry.powderReceived)}
                            onChange={(e) => handleInlineChange(index, 'powderReceived', e.target.value)}
                            placeholder="0.000"
                            className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                          />
                        ) : (
                          <span className="font-mono text-[#1a1c1b] dark:text-white">
                            {formatNumber(entry.powderReceived)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-amber-600 dark:text-amber-400 lg:px-4">
                        {entry.purity}
                      </td>
                      <td className="px-3 py-3 text-right lg:px-4">
                        {entry.isEditing ? (
                          <input
                            type="text"
                            value={entry.srpRaw !== undefined ? entry.srpRaw : (entry.srp === 0 ? '' : entry.srp)}
                            onChange={(e) => handleInlineChange(index, 'srp', e.target.value)}
                            placeholder="0.000"
                            className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                          />
                        ) : (
                          <span className="font-mono text-[#1a1c1b] dark:text-white">
                            {formatNumber(entry.srp)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center lg:px-4">
                        {entry.isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleRowSave(index)}
                              disabled={isLoading}
                              className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRowEdit(index)}
                              className="rounded-lg bg-gray-400 p-1.5 text-white hover:bg-gray-500"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleRowEdit(index)}
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 text-xs text-[#4f4535] dark:text-slate-400">
          Showing {filteredEntries.length} of {jointEntries.length} entries
        </div>
      </div>
    </div>
  );
};

export default JointDept;