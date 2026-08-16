'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import { createUser, updateUser, getUser, getRoles, toggleUserActive, UserCreateData, Role } from '@/lib/api/administrator/user';
import { getCompanyOptions, CompanyOption } from '@/lib/api/administrator/company';
import Select2 from '@/components/ui/Select2';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';

interface UserFormProps {
   userUuid?: string;
   mode: 'create' | 'edit';
}

export default function UserForm({ userUuid, mode }: UserFormProps) {
   const router = useRouter();
   const toast = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
   const [error, setError] = useState('');
   const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
   const [roles, setRoles] = useState<Role[]>([]);
   const [companies, setCompanies] = useState<CompanyOption[]>([]);
   const [isActive, setIsActive] = useState(true);
   const [isTogglingActive, setIsTogglingActive] = useState(false);
   const [formData, setFormData] = useState<UserCreateData>({
      name: '',
      email: '',
      password: '',
      company_uuid: '',
      roles: '',
   });

   useEffect(() => {
      fetchCompaniesList();
      if (mode === 'edit' && userUuid) {
         fetchUser();
      }
   }, [mode, userUuid]);

   const fetchRolesByCompany = async (companyUuid: string) => {
      try {
         const response = await getRoles(companyUuid);
         if (response.status === 'success' && response.data) {
            setRoles(response.data);
            return response.data;
         }
      } catch (err) {
         console.error('Failed to fetch roles:', err);
      }
      return [];
   };

   const fetchCompaniesList = async () => {
      try {
         const response = await getCompanyOptions();
         if (response.status === 'success' && response.data) {
            setCompanies(response.data);
         }
      } catch (err) {
         console.error('Failed to fetch companies:', err);
      }
   };

   const fetchUser = async () => {
      if (!userUuid) return;

      try {
         setIsLoadingData(true);
         const userResponse = await getUser(userUuid);

         if (userResponse.status === 'success' && userResponse.data) {
            const defaultCompany = userResponse.data.companies?.find(c => c.is_default) || userResponse.data.companies?.[0];
            const companyUuid = defaultCompany?.uuid || '';

            setFormData({
               name: userResponse.data.name,
               email: userResponse.data.email,
               password: '',
               company_uuid: companyUuid,
               roles: '',
            });

            setIsActive(userResponse.data.is_active ?? true);

            if (companyUuid) {
               const availableRoles = await fetchRolesByCompany(companyUuid);
               const userRoleNames = userResponse.data.roles || [];
               const firstRole = availableRoles.find(role => userRoleNames.includes(role.name));
               setFormData(prev => ({
                  ...prev,
                  roles: firstRole ? firstRole.id : '',
               }));
            }
         } else {
            setError(userResponse.message || 'Gagal memuat daftar user');
         }
      } catch (err: unknown) {
         const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
         setError(errorMsg);
      } finally {
         setIsLoadingData(false);
      }
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: value,
      }));
      if (fieldErrors[name]) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
         });
      }
   };

   const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      const roleId: number | '' = value && value !== '' ? parseInt(value, 10) : '';

      setFormData(prev => ({
         ...prev,
         roles: roleId,
      }));
      if (fieldErrors.roles) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.roles;
            return newErrors;
         });
      }
   };

   const handleCompanyChange = async (companyUuid: string) => {
      setFormData(prev => ({
         ...prev,
         company_uuid: companyUuid,
         roles: '',
      }));
      if (fieldErrors.company_uuid) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.company_uuid;
            return newErrors;
         });
      }
      if (fieldErrors.roles) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.roles;
            return newErrors;
         });
      }
      setRoles([]);
      if (companyUuid) {
         await fetchRolesByCompany(companyUuid);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setFieldErrors({});
      setIsLoading(true);

      try {
         let response;
         const submitData: UserCreateData = { ...formData };

         if (mode === 'edit' && userUuid) {
            const updateData: Partial<UserCreateData> = {
               name: submitData.name,
               email: submitData.email,
               company_uuid: submitData.company_uuid,
               roles: submitData.roles,
            };
            if (formData.password) {
               updateData.password = formData.password;
            }
            response = await updateUser(userUuid, updateData);
         } else {
            response = await createUser(submitData);
         }

         if (response.status === 'success') {
            const successMsg = mode === 'edit' ? 'User berhasil diperbarui' : 'User berhasil ditambahkan';
            toast.success(successMsg);
            router.push('/administrator/users');
         } else {
            if (response.errors) {
               setFieldErrors(response.errors);
            }
            const errorMsg = response.message || (mode === 'edit' ? 'Gagal memperbarui user' : 'Gagal membuat user');
            setError(errorMsg);
            toast.error(errorMsg);
         }
      } catch (err: unknown) {
         const error = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } };
         if (error.response?.status === 422 && error.response?.data?.errors) {
            setFieldErrors(error.response.data.errors);
            const errorMsg = error.response?.data?.message || 'Terjadi kesalahan validasi form';
            setError(errorMsg);
            toast.error(errorMsg);
         } else {
            const errorMsg = error.response?.data?.message || 'Terjadi kesalahan, silakan coba lagi';
            setError(errorMsg);
            toast.error(errorMsg);
         }
      } finally {
         setIsLoading(false);
      }
   };

   const handleToggleActive = async () => {
      if (!userUuid) return;

      try {
         setIsTogglingActive(true);
         const response = await toggleUserActive(userUuid);

         if (response.status === 'success' && response.data) {
            setIsActive(response.data.is_active ?? true);
            const statusMsg = response.data.is_active ? 'User berhasil diaktifkan' : 'User berhasil dinonaktifkan';
            toast.success(statusMsg);
         } else {
            const errorMsg = response.message || 'Gagal mengubah status user';
            toast.error(errorMsg);
         }
      } catch (err: unknown) {
         const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
         toast.error(errorMsg);
      } finally {
         setIsTogglingActive(false);
      }
   };

   if (isLoadingData) {
      return (
         <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <div className="text-center py-8">
                  <div className="text-gray-500">Memuat data...</div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
         <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
               {mode === 'edit' ? 'Edit User' : 'Tambah User Baru'}
            </h1>

            {mode === 'edit' && (
               <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Status User:</span>
                  <button
                     type="button"
                     onClick={handleToggleActive}
                     disabled={isTogglingActive}
                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isActive
                           ? 'bg-green-500 focus:ring-green-500'
                           : 'bg-gray-300 focus:ring-gray-400'
                     } ${isTogglingActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                     <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                           isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                     />
                  </button>
                  <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                     {isActive ? 'Aktif' : 'Tidak Aktif'}
                  </span>
               </div>
            )}
         </div>

         {error && (
            <Alert variant="error" message={error} className="mb-4" />
         )}

         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                     Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="name"
                     name="name"
                     value={formData.name}
                     onChange={handleChange}
                     className={`w-full px-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${fieldErrors.name
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-gray-200 focus:ring-[#EBC170]'
                        }`}
                     placeholder="Masukkan nama..."
                  />
                  {fieldErrors.name && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.name[0]}
                     </div>
                  )}
               </div>

               <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                     Email <span className="text-red-500">*</span>
                  </label>
                  <input
                     type="email"
                     id="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChange}
                     className={`w-full px-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${fieldErrors.email
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-gray-200 focus:ring-[#EBC170]'
                        }`}
                     placeholder="Masukkan email..."
                  />
                  {fieldErrors.email && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.email[0]}
                     </div>
                  )}
               </div>

               <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                     Password {mode === 'create' && <span className="text-red-500">*</span>}
                     {mode === 'edit' && <span className="text-gray-400 text-xs ml-2">(Kosongkan jika tidak ingin mengubah password)</span>}
                  </label>
                  <input
                     type="password"
                     id="password"
                     name="password"
                     value={formData.password}
                     onChange={handleChange}
                     className={`w-full px-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${fieldErrors.password
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-gray-200 focus:ring-[#EBC170]'
                        }`}
                     placeholder={mode === 'create' ? 'Masukkan password...' : 'Masukkan password baru...'}
                  />
                  {fieldErrors.password && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.password[0]}
                     </div>
                  )}
               </div>

               <div>
                  <label htmlFor="company_uuid" className="block text-sm font-medium text-gray-700 mb-2">
                     Perusahaan (Tenant) <span className="text-red-500">*</span>
                  </label>
                  <Select2
                     name="company_uuid"
                     value={formData.company_uuid || null}
                     options={companies.map(c => ({ id: c.uuid, label: `${c.name} (${c.code})` }))}
                     onChange={(e) => handleCompanyChange(e.target.value)}
                     placeholder="Pilih Perusahaan"
                     searchable
                     hasError={!!fieldErrors.company_uuid}
                  />
                  {fieldErrors.company_uuid && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.company_uuid[0]}
                     </div>
                  )}
               </div>

               <div>
                  <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-2">
                     Role <span className="text-red-500">*</span>
                  </label>
                  <Select2
                     name="roles"
                     value={formData.roles || null}
                     options={roles.map(r => ({ id: r.id, label: r.name }))}
                     onChange={handleRoleChange}
                     placeholder={formData.company_uuid ? 'Pilih Role' : 'Pilih Perusahaan dulu'}
                     searchable
                     disabled={!formData.company_uuid}
                     hasError={!!fieldErrors.roles}
                  />
                  {fieldErrors.roles && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.roles[0]}
                     </div>
                  )}
               </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-gray-200">
               <Link href="/administrator/users">
                  <Button type="button" variant="light" icon={X}>
                     Batal
                  </Button>
               </Link>
               <Button
                  type="submit"
                  variant="warning"
                  icon={Save}
                  isLoading={isLoading}
               >
                  Simpan
               </Button>
            </div>
         </form>
      </div>
   );
}
