'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, KeyRound, Save, Building2, Shield } from 'lucide-react';
import { getProfile, updateProfile, ProfileData } from '@/lib/api/app/profile';
import { useUser } from '@/app/[locale]/app/_context/UserContext';
import { useToast } from '@/components/toast/ToastContainer';

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Profil Saya</h1>
        <p className="text-gray-600 mt-1">Kelola informasi akun dan keamanan Anda.</p>
      </div>

      {/* Info kartu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#142D52]/5 flex items-center justify-center text-[#142D52] text-2xl font-bold uppercase">
            {(profile?.name ?? 'U')[0]}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
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
                  <span key={role} className="text-xs font-medium text-[#142D52] bg-[#142D52]/5 rounded-full px-2.5 py-1">
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">-</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Edit Nama */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-[#142D52]/5 flex items-center justify-center text-[#142D52]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Informasi Akun</h2>
            <p className="text-xs text-gray-500">Ubah nama yang tampil di aplikasi.</p>
          </div>
        </div>
        <form onSubmit={handleSubmitName} className="space-y-5">
          <div>
            <label htmlFor="profile_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="profile_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
              maxLength={255}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
            />
            {fieldErrors.name?.map((msg) => (
              <p key={msg} className="text-xs text-red-600 mt-1">{msg}</p>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">Email tidak dapat diubah sendiri. Hubungi tim KonterApp bila perlu perubahan.</p>
          </div>
          <button
            type="submit"
            disabled={isSavingName || name.trim() === profile?.name}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSavingName ? 'Menyimpan...' : 'Simpan Nama'}
          </button>
        </form>
      </div>

      {/* Ganti Password */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-[#142D52]/5 flex items-center justify-center text-[#142D52]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Ganti Password</h2>
            <p className="text-xs text-gray-500">Gunakan password baru minimal 8 karakter.</p>
          </div>
        </div>
        {passwordError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {passwordError}
          </div>
        )}
        <form onSubmit={handleSubmitPassword} className="space-y-5">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
              Password Saat Ini
            </label>
            <input
              type="password"
              id="current_password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
            />
            {fieldErrors.current_password?.map((msg) => (
              <p key={msg} className="text-xs text-red-600 mt-1">{msg}</p>
            ))}
          </div>
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
              Password Baru
            </label>
            <input
              type="password"
              id="new_password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
            />
            {fieldErrors.new_password?.map((msg) => (
              <p key={msg} className="text-xs text-red-600 mt-1">{msg}</p>
            ))}
          </div>
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              id="confirm_password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
            />
            {fieldErrors.new_password_confirmation?.map((msg) => (
              <p key={msg} className="text-xs text-red-600 mt-1">{msg}</p>
            ))}
          </div>
          <button
            type="submit"
            disabled={isSavingPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {isSavingPassword ? 'Menyimpan...' : 'Ganti Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
