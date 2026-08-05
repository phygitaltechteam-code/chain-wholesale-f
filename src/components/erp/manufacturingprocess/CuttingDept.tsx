import React, { useState, useEffect } from 'react';
import { Edit, Trash2, X, Search, Save } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import toast from 'react-hot-toast';
import { manufacturingStore } from '@/utils/manufacturingStore';

interface CuttingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: string;
  chainGiven: number;
  chainReceived: number;
  scrap: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainReceivedRaw?: string;
  scrapRaw?: string;
}

const CuttingDept: React.FC = () => {
  const navigate = useNavigate();
  const [cuttingEntries, setCuttingEntries] = useState<CuttingEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load data from store
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const entries = manufacturingStore.getEntries();
    console.log('📦 Cutting - Store entries:', entries);
    
    const cuttingData = entries.map((entry, index) => ({
      id: entry.id,
      srNo: index + 1,
      dateTime: entry.dateTime || new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      item: entry.item || 'N/A',
      size: entry.size || 'N/A',
      purity: entry.purity || '22K',
      // Chain Given should come from Joint's chainGiven (which is from Soldering)
      // Or from the entry's chainGiven if already set
      chainGiven: entry.chainGiven || entry.chainWeight || 0,
      chainReceived: entry.chainReceived || 0,
      scrap: entry.scrap || 0,
      isEditing: !entry.isSaved,
      isSaved: entry.isSaved || false,
      chainReceivedRaw: entry.chainReceived && entry.chainReceived !== 0 ? entry.chainReceived.toString() : '',
      scrapRaw: entry.scrap && entry.scrap !== 0 ? entry.scrap.toString() : '',
    }));
    
    setCuttingEntries(cuttingData);
  };

  // Handle row edit toggle
  const handleRowEdit = (index: number) => {
    setCuttingEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        return {
          ...entry,
          isEditing: !entry.isEditing,
          chainReceivedRaw: entry.chainReceived !== 0 ? entry.chainReceived.toString() : '',
          scrapRaw: entry.scrap !== 0 ? entry.scrap.toString() : '',
        };
      }
      return entry;
    }));
  };

  // Handle inline field change
  const handleInlineChange = (index: number, field: 'chainReceived' | 'scrap', value: string) => {
    setCuttingEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updated = { ...entry };

        if (field === 'chainReceived') {
          updated.chainReceivedRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.chainReceived = 0;
          } else {
            const numValue = parseFloat(value);
            updated.chainReceived = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'scrap') {
          updated.scrapRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.scrap = 0;
          } else {
            const numValue = parseFloat(value);
            updated.scrap = isNaN(numValue) ? 0 : numValue;
          }
        }

        return updated;
      }
      return entry;
    }));
  };

  // Handle row save - Update store and show success
  const handleRowSave = (index: number) => {
    const entry = cuttingEntries[index];

    if (!entry.chainReceived || entry.chainReceived < 0) {
      toast.error('Please enter a valid chain received weight');
      return;
    }

    if (!entry.scrap || entry.scrap < 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    setIsLoading(true);

    try {
      // Update the store with cutting data
      manufacturingStore.updateEntry(entry.id, {
        chainGiven: entry.chainGiven,
        chainReceived: entry.chainReceived,
        scrap: entry.scrap,
        isSaved: true,
      });

      toast.success('Cutting entry saved successfully!');
      setIsLoading(false);

      // Update the entry to show saved state
      setCuttingEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true } : s
      ));
    } catch (error) {
      console.error('Error saving cutting:', error);
      toast.error('Failed to save cutting entry');
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = (index: number) => {
    const entry = cuttingEntries[index];
    if (window.confirm(`Are you sure you want to delete cutting entry for "${entry.item}"?`)) {
      setCuttingEntries(prev => prev.filter((_, i) => i !== index));
      toast.success('Cutting entry deleted successfully');
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

  const filteredEntries = cuttingEntries.filter(entry =>
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
              title="Cutting Department"
              subtitle="Manage cutting entries - Chain Given, Chain Received, Scrap"
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
                  <th className="px-3 py-3 text-right font-semibold lg:px-4">Scrap</th>
                  <th className="px-3 py-3 text-left font-semibold lg:px-4">Purity (टंच)</th>
                  <th className="px-3 py-3 text-center font-semibold lg:px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#4f4535] dark:text-slate-400">
                      No cutting entries found. Please save Joint entry first.
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
                      <td className="px-3 py-3 text-right lg:px-4">
                        {entry.isEditing ? (
                          <input
                            type="text"
                            value={entry.chainReceivedRaw !== undefined ? entry.chainReceivedRaw : (entry.chainReceived === 0 ? '' : entry.chainReceived)}
                            onChange={(e) => handleInlineChange(index, 'chainReceived', e.target.value)}
                            placeholder="0.000"
                            className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                          />
                        ) : (
                          <span className="font-mono text-[#1a1c1b] dark:text-white">
                            {formatNumber(entry.chainReceived)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right lg:px-4">
                        {entry.isEditing ? (
                          <input
                            type="text"
                            value={entry.scrapRaw !== undefined ? entry.scrapRaw : (entry.scrap === 0 ? '' : entry.scrap)}
                            onChange={(e) => handleInlineChange(index, 'scrap', e.target.value)}
                            placeholder="0.000"
                            className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                          />
                        ) : (
                          <span className="font-mono text-[#1a1c1b] dark:text-white">
                            {formatNumber(entry.scrap)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-amber-600 dark:text-amber-400 lg:px-4">
                        {entry.purity}
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
          Showing {filteredEntries.length} of {cuttingEntries.length} entries
        </div>
      </div>
    </div>
  );
};

export default CuttingDept;