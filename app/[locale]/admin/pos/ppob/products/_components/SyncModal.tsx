'use client';

import { useState } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';

const CATEGORIES = ['PULSA', 'DATA', 'PLNPRA', 'PLNPASCA', 'TELKOM', 'PDAM', 'BPJS', 'EMONEY', 'GAME'];

interface SyncModalProps {
  onClose: () => void;
  onSynced: () => void;
}

export default function SyncModal({ onClose, onSynced }: SyncModalProps) {
  const [provider, setProvider] = useState('digiflazz');
  const [category, setCategory] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<Array<{ category: string; success: boolean; message: string }>>([]);

  const handleSync = async () => {
    setIsSyncing(true);
    setResults([]);

    if (provider === 'digiflazz' && category === 'ALL') {
      try {
        const response = await fetch('/api/admin/pos/ppob-products/sync-all', { method: 'POST' });
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const syncResults = Object.entries(result.data).map(([cat, count]) => ({
            category: cat,
            success: true,
            message: `${count} produk`,
          }));
          setResults(syncResults);
        } else {
          setResults([{ category: 'ALL', success: false, message: result.message || 'Sync gagal' }]);
        }
      } catch {
        setResults([{ category: 'ALL', success: false, message: 'Gagal menghubungi server' }]);
      }

      onSynced();
      setIsSyncing(false);
      return;
    }

    const categoriesToSync = category === 'ALL' ? CATEGORIES : [category];
    const syncResults: Array<{ category: string; success: boolean; message: string }> = [];

    for (const cat of categoriesToSync) {
      try {
        const response = await fetch('/api/admin/pos/ppob-products/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, category: cat }),
        });
        const result = await response.json();

        syncResults.push({
          category: cat,
          success: result.status === 'success',
          message: result.message || (result.status === 'success' ? 'Sync berhasil' : 'Sync gagal'),
        });
      } catch {
        syncResults.push({ category: cat, success: false, message: 'Gagal menghubungi server' });
      }

      setResults([...syncResults]);
    }

    onSynced();
    setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-[#142D52]">Sync Produk dari Provider</h3>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="rajabiller">RajaBiller</option>
              <option value="digiflazz">Digiflazz</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="ALL">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500">Produk yang sudah ada akan diperbarui, produk baru akan ditambahkan.</p>

          {results.length > 0 && (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={`${r.category}-${i}`}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    r.success ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  <span className="font-medium">{r.category}:</span> {r.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tutup
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#EBC170] px-4 py-2 text-sm font-medium text-gray-900 hover:bg-[#EBC170]/80 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
