'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import RoleForm from '../../_components/RoleForm';

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const roleId = parseInt(id, 10);

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/administrator/roles"
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Kembali ke Daftar Role</span>
                </Link>
            </div>

            <RoleForm mode="edit" roleId={roleId} />
        </div>
    );
}
