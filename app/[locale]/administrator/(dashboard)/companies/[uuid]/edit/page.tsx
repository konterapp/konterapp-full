'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import CompanyForm from '../../_components/CompanyForm';

export default function EditCompanyPage({ params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = use(params);

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/administrator/companies"
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Kembali ke Daftar Perusahaan</span>
                </Link>
            </div>

            <CompanyForm mode="edit" companyUuid={uuid} />
        </div>
    );
}
