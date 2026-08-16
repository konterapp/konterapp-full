'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import Image from '@/components/ui/Image';
import { Newspaper, Plus, Eye, Edit, Trash2, ImageOff } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Select2 from '@/components/ui/Select2';
import { useToast } from '@/components/toast/ToastContainer';
import { getBeritas, deleteBerita, Berita } from '@/lib/api/app/berita';
import { usePermissions } from '@/lib/hooks/usePermissions';

const NEWS_TYPE_LABELS: Record<string, string> = {
    spotlight: 'Spotlight',
    'rilis-pers': 'Rilis Pers',
    artikel: 'Artikel',
};

export default function BeritaPage() {
    const toast = useToast();
    const { hasPermission } = usePermissions();
    const [beritas, setBeritas] = useState<Berita[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; berita: Berita | null; isLoading: boolean }>({
        isOpen: false,
        berita: null,
        isLoading: false,
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchBeritas = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await getBeritas(currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder, statusFilter || undefined);

            if (response.data) {
                setBeritas(response.data.data);

                if (response.data.meta) {
                    setTotalPages(response.data.meta.last_page);
                    setTotalItems(response.data.meta.total);
                }
            } else if (response.status === 'error') {
                setError(response.message || 'Gagal memuat daftar berita');
            }
        } catch {
            setError('Terjadi kesalahan saat memuat data');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder, statusFilter]);

    useEffect(() => {
        fetchBeritas();
    }, [fetchBeritas]);

    const handleSortChange = (field: string, order: 'asc' | 'desc') => {
        setSortBy(field);
        setSortOrder(order);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleDeleteClick = (berita: Berita) => {
        setDeleteModal({
            isOpen: true,
            berita,
            isLoading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.berita) return;

        setDeleteModal(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await deleteBerita(deleteModal.berita.uuid);

            if (response.status === 'success') {
                toast.success('Berita berhasil dihapus');
                fetchBeritas();
                setDeleteModal({ isOpen: false, berita: null, isLoading: false });
            } else {
                toast.error(response.message || 'Gagal menghapus berita');
                setDeleteModal(prev => ({ ...prev, isLoading: false }));
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
            toast.error(errorMsg);
            setDeleteModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, berita: null, isLoading: false });
    };

    // Define columns
    const columns: Column<Berita>[] = [
        {
            key: 'no',
            label: 'No',
            sortable: false,
            width: '4rem',
            render: (_, row) => {
                const index = beritas.findIndex(b => b.uuid === row.uuid);
                const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                return <span className="text-sm text-gray-600">{rowNumber}</span>;
            },
        },
        {
            key: 'image',
            label: 'Gambar',
            sortable: false,
            width: '5rem',
            render: (_, row) => {
                return row.image_url ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                            src={row.image_url}
                            alt={row.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <ImageOff className="w-5 h-5 text-gray-400" />
                    </div>
                );
            },
        },
        {
            key: 'title',
            label: 'Judul',
            sortable: true,
            sortValue: (row) => row.title.toLowerCase(),
            render: (_, row) => (
                <div className="max-w-md">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{row.title}</p>
                </div>
            ),
        },
        {
            key: 'tags',
            label: 'Tags',
            sortable: false,
            render: (_, row) => (
                <div className="flex flex-wrap gap-1 max-w-xs">
                    {row.tags && row.tags.length > 0 ? (
                        row.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-gray-400">-</span>
                    )}
                    {row.tags && row.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{row.tags.length - 3}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'news_type',
            label: 'Tipe Berita',
            sortable: true,
            render: (_, row) => (
                <span className="text-sm text-gray-600">
                    {row.news_type ? (NEWS_TYPE_LABELS[row.news_type] || row.news_type) : '-'}
                </span>
            ),
        },
        {
            key: 'published_at',
            label: 'Tanggal Publish',
            sortable: true,
            render: (_, row) => (
                <span className="text-sm text-gray-600">
                    {row.published_at ? new Date(row.published_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    }) : '-'}
                </span>
            ),
        },
        {
            key: 'is_published',
            label: 'Status',
            sortable: true,
            render: (_, row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.is_published
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                    {row.is_published ? 'Published' : 'Draft'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Aksi',
            sortable: false,
            width: '10rem',
            className: 'whitespace-nowrap',
            render: (_, row) => {
                const canEdit = hasPermission('admin.berita.update');
                const canDelete = hasPermission('admin.berita.delete');

                return (
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/app/berita/${row.uuid}`}
                            className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2a4061] text-white hover:bg-[#1e2f47] rounded-lg transition-colors text-xs font-medium cursor-pointer"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Detail</span>
                        </Link>
                        {canEdit && (
                            <Link
                                href={`/app/berita/${row.uuid}/edit`}
                                className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
                            </Link>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => handleDeleteClick(row)}
                                className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Hapus</span>
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Daftar Berita</h1>
                    <p className="text-gray-600 mt-1">Kelola berita dan artikel</p>
                </div>
                {hasPermission('admin.berita.create') && (
                    <Link
                        href="/app/berita/create"
                        className="flex items-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Tambah Berita</span>
                    </Link>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Filter */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
                        <Select2
                            name="statusFilter"
                            value={statusFilter}
                            options={[
                                { id: '', label: 'Semua' },
                                { id: '1', label: 'Published' },
                                { id: '0', label: 'Draft' },
                            ]}
                            onChange={handleStatusFilterChange}
                            placeholder="Semua"
                        />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                data={beritas}
                columns={columns}
                emptyMessage="Belum ada berita yang ditambahkan"
                emptyIcon={<Newspaper className="w-16 h-16 text-gray-300 mx-auto" />}
                isLoading={isLoading}
                serverSide={true}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari berita..."
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                getRowId={(row) => row.uuid}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Hapus Berita"
                message={`Apakah Anda yakin ingin menghapus berita "${deleteModal.berita?.title || ''}"? Tindakan ini tidak dapat dibatalkan.`}
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
