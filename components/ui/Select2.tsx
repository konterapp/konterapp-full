'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

export interface Select2Option {
  id: number | string;
  label: string;
  [key: string]: unknown;
}

interface Select2Props {
  id?: string;
  name: string;
  value: string | number | null;
  options: Select2Option[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  onSearch?: (term: string) => void;
  getOptionLabel?: (option: Select2Option) => string;
  getOptionValue?: (option: Select2Option) => string | number;
  className?: string;
  buttonClassName?: string;
  hasError?: boolean;
}

export default function Select2({
  name,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  loading = false,
  searchable = false,
  onSearch,
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.id,
  className = '',
  buttonClassName,
  hasError = false,
}: Select2Props) {
  const actualPlaceholder = placeholder || 'Pilih...';
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find(
    (opt) => getOptionValue(opt).toString() === value?.toString()
  );

  // If onSearch is provided, skip client-side filtering (parent manages options via API)
  const filteredOptions = searchable && !onSearch
    ? options.filter((opt) =>
      getOptionLabel(opt).toLowerCase().includes(searchTerm.toLowerCase())
    )
    : options;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownMaxHeight = 240; // max-h-60 = 15rem = 240px
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }

      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, searchable, updatePosition]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (onSearch) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(term);
      }, 300);
    }
  };

  const handleSelect = (option: Select2Option) => {
    const syntheticEvent = {
      target: {
        name,
        value: getOptionValue(option).toString(),
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const syntheticEvent = {
      target: {
        name,
        value: '',
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
  };

  const dropdownContent = isOpen && (
    <div
      ref={portalRef}
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden"
    >
      {searchable && (
        <div className="p-2 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Cari..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170]"
            />
            {onSearch && loading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="overflow-y-auto max-h-48">
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 text-center">
            {onSearch && loading ? 'Memuat...' : 'Tidak ada data'}
          </div>
        ) : (
          filteredOptions.map((option) => {
            const optionValue = getOptionValue(option);
            const optionLabel = getOptionLabel(option);
            const isSelected =
              optionValue.toString() === value?.toString();

            return (
              <button
                key={optionValue}
                type="button"
                onClick={() => handleSelect(option)}
                className={`cursor-pointer w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#EBC170]/10 text-[#EBC170]' : 'text-gray-700'
                  }`}
              >
                {optionLabel}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`w-full px-3 py-3 text-sm border ${buttonClassName || 'rounded-lg'} focus:outline-none focus:ring-2 appearance-none cursor-pointer text-left flex items-center justify-between ${
          disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${hasError
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
          } ${isOpen ? 'ring-2 ring-[#EBC170] border-[#EBC170]' : ''
          }`}
      >
        <span className={selectedOption ? 'text-gray-700' : 'text-gray-400'}>
          {loading
            ? 'Memuat...'
            : selectedOption
              ? getOptionLabel(selectedOption)
              : actualPlaceholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''
              }`}
          />
        </div>
      </button>

      {typeof window !== 'undefined' && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : dropdownContent}
    </div>
  );
}
