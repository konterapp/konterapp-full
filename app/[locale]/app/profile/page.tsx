'use client';

import { useState, useEffect, useCallback } from 'react';
import { KeyRound, Save, Building2, Shield } from 'lucide-react';
import { getProfile, updateProfile, ProfileData } from '@/lib/api/app/profile';
import { useUser } from '@/app/[locale]/app/_context/UserContext';
import { useToast } from '@/components/toast/ToastContainer';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const inputBaseClass =
  'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white';

function inputClass(fieldErrors: Record<string, string[]>, field: string) {
  return `${inputBaseClass} ${
    fieldErrors[field]
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
  }`;
}

export default function ProfilePage() {
  const toast = useToast();
  const { user: contextUser, activeCompanyUuid, refetchUser } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getProfile();
      if (response.status === 'success' && response.data) {
        setProfile(response.data);
        setName(response.data.name);
      } else {
        setError(response.message || 'Gagal memuat data profil');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const activeCompany = profile?.companies.find((c) => c.uuid === activeCompanyUuid)
    ?? profile?.companies.find((c) => c.uuid === contextUser?.active_company_uuid)
    ?? profile?.companies[0];

  const activeRoles = (profile?.roles ?? [])
    .filter((r) => r.companyUuid === (activeCompany?.uuid ?? activeCompanyUuid))
    .map((r) => r.name);

  const handleSubmitName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSavingName(true);
    try {
      const response = await updateProfile({ name });
      if (response.status === 'success') {
        setProfile(response.data ?? profile);
        refetchUser();
        toast.success('Nama berhasil diperbarui');
      } else {
        setError(response.message || 'Gagal memperbarui nama');
        setFieldErrors(response.errors ?? {});
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setFieldErrors({});
    setIsSavingPassword(true);
    try {
      const response = await updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      if (response.status === 'success') {
        toast.success('Password berhasil diganti');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(response.message || 'Gagal mengganti password');
        setFieldErrors(response.errors ?? {});
      }
    } catch {
      setPasswordError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola informasi akun dan keamanan Anda.</p>
        </div>
      </div>

      {/* Info kartu */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#EBC170]/20 flex items-center justify-center text-[#b8904f] text-2xl font-bold uppercase">
          {(profile?.name ?? 'U')[0]}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">{profile?.name}</h2>
          <p className="text-sm text-gray-500">{profile?.email}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Building2 className="w-4 h-4" />
            Perusahaan Aktif
          </div>
          <p className="font-semibold text-gray-900 text-sm">{activeCompany?.name ?? '-'}</p>
          <p className="text-xs text-gray-500 font-mono">{activeCompany?.code ?? ''}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Shield className="w-4 h-4" />
            Role
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {activeRoles.length > 0 ? (
              activeRoles.map((role) => (
                <span key={role} className="text-xs font-medium text-[#b8904f] bg-[#EBC170]/20 rounded-full px-2.5 py-1">
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">-</span>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {error && <Alert variant="error" message={error} />}

      {/* Edit Nama */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Informasi Akun</h2>
        <p className="text-sm text-gray-500 mb-4">Ubah nama yang tampil di aplikasi.</p>
        <form onSubmit={handleSubmitName} className="space-y-5 max-w-lg">
          <div>
            <label htmlFor="profile_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="profile_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
              maxLength={255}
              className={inputClass(fieldErrors, 'name')}
              placeholder="Masukkan nama lengkap"
            />
            {fieldErrors.name?.map((msg) => (
              <div key={msg} className="mt-1 text-sm text-red-600">{msg}</div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">Email tidak dapat diubah sendiri. Hubungi tim KonterApp bila perlu perubahan.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="warning" icon={Save} isLoading={isSavingName} disabled={name.trim() === profile?.name}>
              Simpan Nama
            </Button>
          </div>
        </form>
      </div>

      <hr className="border-gray-200" />

      {/* Ganti Password */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Ganti Password</h2>
        <p className="text-sm text-gray-500 mb-4">Gunakan password baru minimal 8 karakter.</p>
        {passwordError && <Alert variant="error" message={passwordError} className="mb-4" />}
        <form onSubmit={handleSubmitPassword} className="space-y-5 max-w-lg">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
              Password Saat Ini <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="current_password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={inputClass(fieldErrors, 'current_password')}
              placeholder="Masukkan password saat ini"
            />
            {fieldErrors.current_password?.map((msg) => (
              <div key={msg} className="mt-1 text-sm text-red-600">{msg}</div>
            ))}
          </div>
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
              Password Baru <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="new_password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass(fieldErrors, 'new_password')}
              placeholder="Masukkan password baru"
            />
            {fieldErrors.new_password?.map((msg) => (
              <div key={msg} className="mt-1 text-sm text-red-600">{msg}</div>
            ))}
          </div>
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Password Baru <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirm_password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputClass(fieldErrors, 'new_password_confirmation')}
              placeholder="Ulangi password baru"
            />
            {fieldErrors.new_password_confirmation?.map((msg) => (
              <div key={msg} className="mt-1 text-sm text-red-600">{msg}</div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="warning" icon={KeyRound} isLoading={isSavingPassword}>
              Ganti Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
