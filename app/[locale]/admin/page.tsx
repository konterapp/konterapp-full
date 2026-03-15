'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useUser } from './_context/UserContext';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { user, roles, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error === 'unauthorized' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Akses Ditolak</h3>
              <p className="text-sm text-red-700 mt-1">
                Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika ini adalah kesalahan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simple Dashboard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Selamat datang, {user?.name || 'User'}!
        </p>
        {roles.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Roles:</span>
            {roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#142D52] text-white"
              >
                {role}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
