'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { countries, Country } from '@/lib/data/countries';

interface CountryCodeSelectorProps {
    value: string; // ISO code (e.g., 'ID')
    onChange: (country: Country) => void;
    hasError?: boolean;
}

export default function CountryCodeSelector({ value, onChange, hasError = false }: CountryCodeSelectorProps) {
    const [selectedCountry, setSelectedCountry] = useState<Country>(
        countries.find(c => c.code === value) || countries[0]
    );
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Update selected country when value prop changes
    useEffect(() => {
        const country = countries.find(c => c.code === value);
        if (country) {
            setSelectedCountry(country);
        }
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearchQuery('');
        onChange(country);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Country Selector Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border rounded-l-lg bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer ${
                    hasError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-[#EBC170]'
                }`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">{selectedCountry.flag}</span>
                    <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full min-w-[300px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari negara..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Countries List */}
                    <div className="overflow-y-auto max-h-64">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className={`cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                                        selectedCountry.code === country.code ? 'bg-[#EBC170] bg-opacity-20' : ''
                                    }`}
                                >
                                    <span className="text-2xl">{country.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{country.name}</p>
                                    </div>
                                    <span className="text-sm text-gray-600 font-medium">{country.dialCode}</span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">
                                Tidak ada negara ditemukan
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
