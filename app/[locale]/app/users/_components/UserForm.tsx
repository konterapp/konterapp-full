'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X, User } from 'lucide-react';
import { createUser, updateUser, getUser, getRoles, toggleUserActive, UserCreateData, Role } from '@/lib/api/app/user';
import { getWilayah, WilayahOption } from '@/lib/api/app/location';
import CountryCodeSelector from '@/components/ui/CountryCodeSelector';
import Select2 from '@/components/ui/Select2';
import Alert from '@/components/ui/Alert';
import Image from '@/components/ui/Image';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';
import type { Country } from '@/lib/data/countries';

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
   const [wilayahProvinces, setWilayahProvinces] = useState<WilayahOption[]>([]);
   const [wilayahCities, setWilayahCities] = useState<WilayahOption[]>([]);
   const [isLoadingWilayahCities, setIsLoadingWilayahCities] = useState(false);
   const [selectedWilayahProvince, setSelectedWilayahProvince] = useState<string>('');
   const [selectedWilayahCity, setSelectedWilayahCity] = useState<string>('');
   const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
   const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
   const [isActive, setIsActive] = useState(true);
   const [isTogglingActive, setIsTogglingActive] = useState(false);
   const [formData, setFormData] = useState<UserCreateData>({
      name: '',
      email: '',
      password: '',
      roles: '',
      phone: '',
      phone_without_dc: '',
      dc: '+62',
      iso: 'ID',
      title: '',
      company: '',
      work_unit: '',
      admin_scope: '',
      wilayah_kode: '',
   });

   useEffect(() => {
      fetchRolesList();
      fetchWilayahProvinces();
      if (mode === 'edit' && userUuid) {
         fetchUser();
      }
   }, [mode, userUuid]);

   const fetchRolesList = async () => {
      try {
         const response = await getRoles();
         if (response.status === 'success' && response.data) {
            setRoles(response.data);
         }
      } catch (err) {
         console.error('Failed to fetch roles:', err);
      }
   };

   const fetchWilayahProvinces = async () => {
      try {
         const response = await getWilayah();
         if (response.status === 'success' && response.data) {
            setWilayahProvinces(response.data);
         }
      } catch (err) {
         console.error('Failed to fetch wilayah provinces:', err);
      }
   };

   const fetchWilayahCities = async (provinceKode: string) => {
      try {
         setIsLoadingWilayahCities(true);
         const response = await getWilayah(provinceKode);
         if (response.status === 'success' && response.data) {
            setWilayahCities(response.data);
         }
      } catch (err) {
         console.error('Failed to fetch wilayah cities:', err);
      } finally {
         setIsLoadingWilayahCities(false);
      }
   };

   const fetchUser = async () => {
      if (!userUuid) return;

      try {
         setIsLoadingData(true);
         const [userResponse, rolesResponse] = await Promise.all([
            getUser(userUuid),
            getRoles(),
         ]);

         if (userResponse.status === 'success' && userResponse.data) {
            if (rolesResponse.status === 'success' && rolesResponse.data) {
               setRoles(rolesResponse.data);
            }

            const userRoleNames = userResponse.data.roles || [];
            const availableRoles = rolesResponse.status === 'success' && rolesResponse.data ? rolesResponse.data : roles;
            const firstRole = availableRoles.find(role => userRoleNames.includes(role.name));
            const roleId = firstRole ? firstRole.id : '';

            setFormData({
               name: userResponse.data.name,
               email: userResponse.data.email,
               password: '',
               roles: roleId,
               phone: userResponse.data.phone || '',
               phone_without_dc: userResponse.data.phone_without_dc || '',
               dc: userResponse.data.dc || '+62',
               iso: userResponse.data.iso || 'ID',
               title: userResponse.data.title || '',
               company: userResponse.data.company || '',
               work_unit: userResponse.data.work_unit || '',
               admin_scope: userResponse.data.admin_scope || '',
               wilayah_kode: userResponse.data.wilayah_kode || '',
            });

            setIsActive(userResponse.data.is_active ?? true);

            if (userResponse.data.avatar_url) {
               setProfilePhotoPreview(userResponse.data.avatar_url);
            }

            // Load wilayah state from wilayah_kode
            if (userResponse.data.wilayah_kode) {
               const kode = userResponse.data.wilayah_kode;
               const parts = kode.split('.');
               const provinceKode = parts[0];
               setSelectedWilayahProvince(provinceKode);
               fetchWilayahCities(provinceKode);
               if (parts.length >= 2) {
                  setSelectedWilayahCity(parts[0] + '.' + parts[1]);
               }
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
         admin_scope: '',
         wilayah_kode: '',
      }));
      setSelectedWilayahProvince('');
      setSelectedWilayahCity('');
      setWilayahCities([]);
      if (fieldErrors.roles) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.roles;
            return newErrors;
         });
      }
   };

   const handleAdminScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setFormData(prev => ({
         ...prev,
         admin_scope: value,
      }));
      if (fieldErrors.admin_scope) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.admin_scope;
            return newErrors;
         });
      }
   };

   const handleCountryCodeChange = (country: Country) => {
      setFormData(prev => ({
         ...prev,
         dc: country.dialCode,
         iso: country.code,
      }));
      if (fieldErrors.phone_without_dc) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.phone_without_dc;
            return newErrors;
         });
      }
   };

   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const phoneValue = e.target.value;
      setFormData(prev => ({
         ...prev,
         phone_without_dc: phoneValue,
         phone: prev.dc + phoneValue,
      }));
      if (fieldErrors.phone_without_dc) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.phone_without_dc;
            return newErrors;
         });
      }
   };

   const handleWilayahProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const kode = e.target.value || '';
      setSelectedWilayahProvince(kode);
      setSelectedWilayahCity('');
      setWilayahCities([]);

      setFormData(prev => ({
         ...prev,
         wilayah_kode: kode || '',
      }));

      if (kode) {
         fetchWilayahCities(kode);
      }

      if (fieldErrors.wilayah_kode) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.wilayah_kode;
            return newErrors;
         });
      }
   };

   const handleWilayahCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const kode = e.target.value || '';
      setSelectedWilayahCity(kode);

      setFormData(prev => ({
         ...prev,
         wilayah_kode: kode || prev.wilayah_kode,
      }));

      if (fieldErrors.wilayah_kode) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.wilayah_kode;
            return newErrors;
         });
      }
   };

   const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setProfilePhoto(file);
         const reader = new FileReader();
         reader.onloadend = () => {
            setProfilePhotoPreview(reader.result as string);
         };
         reader.readAsDataURL(file);
      }
   };

   const selectedRole = roles.find(r => r.id === formData.roles);
   const requiresLocation = selectedRole && (
      selectedRole.name === 'pemda' ||
      selectedRole.name === 'pemprov' ||
      selectedRole.name === 'user' ||
      selectedRole.name === 'verifikator'
   );
   const requiresAdminScope = selectedRole && (selectedRole.name === 'curator' || selectedRole.name === 'verifikator');

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setFieldErrors({});
      setIsLoading(true);

      try {
         let response;
         const submitData: UserCreateData = {
            ...formData,
            profile_photo: profilePhoto || undefined,
            profile_photo_formated: profilePhotoPreview && !profilePhoto ? true : false,
         };

         if (mode === 'edit' && userUuid) {
            const updateData: Partial<UserCreateData> = {
               name: submitData.name,
               email: submitData.email,
               roles: submitData.roles,
               phone: submitData.phone,
               phone_without_dc: submitData.phone_without_dc,
               dc: submitData.dc,
               iso: submitData.iso,
               title: submitData.title,
               company: submitData.company,
               work_unit: submitData.work_unit,
               admin_scope: submitData.admin_scope,
               wilayah_kode: submitData.wilayah_kode,
               profile_photo: submitData.profile_photo,
               profile_photo_formated: submitData.profile_photo_formated,
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
            router.push('/app/users');
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
            {/* Profile Photo Section */}
            <div className="pb-4 border-b border-gray-200">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                     Foto Profil
                  </label>
                  <div className="flex items-start gap-4">
                     <div className="flex-shrink-0">
                        {profilePhotoPreview ? (
                           <Image
                              src={profilePhotoPreview}
                              alt="Profile Photo"
                              width={80}
                              height={80}
                              className={`w-20 h-20 rounded-lg border-2 object-cover bg-white ${fieldErrors.profile_photo ? 'border-red-500' : 'border-gray-200'}`}
                           />
                        ) : (
                           <div className={`w-20 h-20 rounded-lg border-2 border-dashed bg-gray-50 flex items-center justify-center ${fieldErrors.profile_photo ? 'border-red-500' : 'border-gray-300'}`}>
                              <User className="w-8 h-8 text-gray-400" />
                           </div>
                        )}
                     </div>

                     <div className="flex-1">
                        <input
                           type="file"
                           id="profile_photo"
                           accept=".jpg,.jpeg,.png"
                           onChange={(e) => {
                              handleProfilePhotoChange(e);
                              if (fieldErrors.profile_photo) {
                                 setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.profile_photo;
                                    return newErrors;
                                 });
                              }
                           }}
                           className="hidden"
                        />
                        <label
                           htmlFor="profile_photo"
                           className={`inline-flex items-center px-4 py-2 bg-white border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${fieldErrors.profile_photo ? 'border-red-500 hover:border-red-600' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                           <User className="w-4 h-4 mr-2" />
                           {profilePhotoPreview ? 'Ubah' : 'Upload'}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                           Square, 300x300px, max 5MB
                        </p>
                        {fieldErrors.profile_photo && (
                           <div className="mt-1 text-sm text-red-600">
                              {fieldErrors.profile_photo[0]}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                     Telepon <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                     <CountryCodeSelector
                        value={formData.iso || 'ID'}
                        onChange={handleCountryCodeChange}
                        hasError={!!fieldErrors.phone_without_dc}
                     />
                     <input
                        type="tel"
                        id="phone"
                        name="phone_without_dc"
                        value={formData.phone_without_dc || ''}
                        onChange={handlePhoneChange}
                        className={`flex-1 px-3 py-2.5 text-sm border border-l-0 rounded-r-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${fieldErrors.phone_without_dc
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-200 focus:ring-[#EBC170]'
                           }`}
                        placeholder="81233453678"
                     />
                  </div>
                  {fieldErrors.phone_without_dc && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.phone_without_dc[0]}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                     Jabatan
                  </label>
                  <input
                     type="text"
                     id="title"
                     name="title"
                     value={formData.title || ''}
                     onChange={handleChange}
                     className={`w-full px-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${fieldErrors.title
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-gray-200 focus:ring-[#EBC170]'
                        }`}
                     placeholder="Ex. Marketing Manager"
                  />
                  {fieldErrors.title && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.title[0]}
                     </div>
                  )}
               </div>

               <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                     Perusahaan
                  </label>
                  <input
                     type="text"
                     id="company"
                     name="company"
                     value={formData.company || ''}
                     onChange={handleChange}
                     className={`w-full px-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${fieldErrors.company
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-gray-200 focus:ring-[#EBC170]'
                        }`}
                     placeholder="Your Company"
                  />
                  {fieldErrors.company && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.company[0]}
                     </div>
                  )}
               </div>

               <div>
                  <label htmlFor="work_unit" className="block text-sm font-medium text-gray-700 mb-2">
                     Divisi
                  </label>
                  <input
                     type="text"
                     id="work_unit"
                     name="work_unit"
                     value={formData.work_unit || ''}
                     onChange={handleChange}
                     className={`w-full px-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${fieldErrors.work_unit
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-gray-200 focus:ring-[#EBC170]'
                        }`}
                     placeholder="Ex. Marketing"
                  />
                  {fieldErrors.work_unit && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.work_unit[0]}
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
                     placeholder="Pilih Role"
                     searchable
                     hasError={!!fieldErrors.roles}
                  />
                  {fieldErrors.roles && (
                     <div className="mt-1 text-sm text-red-600">
                        {fieldErrors.roles[0]}
                     </div>
                  )}
               </div>
            </div>

            {requiresAdminScope && (
               <div className="grid grid-cols-1 gap-6">
                  <div>
                     <label htmlFor="admin_scope" className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Scope <span className="text-red-500">*</span>
                     </label>
                     <Select2
                        name="admin_scope"
                        value={formData.admin_scope || null}
                        options={[
                           { id: 'daerah', label: 'Daerah' },
                           { id: 'nasional', label: 'Nasional' },
                           { id: 'internasional', label: 'Internasional' },
                        ]}
                        onChange={handleAdminScopeChange}
                        placeholder="Pilih Scope Admin"
                        searchable
                        hasError={!!fieldErrors.admin_scope}
                     />
                     {fieldErrors.admin_scope && (
                        <div className="mt-1 text-sm text-red-600">
                           {fieldErrors.admin_scope[0]}
                        </div>
                     )}
                  </div>
               </div>
            )}

            {requiresLocation && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label htmlFor="wilayah_province" className="block text-sm font-medium text-gray-700 mb-2">
                        Provinsi
                     </label>
                     <Select2
                        name="wilayah_province"
                        value={selectedWilayahProvince || null}
                        options={wilayahProvinces.map(w => ({ id: w.kode, label: w.nama }))}
                        onChange={handleWilayahProvinceChange}
                        placeholder="Pilih Provinsi"
                        searchable
                        hasError={!!fieldErrors.wilayah_kode}
                     />
                     {fieldErrors.wilayah_kode && !selectedWilayahProvince && (
                        <div className="mt-1 text-sm text-red-600">
                           {fieldErrors.wilayah_kode[0]}
                        </div>
                     )}
                  </div>

                  <div>
                     <label htmlFor="wilayah_city" className="block text-sm font-medium text-gray-700 mb-2">
                        Kabupaten/Kota
                     </label>
                     <Select2
                        name="wilayah_city"
                        value={selectedWilayahCity || null}
                        options={wilayahCities.map(w => ({ id: w.kode, label: w.nama }))}
                        onChange={handleWilayahCityChange}
                        placeholder="Pilih Kota"
                        searchable
                        disabled={!selectedWilayahProvince}
                        loading={isLoadingWilayahCities}
                        hasError={!!fieldErrors.wilayah_kode}
                     />
                     {fieldErrors.wilayah_kode && selectedWilayahProvince && (
                        <div className="mt-1 text-sm text-red-600">
                           {fieldErrors.wilayah_kode[0]}
                        </div>
                     )}
                  </div>
               </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-gray-200">
               <Link href="/app/users">
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
