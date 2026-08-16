'use client';

import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import CompanyForm from '../_components/CompanyForm';

export default function CreateCompanyPage() {
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

            <CompanyForm mode="create" />
        </div>
    );
}
