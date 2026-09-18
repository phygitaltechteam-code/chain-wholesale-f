import React, {useState, useRef, useEffect} from 'react';
import {ChevronDown, Plus, Check, X} from 'lucide-react';

export interface DropdownItem {
  id: string;
  title: string;
  subtitle?: string;
  extra?: string | number;
  data?: any;
}

interface GenericSearchDropdownProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  items: DropdownItem[];
  selectedItem?: DropdownItem | null;
  onSelect: (item: DropdownItem | null) => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  className?: string;
}

export const GenericSearchDropdown: React.FC<GenericSearchDropdownProps> = ({
  label,
  required = false,
  placeholder = 'Type to search...',
  items,
  selectedItem,
  onSelect,
  onAddNew,
  addNewLabel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(selectedItem.title);
    } else if (!isTyping) {
      setSearchTerm('');
    }
  }, [selectedItem, isTyping]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsTyping(false);
        if (selectedItem) {
          setSearchTerm(selectedItem.title);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedItem]);

  const filteredItems = items.filter((item) => {
    if (!isTyping || !searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query))
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsTyping(true);
    setIsOpen(true);
    if (!val.trim()) {
      onSelect(null);
    }
  };

  const handleSelect = (item: DropdownItem) => {
    onSelect(item);
    setSearchTerm(item.title);
    setIsTyping(false);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm('');
    setIsTyping(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Input Line */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#d3c4af]/30 bg-white py-2.5 pl-3.5 pr-12 text-sm text-[#1a1c1b] outline-none transition-all placeholder:text-[#817563] hover:border-[#785600]/50 focus:border-[#785600] focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />

        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-slate-400">
          {selectedItem && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            tabIndex={-1}
            className="rounded p-0.5 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Options Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="max-h-44 overflow-y-auto">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                  selectedItem?.id === item.id
                    ? 'bg-[#785600]/10 font-semibold text-[#785600] dark:bg-amber-400/10 dark:text-amber-400'
                    : 'text-[#1a1c1b] dark:text-slate-200'
                }`}
              >
                <div>
                  <p className="font-semibold text-xs text-[#1a1c1b] dark:text-white">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-[10px] text-[#817563]">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.extra && (
                    <span className="font-bold text-[#785600] dark:text-amber-400">
                      {item.extra}
                    </span>
                  )}
                  {selectedItem?.id === item.id && (
                    <Check
                      size={14}
                      className="text-[#785600] dark:text-amber-400"
                    />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Add New Action Inside Dropdown */}
          {onAddNew && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsTyping(false);
                onAddNew();
              }}
              className="flex w-full items-center gap-2 border-t border-[#d3c4af]/10 bg-slate-50/70 px-3.5 py-2.5 text-xs font-bold text-[#785600] transition-colors hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-slate-800"
            >
              <Plus size={14} />
              <span>{addNewLabel || 'Add New'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GenericSearchDropdown;
