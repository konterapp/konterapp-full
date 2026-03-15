'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import { createRole, updateRole, getRole, getPermissions, RoleCreateData, Permission } from '@/lib/api/admin/role';
import { useToast } from '@/components/toast/ToastContainer';

interface RoleFormProps {
   roleId?: number;
   mode: 'create' | 'edit';
}

export default function RoleForm({ roleId, mode }: RoleFormProps) {
   const router = useRouter();
   const toast = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
   const [error, setError] = useState('');
   const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
   const [permissions, setPermissions] = useState<Permission[]>([]);
   const [formData, setFormData] = useState<RoleCreateData>({
      name: '',
      permissions: [],
   });

   useEffect(() => {
      fetchPermissionsList();
      if (mode === 'edit' && roleId) {
         fetchRole();
      }
   }, [mode, roleId]);

   const fetchPermissionsList = async () => {
      try {
         const response = await getPermissions();
         if (response.status === 'success' && response.data) {
            setPermissions(response.data);
         }
      } catch (err) {
         console.error('Failed to fetch permissions:', err);
      }
   };

   const fetchRole = async () => {
      if (!roleId) return;

      try {
         setIsLoadingData(true);
         const response = await getRole(roleId);

         if (response.status === 'success' && response.data) {
            setFormData({
               name: response.data.name,
               permissions: response.data.permissions || [],
            });
         } else {
            setError(response.message || 'Gagal memuat daftar role');
         }
      } catch {
         setError('Terjadi kesalahan, silakan coba lagi');
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

   const handlePermissionChange = (permissionName: string) => {
      setFormData(prev => ({
         ...prev,
         permissions: prev.permissions?.includes(permissionName)
            ? prev.permissions.filter(p => p !== permissionName)
            : [...(prev.permissions || []), permissionName],
      }));
      if (fieldErrors.permissions) {
         setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.permissions;
            return newErrors;
         });
      }
   };

   const groupPermissions = () => {
      const groups: Record<string, Permission[]> = {};
      permissions.forEach(permission => {
         const parts = permission.name.split('.');
         const groupKey = parts.slice(0, -1).join('.');
         if (!groups[groupKey]) {
            groups[groupKey] = [];
         }
         groups[groupKey].push(permission);
      });
      return groups;
   };

   const isGroupChecked = (groupKey: string) => {
      const groups = groupPermissions();
      const groupPerms = groups[groupKey] || [];
      return groupPerms.every(p => formData.permissions?.includes(p.name));
   };

   const isGroupIndeterminate = (groupKey: string) => {
      const groups = groupPermissions();
      const groupPerms = groups[groupKey] || [];
      const checkedCount = groupPerms.filter(p => formData.permissions?.includes(p.name)).length;
      return checkedCount > 0 && checkedCount < groupPerms.length;
   };

   const handleGroupChange = (groupKey: string) => {
      const groups = groupPermissions();
      const groupPerms = groups[groupKey] || [];
      const isChecked = isGroupChecked(groupKey);

      if (isChecked) {
         setFormData(prev => ({
            ...prev,
            permissions: prev.permissions?.filter(p => !groupPerms.some(gp => gp.name === p)) || [],
         }));
      } else {
         const newPermissions = [...(formData.permissions || [])];
         groupPerms.forEach(p => {
            if (!newPermissions.includes(p.name)) {
               newPermissions.push(p.name);
            }
         });
         setFormData(prev => ({
            ...prev,
            permissions: newPermissions,
         }));
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setFieldErrors({});
      setIsLoading(true);

      try {
         let response;
         if (mode === 'edit' && roleId) {
            response = await updateRole(roleId, formData);
         } else {
            response = await createRole(formData);
         }

         if (response.status === 'success') {
            toast.success(response.message || (mode === 'edit' ? 'Role berhasil diperbarui' : 'Role berhasil dibuat'));
            router.push('/admin/roles');
         } else {
            if (response.errors) {
               setFieldErrors(response.errors);
            }
            setError(response.message || (mode === 'edit' ? 'Gagal memperbarui role' : 'Gagal membuat role'));
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
            {mode === 'edit' ? 'Edit Role' : 'Tambah Role Baru'}
         </h1>

         {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
               {error}
            </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-6">
            <div>
               <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Role <span className="text-red-500">*</span>
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
                  placeholder="Masukkan nama role..."
               />
               {fieldErrors.name && (
                  <div className="mt-1 text-sm text-red-600">
                     {fieldErrors.name[0]}
                  </div>
               )}
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
               </label>
               <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {Object.entries(groupPermissions()).map(([groupKey, groupPerms]) => {
                        const isChecked = isGroupChecked(groupKey);
                        const isIndeterminate = isGroupIndeterminate(groupKey);

                        return (
                           <div key={groupKey} className="space-y-2">
                              <label className="flex items-center space-x-2 cursor-pointer font-medium">
                                 <input
                                    type="checkbox"
                                    checked={isChecked}
                                    ref={(el) => {
                                       if (el) el.indeterminate = isIndeterminate;
                                    }}
                                    onChange={() => handleGroupChange(groupKey)}
                                    className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170]"
                                 />
                                 <span className="text-sm text-gray-900">{groupKey}</span>
                              </label>
                              <div className="ml-6 space-y-1">
                                 {groupPerms.map((permission) => (
                                    <label
                                       key={permission.name}
                                       className="flex items-center space-x-2 cursor-pointer"
                                    >
                                       <input
                                          type="checkbox"
                                          checked={formData.permissions?.includes(permission.name) || false}
                                          onChange={() => handlePermissionChange(permission.name)}
                                          className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170]"
                                       />
                                       <span className="text-sm text-gray-600">{permission.name}</span>
                                    </label>
                                 ))}
                              </div>
                           </div>
                        );
                     })}
                     {permissions.length === 0 && (
                        <p className="text-sm text-gray-400">Tidak ada permission tersedia</p>
                     )}
                  </div>
               </div>
               {fieldErrors.permissions && (
                  <div className="mt-1 text-sm text-red-600">
                     {fieldErrors.permissions[0]}
                  </div>
               )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
               <Link
                  href="/admin/roles"
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
