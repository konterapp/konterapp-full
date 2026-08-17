'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createCoupon, updateCoupon, getCoupon, getPlansOptions, AdminPlanTier, CouponFormData } from '@/lib/api/administrator/coupon';
import { useToast } from '@/components/toast/ToastContainer';

interface CouponFormModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSaved: () => void;
   couponUuid?: string;
}

interface FormState {
   code: string;
   name: string;
   description: string;
   plan_code: string;
   discount_percent: string;
   max_discount: string;
   usage_limit: string;
   is_active: boolean;
   starts_at: string;
   expires_at: string;
}

const emptyForm: FormState = {
   code: '',
   name: '',
   description: '',
   plan_code: '',
   discount_percent: '',
   max_discount: '',
   usage_limit: '',
   is_active: true,
   starts_at: '',
   expires_at: '',
};

function toLocalInputValue(value?: string | null): string {
   if (!value) return '';
   const date = new Date(value);
   if (Number.isNaN(date.getTime())) return '';
   const pad = (n: number) => String(n).padStart(2, '0');
   return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CouponFormModal({ isOpen, onClose, onSaved, couponUuid }: CouponFormModalProps) {
   const toast = useToast();
   const [form, setForm] = useState<FormState>(emptyForm);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
   const [tiers, setTiers] = useState<AdminPlanTier[]>([]);

   useEffect(() => {
      if (!isOpen) return;

      setForm(emptyForm);
      setFieldErrors({});
      setIsLoading(false);
      fetchPlans();

      if (couponUuid) {
         fetchCoupon(couponUuid);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isOpen, couponUuid]);

   const fetchPlans = async () => {
      try {
         const response = await getPlansOptions();
         if (response.status === 'success' && response.data) {
            setTiers(response.data);
         }
      } catch {
         setTiers([]);
      }
   };

   const fetchCoupon = async (uuid: string) => {
      try {
         setIsLoading(true);
         const response = await getCoupon(uuid);
         if (response.status === 'success' && response.data) {
            const coupon = response.data;
            setForm({
               code: coupon.code,
               name: coupon.name,
               description: coupon.description ?? '',
               plan_code: coupon.plan_code ?? '',
               discount_percent: String(coupon.discount_percent),
               max_discount: coupon.max_discount != null ? String(coupon.max_discount) : '',
               usage_limit: coupon.usage_limit != null ? String(coupon.usage_limit) : '',
               is_active: coupon.is_active,
               starts_at: toLocalInputValue(coupon.starts_at),
               expires_at: toLocalInputValue(coupon.expires_at),
            });
         } else {
            toast.error(response.message || 'Gagal memuat data kupon');
         }
      } catch {
         toast.error('Terjadi kesalahan saat memuat data kupon');
      } finally {
         setIsLoading(false);
      }
   };

   if (!isOpen) return null;

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = type === 'checkbox' && 'checked' in e.target ? e.target.checked : false;
      setForm(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : value,
      }));
   };

   const handleSubmit = async () => {
      setIsSubmitting(true);
      setFieldErrors({});
      try {
         const payload: CouponFormData = {
            code: form.code,
            name: form.name,
            description: form.description || undefined,
            plan_code: form.plan_code || null,
            discount_percent: Number(form.discount_percent),
            max_discount: form.max_discount !== '' ? Number(form.max_discount) : null,
            usage_limit: form.usage_limit !== '' ? Number(form.usage_limit) : null,
            is_active: form.is_active,
            starts_at: form.starts_at || null,
            expires_at: form.expires_at || null,
         };

         const response = couponUuid
            ? await updateCoupon(couponUuid, payload)
            : await createCoupon(payload);

         if (response.status === 'success') {
            toast.success(couponUuid ? 'Kupon berhasil diperbarui' : 'Kupon berhasil dibuat');
            onSaved();
         } else {
            setFieldErrors(response.errors ?? {});
            toast.error(response.message || 'Gagal menyimpan kupon');
         }
      } catch {
         toast.error('Terjadi kesalahan, silakan coba lagi');
      } finally {
         setIsSubmitting(false);
      }
   };

   const inputClass = (name: string) =>
      `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] text-sm bg-white cursor-text ${
         fieldErrors[name] ? 'border-red-400' : 'border-gray-200'
      }`;

   const errorText = (name: string) =>
      fieldErrors[name] ? (
         <p className="text-xs text-red-600 mt-1">{fieldErrors[name].join(', ')}</p>
      ) : null;

   return (
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
         onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) onClose();
         }}
      >
         <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 transform transition-all cursor-default">
            <div className="px-6 py-4 bg-[#142D52] rounded-t-lg flex items-center justify-between">
               <h3 className="text-lg font-semibold text-white">
                  {couponUuid ? 'Edit Kupon' : 'Tambah Kupon'}
               </h3>
               <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-gray-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
               {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Memuat data...</div>
               ) : (
                  <>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kode Kupon *
                           </label>
                           <input
                              type="text"
                              name="code"
                              value={form.code}
                              onChange={handleChange}
                              placeholder="Contoh: RAYA2026"
                              className={`${inputClass('code')} uppercase`}
                              maxLength={50}
                           />
                           {errorText('code')}
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nama Kupon *
                           </label>
                           <input
                              type="text"
                              name="name"
                              value={form.name}
                              onChange={handleChange}
                              placeholder="Contoh: Diskon Lebaran"
                              className={inputClass('name')}
                              maxLength={255}
                           />
                           {errorText('name')}
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           Deskripsi
                        </label>
                        <input
                           type="text"
                           name="description"
                           value={form.description}
                           onChange={handleChange}
                           placeholder="Keterangan singkat untuk admin"
                           className={inputClass('description')}
                           maxLength={255}
                        />
                        {errorText('description')}
                     </div>

                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                            Berlaku untuk Paket
                         </label>
                         <select
                            name="plan_code"
                            value={form.plan_code}
                            onChange={handleChange}
                            className={`${inputClass('plan_code')} cursor-pointer`}
                         >
                            <option value="">Semua paket</option>
                            {tiers.map((tier) => (
                               <optgroup key={tier.uuid} label={`${tier.name} (${tier.max_branches ?? '∞'} cabang, ${tier.max_users ?? '∞'} user)`}>
                                  <option value={tier.code}>
                                     Semua paket {tier.name}
                                  </option>
                                  {tier.plans.map((plan) => (
                                     <option key={plan.uuid} value={plan.code}>
                                        {tier.name} {plan.billing_period === 'yearly' ? 'Tahunan' : plan.billing_period === 'monthly' ? 'Bulanan' : ''} (Rp{plan.price.toLocaleString('id-ID')})
                                     </option>
                                  ))}
                               </optgroup>
                            ))}
                         </select>
                         <p className="text-xs text-gray-400 mt-1">
                            Kosongkan jika kupon berlaku untuk semua paket. Pilih nama tier untuk
                            semua periode paket di tier tersebut.
                         </p>
                         {errorText('plan_code')}
                      </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Diskon (%) *
                           </label>
                           <input
                              type="number"
                              name="discount_percent"
                              value={form.discount_percent}
                              onChange={handleChange}
                              placeholder="Contoh: 20"
                              min={0.01}
                              max={100}
                              step={0.01}
                              className={inputClass('discount_percent')}
                           />
                           {errorText('discount_percent')}
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Maks. Diskon (Rp)
                           </label>
                           <input
                              type="number"
                              name="max_discount"
                              value={form.max_discount}
                              onChange={handleChange}
                              placeholder="Kosongkan jika tanpa batas"
                              min={0}
                              step={1000}
                              className={inputClass('max_discount')}
                           />
                           {errorText('max_discount')}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kuota Pemakaian
                           </label>
                           <input
                              type="number"
                              name="usage_limit"
                              value={form.usage_limit}
                              onChange={handleChange}
                              placeholder="Kosongkan jika tanpa batas"
                              min={1}
                              step={1}
                              className={inputClass('usage_limit')}
                           />
                           {errorText('usage_limit')}
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Berlaku Mulai
                           </label>
                           <input
                              type="datetime-local"
                              name="starts_at"
                              value={form.starts_at}
                              onChange={handleChange}
                              className={inputClass('starts_at')}
                           />
                           {errorText('starts_at')}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Berlaku Sampai
                           </label>
                           <input
                              type="datetime-local"
                              name="expires_at"
                              value={form.expires_at}
                              onChange={handleChange}
                              className={inputClass('expires_at')}
                           />
                           {errorText('expires_at')}
                        </div>
                        <div className="flex items-end pb-1">
                           <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                              <input
                                 type="checkbox"
                                 name="is_active"
                                 checked={form.is_active}
                                 onChange={handleChange}
                                 className="w-4 h-4 rounded border-gray-300 accent-[#142D52] cursor-pointer"
                              />
                              Kupon aktif
                           </label>
                        </div>
                     </div>
                  </>
               )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3">
               <Button onClick={onClose} disabled={isSubmitting} variant="light">
                  Batal
               </Button>
               <Button onClick={handleSubmit} disabled={isSubmitting || isLoading} isLoading={isSubmitting}>
                  {couponUuid ? 'Simpan Perubahan' : 'Buat Kupon'}
               </Button>
            </div>
         </div>
      </div>
   );
}
