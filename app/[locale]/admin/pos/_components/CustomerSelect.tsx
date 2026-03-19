'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Customer } from '@/lib/api/admin/customer';

interface CustomerSelectProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

export default function CustomerSelect({ selectedCustomer, onSelect }: CustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {selectedCustomer ? (
        <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
            <p className="text-xs text-gray-500">{selectedCustomer.phone || selectedCustomer.email}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null as any)}
            className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full px-3 py-2 text-left text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            + Pilih Pelanggan (Opsional)
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari pelanggan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-sm focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-2">
                {isLoading ? (
                  <div className="text-center py-4 text-sm text-gray-500">Memuat...</div>
                ) : customers.length > 0 ? (
                  customers.map((customer) => (
                    <button
                      key={customer.uuid}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone || customer.email}</p>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">
                    {searchQuery ? 'Tidak ada pelanggan ditemukan' : 'Belum ada pelanggan'}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
