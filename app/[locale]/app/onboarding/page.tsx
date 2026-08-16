'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Building2 } from 'lucide-react';
import { useToast } from '@/components/toast/ToastContainer';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { createBranchSchema } from '@/lib/validations/branch';
import { createPaymentMethodSchema } from '@/lib/validations/payment-method';
import { createProductSchema } from '@/lib/validations/product';

const STEPS = ['cabang', 'metode-bayar', 'produk-awal'];
const stepLabels = {
  cabang: 'Langkah 1: Cabang',
  'metode-bayar': 'Langkah 2: Metode Bayar',
  'produk-awal': 'Langkah 3: Produk Awal',
};

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<{
    cabang: { name: string; code: string; address?: string; phone?: string; email?: string };
    'metode-bayar': { type: string; name: string };
    'produk-awal': { name: string; price?: number };
  }>({
    cabang: { name: '', code: '' },
    'metode-bayar': { type: 'cash', name: '' },
    'produk-awal': { name: '' },
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const goTo = (targetStep: number) => {
    setStep(targetStep);
  };

  const validateStep = (): boolean => {
    let valid = true;
    setErrors({});

    if (step === 0) {
      if (!formData.cabang.name?.trim()) {
        setErrors(prev => ({ ...prev, cabang: ['Nama cabang wajib diisi'] }));
        valid = false;
      }
      if (!formData.cabang.code?.trim()) {
        setErrors(prev => ({ ...prev, cabang: ['Kode cabang wajib diisi'] }));
        valid = false;
      }
    }
    if (step === 1) {
      if (!formData['metode-bayar'].name?.trim()) {
        setErrors(prev => ({ ...prev, 'metode-bayar': ['Nama metode bayar wajib diisi'] }));
        valid = false;
      }
    }
    if (step === 2) {
      if (!formData['produk-awal'].name?.trim()) {
        setErrors(prev => ({ ...prev, 'produk-awal': ['Nama produk wajib diisi'] }));
        valid = false;
      }
    }
    return valid;
  };

  const next = async () => {
    if (!validateStep()) return;
    setStep(step + 1);
  };

  const prev = () => {
    setStep(step - 1);
  };

  const submit = async () => {
    if (!validateStep()) return;
    setIsSaving(true);
    try {
      // Siapkan data untuk setiap langkah dengan nilai default
      const branchData = {
        ...formData.cabang,
        address: formData.cabang.address || '',
        phone: formData.cabang.phone || '',
        email: formData.cabang.email || '',
        isActive: true,
        isMain: true,
      };

      const paymentMethodData = {
        ...formData['metode-bayar'],
        type: formData['metode-bayar'].type || 'cash',
        isActive: true,
      };

      const productData = {
        ...formData['produk-awal'],
        isActive: true,
      };

      await Promise.all([
        // Langkah 1: Create Branch
        fetch('/api/app/pos/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branchData),
        }).then((r) => {
          if (!r.ok) throw new Error('Gagal cabang');
        }),
        // Langkah 2: Create Payment Method
        fetch('/api/app/pos/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentMethodData),
        }).then((r) => {
          if (!r.ok) throw new Error('Gagal metode bayar');
        }),
        // Langkah 3: Create Product
        fetch('/api/app/pos/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        }).then((r) => {
          if (!r.ok) throw new Error('Gagal produk');
        }),
      ]);
      toast.success('Onboarding selesai! Perusahaan siap digunakan.');
      router.push('/app');
    } catch (e) {
      toast.error('Gagal menyimpan onboarding. Silakan coba lagi.');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: { ...(prev as any)[name], [name]: value.trim() },
    }));
  }, []);

  const stepClass = (s: number) => `relative flex-1 flex flex-col items-center py-6 ${
    s < step ? 'text-[#142D52]' : 'text-gray-400'
  }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Stepper */}
        <div className="flex justify-between text-sm mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 {stepClass(i)}">
              <div className="w-10 h-10 rounded-full border-2 ${
                i < step ? 'border-[#142D52]' : 'border-gray-300'
              } flex items-center justify-center text-xs font-bold ${
                i < step ? '#142D52' : 'gray-300'
              }">{i + 1}</div>
              <span className="text-xs {i < step ? 'opacity-100' : 'opacity-50'}">
                {/// ts-ignore
                stepLabels[STEPS[i]]}
              </span>
            </div>
          ))}
        </div>

        {/* Form Step */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {stepLabels[STEPS[step]]}

          {/* Navigasi */}
          <div className="flex justify-between mb-6">
            {step > 0 && (
              <Button
                type="button"
                variant="light"
                size="sm"
                onClick={prev}
                className="w-auto"
              >
                Kembali
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={next}
                disabled={isSaving}
                className="w-auto"
              >
                {isSaving ? 'Menyimpan...' : 'Selanjutnya'}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="warning"
                size="sm"
                onClick={submit}
                disabled={isSaving}
                className="w-auto"
              >
                Selesai & Mulai Beroperasi
              </Button>
            )}
          </div>

          {/* Form Konten per Langkah */}
          <form onSubmit={(e) => { e.preventDefault(); next(); }} className="space-y-6 max-w-lg">
            {/* Langkah 1: Cabang */}
            {step === 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Detail Cabang</h2>
                <p className="text-sm text-gray-500 mb-4">Tempat lokasi transaksi Anda.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Cabang</label>
                  <input
                    type="text"
                    name="cabang"
                    id="cabang-name"
                    value={formData.cabang.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                    placeholder="Misal: Cabang Utama"
                  />
                  {errors.cabang?.map((msg) => (
                    <p key={msg} className="mt-1 text-sm text-red-600">{msg}</p>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Cabang</label>
                  <input
                    type="text"
                    name="cabang"
                    id="cabang-code"
                    value={formData.cabang.code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                    placeholder="Misal: C001"
                  />
                  {errors.cabang?.map((msg) => (
                    <p key={msg} className="mt-1 text-sm text-red-600">{msg}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Langkah 2: Metode Bayar */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Metode Pembayaran</h2>
                <p className="text-sm text-gray-500 mb-4">Pilih metode pembayaran yang akan digunakan di cabang ini.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="radio"
                      name="metode-bayar-type"
                      id="cash"
                      value="cash"
                      checked={formData['metode-bayar'].type === 'cash'}
                      onChange={(e) => handleInputChange(e)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="cash" className="ml-2 text-sm font-medium text-gray-700">Tunai</label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      name="metode-bayar-type"
                      id="bcad"
                      value="bank"
                      checked={formData['metode-bayar'].type === 'bank'}
                      onChange={(e) => handleInputChange(e)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="bcad" className="ml-2 text-sm font-medium text-gray-700">BCA</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Metode</label>
                  <input
                    type="text"
                    name="metode-bayar"
                    id="metode-bayar-name"
                    value={formData['metode-bayar'].name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                    placeholder="Misal: Tunai / BCA / QRIS / GoPay"
                  />
                  {errors['metode-bayar']?.map((msg) => (
                    <p key={msg} className="mt-1 text-sm text-red-600">{msg}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Langkah 3: Produk Awal */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Produk Awal</h2>
                <p className="text-sm text-gray-500 mb-4">Tambahkan produk pertama untuk startup cabang Anda.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                  <input
                    type="text"
                    name="produk-awal"
                    id="produk-name"
                    value={formData['produk-awal'].name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                    placeholder="Misal: Nasi Goreng / Minuman Dingin"
                  />
                  {errors['produk-awal']?.map((msg) => (
                    <p key={msg} className="mt-1 text-sm text-red-600">{msg}</p>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Opsional)</label>
                  <input
                    type="number"
                    name="produk-awal"
                    id="produk-harga"
                    value={formData['produk-awal'].price ?? ''}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                    placeholder="Misal: 15000"
                  />
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}