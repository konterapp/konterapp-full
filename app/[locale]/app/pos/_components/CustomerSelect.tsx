"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Plus, X, User } from "lucide-react";
import { Customer, searchCustomers, createCustomer } from "@/lib/api/app/customer";

interface CustomerSelectProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

export default function CustomerSelect({ selectedCustomer, onSelect }: CustomerSelectProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await searchCustomers(search);
        if (response.data) {
          setResults(response.data);
        }
      } catch {
        // ignore
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const response = await createCustomer({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
      });

      if (response.status === "success" && response.data) {
        onSelect(response.data);
        setShowCreateForm(false);
        setIsOpen(false);
        setNewName("");
        setNewPhone("");
        setSearch("");
      }
    } catch {
      // ignore
    } finally {
      setIsCreating(false);
    }
  };

  if (selectedCustomer) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">{selectedCustomer.name}</p>
            {selectedCustomer.phone && <p className="text-xs text-blue-600">{selectedCustomer.phone}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="cursor-pointer rounded p-1 transition-colors hover:bg-blue-100"
        >
          <X className="h-4 w-4 text-blue-600" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari pelanggan (opsional)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
        />
      </div>

      {isOpen && (search.trim() || showCreateForm) && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {!showCreateForm ? (
            <>
              {results.length > 0 ? (
                results.map((customer) => (
                  <button
                    key={customer.uuid}
                    type="button"
                    onClick={() => {
                      onSelect(customer);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="flex w-full cursor-pointer items-center space-x-2 px-4 py-2 text-left hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                    </div>
                  </button>
                ))
              ) : search.trim() ? (
                <div className="px-4 py-3 text-sm text-gray-500">Tidak ditemukan</div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(true);
                  setNewName(search);
                }}
                className="flex w-full cursor-pointer items-center space-x-2 border-t px-4 py-2 text-left font-medium text-[#EBC170] hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Tambah Pelanggan Baru</span>
              </button>
            </>
          ) : (
            <div className="space-y-3 p-4">
              <p className="text-sm font-medium text-gray-700">Pelanggan Baru</p>
              <input
                type="text"
                placeholder="Nama *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                autoFocus
              />
              <input
                type="text"
                placeholder="No. Telepon"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                  className="flex-1 cursor-pointer rounded-lg bg-[#EBC170] px-3 py-2 text-sm font-medium text-gray-900 hover:bg-[#d4ab5f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
