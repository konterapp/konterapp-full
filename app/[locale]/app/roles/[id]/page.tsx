'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Loader2, Edit, Check, Minus } from 'lucide-react';
import { getRole, getPermissions, Role, Permission } from '@/lib/api/app/role';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = use(params);
   const roleId = parseInt(id, 10);
   const { hasPermission } = usePermissions();

   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState('');
   const [role, setRole] = useState<Role | null>(null);
   const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

   useEffect(() => {
      let isCancelled = false;

      const loadData = async () => {
         try {
            setIsLoading(true);
            setError('');

            const [roleResponse, permissionsResponse] = await Promise.all([
               getRole(roleId),
               getPermissions(),
            ]);

            if (isCancelled) return;

            if (roleResponse.status === 'success' && roleResponse.data) {
               setRole(roleResponse.data);
            } else {
               setError(roleResponse.message || 'Gagal memuat daftar role');
            }

            if (permissionsResponse.status === 'success' && permissionsResponse.data) {
               setAllPermissions(permissionsResponse.data);
            }
         } catch {
            if (isCancelled) return;
            setError('Terjadi kesalahan saat memuat data');
         } finally {
            if (!isCancelled) {
               setIsLoading(false);
            }
         }
      };

      if (roleId) {
         loadData();
      }

      return () => {
         isCancelled = true;
      };
   }, [roleId]);

   const groupedPermissions = useMemo(() => {
      const groups: Record<string, Permission[]> = {};
      allPermissions.forEach(permission => {
         const parts = permission.name.split('.');
         const groupKey = parts.slice(0, -1).join('.');
         if (!groups[groupKey]) {
            groups[groupKey] = [];
         }
         groups[groupKey].push(permission);
      });
      return groups;
   }, [allPermissions]);

   if (isLoading) {
      return (
         <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                  <div className="text-gray-500 mt-2">Memuat data...</div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         <div>
            <Link
               href="/app/roles"
               className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
               <ArrowLeft className="w-5 h-5" />
               <span>Kembali ke Daftar Role</span>
            </Link>
         </div>

         {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
               {error}
            </div>
         ) : !role ? (
            <div className="text-center py-12">
               <p className="text-gray-500">Role tidak ditemukan</p>
            </div>
         ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>
                  {hasPermission('admin.role.update') && (
                     <Link
                        href={`/app/roles/${roleId}/edit`}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold"
                     >
                        <Edit className="w-4 h-4" />
                        <span>Edit Role</span>
                     </Link>
                  )}
               </div>

               {role.users_count !== undefined && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Pengguna</label>
                     <p className="text-sm text-gray-600">{role.users_count} pengguna memiliki role ini</p>
                  </div>
               )}

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Permissions ({role.permissions?.length || 0})
                  </label>
                  <div className="border border-gray-200 rounded-lg p-4">
                     {Object.keys(groupedPermissions).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {Object.entries(groupedPermissions).map(([groupKey, groupPerms]) => {
                              const checkedCount = groupPerms.filter(p => role.permissions?.includes(p.name)).length;
                              const allChecked = checkedCount === groupPerms.length;

                              return (
                                 <div key={groupKey} className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                       <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                                          allChecked
                                             ? 'bg-green-100'
                                             : checkedCount > 0
                                                ? 'bg-amber-100'
                                                : 'bg-gray-100'
                                       }`}>
                                          {allChecked ? (
                                             <Check className="w-3 h-3 text-green-600" />
                                          ) : checkedCount > 0 ? (
                                             <Minus className="w-3 h-3 text-amber-600" />
                                          ) : (
                                             <Minus className="w-3 h-3 text-gray-400" />
                                          )}
                                       </span>
                                       <span className="text-sm font-semibold text-gray-900">{groupKey}</span>
                                       <span className="text-xs text-gray-400">({checkedCount}/{groupPerms.length})</span>
                                    </div>
                                    <div className="ml-7 flex flex-wrap gap-1.5">
                                       {groupPerms.map((permission) => {
                                          const isActive = role.permissions?.includes(permission.name) || false;
                                          const actionName = permission.name.split('.').pop() || permission.name;
                                          return (
                                             <span
                                                key={permission.name}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md ${
                                                   isActive
                                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                                      : 'bg-gray-50 text-gray-400 border border-gray-200'
                                                }`}
                                             >
                                                {isActive && <Check className="w-3 h-3" />}
                                                {actionName}
                                             </span>
                                          );
                                       })}
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     ) : role.permissions && role.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                           {role.permissions.map((permission) => (
                              <span
                                 key={permission}
                                 className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-green-50 text-green-700 border border-green-200"
                              >
                                 <Check className="w-3 h-3" />
                                 {permission}
                              </span>
                           ))}
                        </div>
                     ) : (
                        <p className="text-sm text-gray-400">Tidak ada permission</p>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
