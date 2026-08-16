'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { loginAdministrator } from '@/lib/api/administrator/auth';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function AdministratorLoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginAdministrator(email, password);

      if (response.status === 'success' && response.data) {
        const redirectParam = searchParams.get('redirect');
        router.push(redirectParam || '/administrator');
      } else {
        setError(response.message || 'Email atau password salah');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1E3A] px-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#EBC170]/10 flex items-center justify-center text-[#EBC170] mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">KonterApp Administrator</h1>
          <p className="text-gray-400 text-sm text-center">
            Akses khusus untuk administrator platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-transparent transition-all"
              placeholder="administrator@konterapp.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-lg font-bold text-[#0B1E3A] bg-[#EBC170] hover:bg-[#d6af63] focus:ring-4 focus:ring-[#EBC170]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[#0B1E3A]/30 border-t-[#0B1E3A] rounded-full animate-spin"></div>
                <span>Memproses...</span>
              </div>
            ) : (
              'Masuk sebagai Administrator'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
