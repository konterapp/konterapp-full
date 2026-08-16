'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import UserForm from '../_components/UserForm';

export default function EditUserPage({ params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = use(params);

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/administrator/users"
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Kembali ke Daftar User</span>
                </Link>
            </div>

            <UserForm mode="edit" userUuid={uuid} />
        </div>
    );
}
