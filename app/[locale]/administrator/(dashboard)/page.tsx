'use client';

import { useAdministrator } from '../_context/AdministratorContext';

export default function AdministratorDashboardPage() {
  const { administrator, isLoading } = useAdministrator();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#142D52] mb-2">
        {isLoading ? 'Memuat...' : `Selamat datang, ${administrator?.name ?? 'Administrator'}`}
      </h1>
      <p className="text-gray-600 mb-6">
        Ini adalah dashboard administrator platform KonterApp.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-sm text-gray-500">
          Fitur manajemen tenant dan billing akan segera hadir di sini.
        </p>
      </div>
    </div>
  );
}
