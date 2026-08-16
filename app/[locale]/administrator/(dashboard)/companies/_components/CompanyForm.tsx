'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import { createCompany, updateCompany, getCompany, CompanyCreateData } from '@/lib/api/administrator/company';
import { useToast } from '@/components/toast/ToastContainer';

interface CompanyFormProps {
   companyUuid?: string;
   mode: 'create' | 'edit';
}

export default function CompanyForm({ companyUuid, mode }: CompanyFormProps) {
   const router = useRouter();
   const toast = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
   const [error, setError] = useState('');
   const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
   const [formData, setFormData] = useState<CompanyCreateData>({
      code: '',
      name: '',
      is_active: true,
   });

   useEffect(() => {
      if (mode === 'edit' && companyUuid) {
         fetchCompany();
      }
   }, [mode, companyUuid]);

   const fetchCompany = async () => {
      if (!companyUuid) return;

      try {
         setIsLoadingData(true);
         const response = await getCompany(companyUuid);

         if (response.status === 'success' && response.data) {
            setFormData({
               code: response.data.code,
               name: response.data.name,
               is_active: response.data.is_active,
            });
         } else {
            setError(response.message || 'Gagal memuat data perusahaan');
         }
      } catch {
         setError('Terjadi kesalahan, silakan coba lagi');
      } finally {
         setIsLoadingData(false);
      }
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : value,
      }));
      if (fieldErrors[name]) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
         });
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setFieldErrors({});
      setIsLoading(true);

      try {
         let response;
         if (mode === 'edit' && companyUuid) {
            response = await updateCompany(companyUuid, formData);
         } else {
            response = await createCompany(formData);
         }

         if (response.status === 'success') {
            toast.success(response.message || (mode === 'edit' ? 'Perusahaan berhasil diperbarui' : 'Perusahaan berhasil dibuat'));
            router.push('/administrator/companies');
         } else {
            if (response.errors) {
               setFieldErrors(response.errors);
            }
            setError(response.message || (mode === 'edit' ? 'Gagal memperbarui perusahaan' : 'Gagal membuat perusahaan'));
         }
      } catch {
         setError('Terjadi kesalahan, silakan coba lagi');
      } finally {
         setIsLoading(false);
      }
   };

   if (isLoadingData) {
      return (
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
               <div className="text-gray-500">Memuat data...</div>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
         <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {mode === 'edit' ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}
         </h1>

         {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
               {error}
            </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                     Kode Perusahaan <span className="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="code"
                     name="code"
                     value={formData.code}
                     onChange={handleChange}
                     className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.code
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
                        }`}
                     placeholder="Ex. KTR-7F3QX2"
                  />
                  {fieldErrors.code && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.code[0]}
                     </div>
                  )}
               </div>

               <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                     Nama Perusahaan <span className="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="name"
                     name="name"
                     value={formData.name}
                     onChange={handleChange}
                     className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.name
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
                        }`}
                     placeholder="Masukkan nama perusahaan..."
                  />
                  {fieldErrors.name && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.name[0]}
                     </div>
                  )}
               </div>
            </div>

            <div>
               <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                     type="checkbox"
                     name="is_active"
                     checked={formData.is_active ?? true}
                     onChange={handleChange}
                     className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Perusahaan aktif</span>
               </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
               <Link
                  href="/administrator/companies"
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
               >
                  <X className="w-4 h-4" />
                  <span>Batal</span>
               </Link>
               <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 cursor-pointer text-sm font-semibold bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Menyimpan...' : 'Simpan'}</span>
               </button>
            </div>
         </form>
      </div>
   );
}
