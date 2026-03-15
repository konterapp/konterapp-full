'use client';

import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import RoleForm from '../_components/RoleForm';

export default function CreateRolePage() {
   return (
      <div className="p-6">
         <div className="mb-6">
            <Link
               href="/admin/roles"
               className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
               <ArrowLeft className="w-5 h-5" />
               <span>Kembali ke Daftar</span>
            </Link>
         </div>

         <RoleForm mode="create" />
      </div>
   );
}
