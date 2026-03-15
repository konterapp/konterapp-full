'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import Image from '@/components/ui/Image';
import { ArrowLeft, Edit, Trash2, Calendar, User, Tag } from 'lucide-react';
import ConfirmModal from '../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { getBerita, deleteBerita, Berita } from '@/lib/api/admin/berita';
import { usePermissions } from '@/lib/hooks/usePermissions';

const NEWS_TYPE_LABELS: Record<string, string> = {
    spotlight: 'Spotlight',
    'rilis-pers': 'Rilis Pers',
    artikel: 'Artikel',
};

const CATEGORY_LABELS: Record<string, string> = {
    music: 'Music',
    'sport-wellness': 'Sport & Wellness',
    culinary: 'Culinary',
    creative: 'Creative',
    carnaval: 'Carnaval',
    'art-culture': 'Art & Culture',
    mice: 'MICE',
};

interface BeritaDetailPageProps {
    params: Promise<{
        uuid: string;
    }>;
}

export default function BeritaDetailPage({ params }: BeritaDetailPageProps) {
    const { uuid } = use(params);
    const router = useRouter();
    const toast = useToast();
    const { hasPermission } = usePermissions();
    const [berita, setBerita] = useState<Berita | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; isLoading: boolean }>({
        isOpen: false,
        isLoading: false,
    });

    useEffect(() => {
        fetchBerita();
    }, [uuid]);

    const fetchBerita = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await getBerita(uuid);

            if (response.status === 'success' && response.data) {
                setBerita(response.data);
            } else {
                setError(response.message || 'Gagal memuat data berita');
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setDeleteModal({ isOpen: true, isLoading: false });
    };

    const handleDeleteConfirm = async () => {
        setDeleteModal(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await deleteBerita(uuid);

            if (response.status === 'success') {
                toast.success('Berita berhasil dihapus');
                router.push('/admin/berita');
            } else {
                toast.error(response.message || 'Gagal menghapus berita');
                setDeleteModal(prev => ({ ...prev, isLoading: false }));
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus berita';
            toast.error(errorMsg);
            setDeleteModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, isLoading: false });
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                    <div className="text-gray-500">Memuat data...</div>
                </div>
            </div>
        );
    }

    if (error || !berita) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                    <div className="text-red-500 mb-4">{error || 'Berita tidak ditemukan'}</div>
                    <Link
                        href="/admin/berita"
                        className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke daftar</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        href="/admin/berita"
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Detail Berita</h1>
                        <p className="text-gray-600 text-sm">Lihat informasi lengkap berita</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {hasPermission('admin.berita.update') && (
                        <Link
                            href={`/admin/berita/${uuid}/edit`}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-900 bg-[#EBC170] hover:bg-[#d4ab5f] rounded-lg transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                        </Link>
                    )}
                    {hasPermission('admin.berita.delete') && (
                        <button
                            onClick={handleDeleteClick}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Hapus</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Hero Image */}
                {berita.image_url && (
                    <div className="relative w-full h-64 md:h-96">
                        <Image
                            src={berita.image_url}
                            alt={berita.title}
                            fill
                            sizes="100vw"
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="p-6">
                    {/* Status Badge */}
                    <div className="flex items-center space-x-3 mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${berita.is_published
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                            {berita.is_published ? 'Published' : 'Draft'}
                        </span>
                        {berita.news_type && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {NEWS_TYPE_LABELS[berita.news_type] || berita.news_type}
                            </span>
                        )}
                        {berita.category && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                {CATEGORY_LABELS[berita.category] || berita.category}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        {berita.title}
                    </h2>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                        {berita.author && (
                            <div className="flex items-center space-x-1.5">
                                <User className="w-4 h-4" />
                                <span>{berita.author}</span>
                            </div>
                        )}
                        <div className="flex items-center space-x-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(berita.published_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Konten</h3>
                        <div
                            className="prose max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: berita.content }}
                        />
                    </div>

                    {/* Tags */}
                    {berita.tags && berita.tags.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                                <Tag className="w-4 h-4" />
                                <span>Tags</span>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {berita.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Meta */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
                        {berita.created_at && (
                            <div>
                                <span>Dibuat: </span>
                                <span className="font-medium">{new Date(berita.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}</span>
                            </div>
                        )}
                        {berita.updated_at && (
                            <div>
                                <span>Terakhir diubah: </span>
                                <span className="font-medium">{new Date(berita.updated_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Hapus Berita"
                message={`Apakah Anda yakin ingin menghapus berita "${berita.title}"?`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                onConfirm={handleDeleteConfirm}
                onClose={handleDeleteCancel}
                type="danger"
                isLoading={deleteModal.isLoading}
            />
        </div>
    );
}
