'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Save, X, ShieldCheck } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';
import { PERMISSIONS } from '@/lib/modules/roles/permissions';

const MODULE_LABELS: Record<string, string> = {
  user: 'User',
  role: 'Role',
};

const FEATURE_LABELS: Record<string, string> = {
  sale: 'Penjualan',
  product: 'Produk',
  category: 'Kategori',
  unit: 'Satuan',
  supplier: 'Supplier',
  purchase: 'Pembelian',
  'stock-movement': 'Mutasi Stok',
  report: 'Laporan',
  'payment-method': 'Metode Pembayaran',
  branch: 'Cabang/Lokasi',
  ppob: 'PPOB',
};

const ACTION_LABELS: Record<string, string> = {
  index: 'Lihat',
  create: 'Tambah',
  update: 'Edit',
  delete: 'Hapus',
};

function permissionLabel(permission: string): string {
  const [module, feature, action] = permission.split('.');
  if (module === 'pos') {
    const featureLabel = FEATURE_LABELS[feature] ?? feature;
    const actionLabel = ACTION_LABELS[action] ?? action;
    return `${actionLabel} ${featureLabel}`;
  }
  const moduleLabel = MODULE_LABELS[module] ?? module;
  const actionLabel = ACTION_LABELS[feature] ?? feature;
  return `${actionLabel} ${moduleLabel}`;
}

function permissionSection(permission: string): string {
  const [module, feature] = permission.split('.');
  if (module === 'pos') {
    return FEATURE_LABELS[feature] ?? feature;
  }
  return MODULE_LABELS[module] ?? module;
}

interface RoleFormData {
  name: string;
  permissions: string[];
  isFullAccess: boolean;
}

interface RoleFormProps {
  roleId?: string;
  mode: 'create' | 'edit';
}

export default function RoleForm({ roleId, mode }: RoleFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    permissions: [],
    isFullAccess: false,
  });

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const permission of PERMISSIONS) {
      const section = permissionSection(permission);
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)!.push(permission);
    }
    return Array.from(groups.entries());
  }, []);

  useEffect(() => {
    if (mode === 'edit' && roleId) {
      fetchRole();
    }
  }, [mode, roleId]);

  const fetchRole = async () => {
    if (!roleId) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/app/roles/${roleId}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setFormData({
          name: result.data.name,
          permissions: result.data.permissions || [],
          isFullAccess: result.data.is_full_access || false,
        });
      } else {
        setError(result.message || 'Gagal memuat data role');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: nextValue,
    }));

    if (name === 'isFullAccess' && nextValue) {
      setFormData(prev => ({ ...prev, permissions: [] }));
    }

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const togglePermission = (permission: string) => {
    if (formData.isFullAccess) return;
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const url = mode === 'edit' && roleId ? `/api/app/roles/${roleId}` : '/api/app/roles';
      const method = mode === 'edit' && roleId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          permissions: formData.isFullAccess ? [] : formData.permissions,
          is_full_access: formData.isFullAccess,
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        const successMsg = mode === 'edit' ? 'Role berhasil diperbarui' : 'Role berhasil ditambahkan';
        toast.success(successMsg);
        router.push('/app/roles');
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        const errorMsg = result.message || `Gagal ${mode === 'edit' ? 'mengubah' : 'menambah'} role`;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {mode === 'edit' ? 'Edit Role' : 'Tambah Role Baru'}
      </h1>

      {error && (
        <Alert variant="error" message={error} className="mb-4" />
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
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
              fieldErrors.name
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
            }`}
            placeholder="Contoh: Supervisor, Gudang, Owner"
          />
          {fieldErrors.name && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</div>
          )}
        </div>

        <div>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              name="isFullAccess"
              checked={formData.isFullAccess}
              onChange={handleChange}
              className="w-4 h-4 cursor-pointer"
            />
            <ShieldCheck className="w-5 h-5 text-[#EBC170]" />
            <div>
              <p className="text-sm font-medium text-gray-900">Akses Penuh</p>
              <p className="text-xs text-gray-500">
                Role dengan akses penuh dapat melakukan semua aksi di aplikasi.
              </p>
            </div>
          </label>
        </div>

        {!formData.isFullAccess && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Izin Akses
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Pilih aksi yang boleh dilakukan oleh role ini.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissionGroups.map(([section, permissions]) => (
                <div key={section} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                    {section}
                  </p>
                  <div className="space-y-2">
                    {permissions.map(permission => (
                      <label
                        key={permission}
                        className={`flex items-center gap-2 text-sm text-gray-700 cursor-pointer ${
                          formData.permissions.includes(permission)
                            ? 'text-gray-900 font-medium'
                            : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        {permissionLabel(permission)}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link href="/app/roles">
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
