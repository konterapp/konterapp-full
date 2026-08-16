'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import BeritaForm from '../../_components/BeritaForm';

interface EditBeritaPageProps {
    params: Promise<{
        uuid: string;
    }>;
}

export default function EditBeritaPage({ params }: EditBeritaPageProps) {
    const { uuid } = use(params);

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/app/berita"
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Kembali ke Daftar Berita</span>
                </Link>
            </div>

            <BeritaForm beritaUuid={uuid} mode="edit" />
        </div>
    );
}
