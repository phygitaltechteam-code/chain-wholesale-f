import {Search, UserPlus, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import z from 'zod';

// Karigar Schema for validation
const KarigarSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  openingBalance: z.number().min(0, 'Opening balance cannot be negative'),
});

interface KarigarSearchKarigar {
  id: string;
  fullName?: string;
  fullname?: string;
  phoneNumber?: string;
  address?: string;
}

interface KarigarSearchProps {
  selectedKarigar: KarigarSearchKarigar | null;
  onSelectKarigar: (Karigar: KarigarSearchKarigar) => void;
  onClearKarigar: () => void;
  Karigars: KarigarSearchKarigar[];
  isLoading?: boolean;
  onAddNewKarigar?: () => void;
}

export const KarigarSearch: React.FC<KarigarSearchProps> = ({
  selectedKarigar,
  onSelectKarigar,
  onClearKarigar,
  Karigars,
  isLoading = false,
  onAddNewKarigar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getKarigarName = (Karigar: KarigarSearchKarigar) =>
    Karigar.fullname || Karigar.fullName || '';

  const filteredKarigars = Karigars.filter((Karigar) => {
    const name = getKarigarName(Karigar).toLowerCase();
    const phone = Karigar.phoneNumber || '';
    const query = searchQuery.toLowerCase();

    return name.includes(query) || phone.includes(searchQuery);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  const handleSelectKarigar = (Karigar: KarigarSearchKarigar) => {
    onSelectKarigar(Karigar);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleAddKarigar = () => {
    onAddNewKarigar?.();
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full">
      <div ref={dropdownRef} className="relative w-full">
        <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#4f4535] md:h-5 md:w-5" />

        {selectedKarigar ? (
          <div className="flex items-center justify-between rounded-lg bg-[#f4f4f2] py-3 pl-10 pr-3 md:py-4 md:pl-12 md:pr-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white">
                {getKarigarName(selectedKarigar)}
                {selectedKarigar.phoneNumber && (
                  <> - {selectedKarigar.phoneNumber}</>
                )}
              </p>

              {selectedKarigar.address && (
                <p className="mt-1 truncate text-xs text-[#4f4535] dark:text-slate-400">
                  {selectedKarigar.address}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClearKarigar}
              className="ml-2 rounded-full p-1 transition-colors hover:bg-[#e8e8e6] dark:hover:bg-slate-700"
              title="Clear Karigar"
            >
              <X size={16} className="text-[#4f4535] dark:text-slate-300" />
            </button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              placeholder="Search by Karigar name or phone..."
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full rounded-lg border-0 bg-[#f4f4f2] py-3 pl-10 pr-3 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white md:py-4 md:pl-12 md:pr-4"
            />

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-60 overflow-auto rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {isLoading && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-[#4f4535] dark:text-slate-400">
                      Loading Karigars...
                    </p>
                  </div>
                )}

                {!isLoading && filteredKarigars.length > 0 && (
                  <>
                    {filteredKarigars.map((Karigar) => (
                      <div
                        key={Karigar.id}
                        onClick={() => handleSelectKarigar(Karigar)}
                        className="cursor-pointer border-b border-[#f4f4f2] p-3 transition-colors hover:bg-[#f4f4f2] dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <p className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                          {getKarigarName(Karigar)}
                        </p>

                        {Karigar.phoneNumber && (
                          <p className="text-xs text-[#4f4535] dark:text-slate-400">
                            {Karigar.phoneNumber}
                          </p>
                        )}

                        {Karigar.address && (
                          <p className="mt-1 truncate text-xs text-[#4f4535] dark:text-slate-400">
                            {Karigar.address}
                          </p>
                        )}
                      </div>
                    ))}

                    {onAddNewKarigar && (
                      <div
                        onClick={handleAddKarigar}
                        className="cursor-pointer border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-3 transition-colors hover:bg-[#f4f4f2] dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-2 text-[#785600] dark:text-amber-400">
                          <UserPlus className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Add New Karigar
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!isLoading && filteredKarigars.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-[#4f4535] dark:text-slate-400">
                      {searchQuery
                        ? 'No Karigar found'
                        : 'No Karigars added yet'}
                    </p>

                    {onAddNewKarigar && (
                      <button
                        type="button"
                        onClick={handleAddKarigar}
                        className="mt-2.5 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-[#785600] transition-colors hover:bg-amber-100 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>+ Add New Karigar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
