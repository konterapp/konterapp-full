'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { getPosSettings, updatePosSettings, PosSettings } from '@/lib/api/app/company';
import { useUser } from '@/app/[locale]/app/_context/UserContext';
import { useToast } from '@/components/toast/ToastContainer';

export default function PosSettingsPage() {
  const toast = useToast();
  const { refetchUser } = useUser();
  const [settings, setSettings] = useState<PosSettings | null>(null);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getPosSettings();

      if (response.status === 'success' && response.data) {
        setSettings(response.data);
        setAllowNegativeStock(response.data.allow_negative_stock);
      } else {
        setError(response.message || 'Gagal memuat pengaturan POS');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const dirty = settings !== null && allowNegativeStock !== settings.allow_negative_stock;

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      const response = await updatePosSettings({ allow_negative_stock: allowNegativeStock });

      if (response.status === 'success' && response.data) {
        setSettings(response.data);
        setAllowNegativeStock(response.data.allow_negative_stock);
        // Refresh session supaya POS page langsung mendapati nilai baru
        // lewat useUser() tanpa perlu login ulang.
        await refetchUser();
        toast.success('Pengaturan POS berhasil diperbarui');
      } else {
        setError(response.message || 'Gagal memperbarui pengaturan POS');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      </div>
    );
  }

  const toggle = () => setAllowNegativeStock((prev) => !prev);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Pengaturan POS</h1>
        <p className="text-gray-600 mt-1">
          Atur perilaku kasir &amp; transaksi penjualan untuk company ini.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">Boleh Jual Stok Minus</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-md">
              Izinkan kasir menjual produk <b>barang</b> meskipun stoknya habis atau
              kurang dari jumlah yang dijual. Jika diaktifkan, stok bisa menjadi
              negatif (tanpa batas bawah) dan tercatat di laporan persediaan.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Produk jasa/digital tidak terpengaruh setting ini — selalu bisa dijual.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowNegativeStock}
            aria-label="Aktifkan izin jual stok minus"
            onClick={toggle}
            className={`relative inline-flex w-12 h-7 shrink-0 rounded-full transition-colors cursor-pointer ${
              allowNegativeStock ? 'bg-[#142D52]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform cursor-pointer ${
                allowNegativeStock ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!dirty || isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
}