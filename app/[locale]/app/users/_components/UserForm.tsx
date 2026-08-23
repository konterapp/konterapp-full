'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';

interface RoleOption {
  uuid: string;
  name: string;
  has_branch_access: boolean;
}

interface BranchOption {
  uuid: string;
  name: string;
  code: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  roleUuid: string;
  branchUuids: string[];
  isActive: boolean;
}

interface UserFormProps {
  userId?: string;
  mode: 'create' | 'edit';
}

export default function UserForm({ userId, mode }: UserFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    roleUuid: '',
    branchUuids: [],
    isActive: true,
  });

  useEffect(() => {
    fetchRoles();
    fetchBranches();
    if (mode === 'edit' && userId) {
      fetchUser();
    }
  }, [mode, userId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/app/users/roles');
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        setRoles(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/app/users/branches');
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        setBranches(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchUser = async () => {
    if (!userId) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/app/users/${userId}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setFormData({
          name: result.data.name,
          email: result.data.email,
          password: '',
          roleUuid: result.data.roles?.[0]?.uuid || '',
          branchUuids: (result.data.branches || []).map((b: BranchOption) => b.uuid),
          isActive: result.data.is_active ?? true,
        });
      } else {
        setError(result.message || 'Gagal memuat data user');
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

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const selectRole = (uuid: string) => {
    const role = roles.find(r => r.uuid === uuid);
    setFormData(prev => ({
      ...prev,
      roleUuid: uuid,
      // Role dengan akses semua cabang tidak butuh pilihan cabang -- kosongkan
      // supaya tidak ada seleksi cabang lama yang nyangkut kalau ganti balik
      // ke role terbatas.
      branchUuids: role?.has_branch_access ? [] : prev.branchUuids,
    }));

    if (fieldErrors.role_uuid) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.role_uuid;
        return newErrors;
      });
    }
  };

  const toggleBranch = (uuid: string) => {
    setFormData(prev => ({
      ...prev,
      branchUuids: prev.branchUuids.includes(uuid)
        ? prev.branchUuids.filter(b => b !== uuid)
        : [...prev.branchUuids, uuid],
    }));

    if (fieldErrors.branch_uuids) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.branch_uuids;
        return newErrors;
      });
    }
  };

  const selectedRole = roles.find(r => r.uuid === formData.roleUuid);
  const needsBranchSelection = selectedRole ? !selectedRole.has_branch_access : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setFieldErrors({});

    if (!formData.roleUuid) {
      setFieldErrors({ role_uuid: ['Pilih salah satu role'] });
      toast.error('Pilih salah satu role');
      return;
    }

    setIsLoading(true);

    try {
      const url = mode === 'edit' && userId ? `/api/app/users/${userId}` : '/api/app/users';
      const method = mode === 'edit' && userId ? 'PATCH' : 'POST';

      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        role_uuid: formData.roleUuid,
        branch_uuids: formData.branchUuids,
      };

      if (mode === 'edit') {
        payload.is_active = formData.isActive;
        if (formData.password) {
          payload.password = formData.password;
        }
      } else {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.status === 'success') {
        const successMsg =
          result.message || (mode === 'edit' ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
        toast.success(successMsg);
        router.push('/app/users');
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        const errorMsg = result.message || `Gagal ${mode === 'edit' ? 'mengubah' : 'menambah'} user`;
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
        {mode === 'edit' ? 'Edit User' : 'Tambah User Baru'}
      </h1>

      {error && (
        <Alert variant="error" message={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap <span className="text-red-500">*</span>
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
              placeholder="Masukkan nama lengkap"
            />
            {fieldErrors.name && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</div>
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.email
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="nama@contoh.com"
            />
            {fieldErrors.email && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password {mode === 'create' && <span className="text-red-500">*</span>}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
              fieldErrors.password
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
            }`}
            placeholder={
              mode === 'edit'
                ? 'Kosongkan jika tidak ingin mengubah password'
                : 'Minimal 8 karakter'
            }
          />
          {fieldErrors.password && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</div>
          )}
        </div>

        {mode === 'edit' && (
          <div>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Akun Aktif</p>
                <p className="text-xs text-gray-500">
                  User nonaktif tidak dapat login ke aplikasi.
                </p>
              </div>
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Pilih satu role untuk user ini.
          </p>
          {fieldErrors.role_uuid && (
            <div className="mt-1 mb-2 text-sm text-red-600">{fieldErrors.role_uuid[0]}</div>
          )}
          <div className="flex flex-wrap gap-3">
            {roles.map(role => {
              const selected = formData.roleUuid === role.uuid;
              return (
                <label
                  key={role.uuid}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
                    selected
                      ? 'border-[#EBC170] bg-[#FFF7E6] text-gray-900 font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role_uuid"
                    checked={selected}
                    onChange={() => selectRole(role.uuid)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  {role.name}
                </label>
              );
            })}
            {roles.length === 0 && (
              <p className="text-sm text-gray-500">
                Belum ada role. Buat role terlebih dahulu di menu Role.
              </p>
            )}
          </div>
        </div>

        {needsBranchSelection && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cabang <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Role ini tidak punya akses ke semua cabang -- pilih cabang tempat user ini ditempatkan.
            </p>
            {fieldErrors.branch_uuids && (
              <div className="mt-1 mb-2 text-sm text-red-600">{fieldErrors.branch_uuids[0]}</div>
            )}
            <div className="flex flex-wrap gap-3">
              {branches.map(branch => {
                const checked = formData.branchUuids.includes(branch.uuid);
                return (
                  <label
                    key={branch.uuid}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
                      checked
                        ? 'border-[#EBC170] bg-[#FFF7E6] text-gray-900 font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBranch(branch.uuid)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    {branch.name}
                  </label>
                );
              })}
              {branches.length === 0 && (
                <p className="text-sm text-gray-500">
                  Belum ada cabang. Buat cabang terlebih dahulu di menu Cabang.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
