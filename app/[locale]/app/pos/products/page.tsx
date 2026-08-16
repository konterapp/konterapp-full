'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Package, Plus, Edit, Trash2, Download, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import DataTable, { Column } from '../../_components/DataTable';
import ConfirmModal from '../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Product {
  uuid: string;
  category_uuid: string;
  category?: {
    uuid: string;
    name: string;
  };
  name: string;
  sku: string;
  description?: string | null;
  barcode?: string | null;
  selling_price: number;
  min_stock: number;
  unit: string;
  is_active: boolean;
  image?: string | null;
  total_stock?: number;
  created_at?: string;
  updated_at?: string;
}

export default function ProductsPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProductUuids, setSelectedProductUuids] = useState<Set<string>>(new Set());
  const [isGeneratingBarcodePdf, setIsGeneratingBarcodePdf] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null; isLoading: boolean }>({
    isOpen: false,
    product: null,
    isLoading: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const selectedCount = selectedProductUuids.size;
  const selectedCurrentPageCount = products.filter((product) => selectedProductUuids.has(product.uuid)).length;
  const isAllCurrentPageSelected = products.length > 0 && selectedCurrentPageCount === products.length;
  const isSomeCurrentPageSelected = selectedCurrentPageCount > 0 && !isAllCurrentPageSelected;

  const fetchProducts = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (sortBy) {
        params.append('sort_by', sortBy);
      }

      if (sortOrder) {
        params.append('sort_order', sortOrder);
      }

      const response = await fetch(`/api/app/pos/products?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setProducts(result.data.data || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
      } else {
        setError(result.message || 'Gagal memuat data produk');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  const handleDeleteClick = (product: Product) => {
    setDeleteModal({
      isOpen: true,
      product,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/app/pos/products/${deleteModal.product.uuid}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Produk berhasil dihapus');
        setSelectedProductUuids((prev) => {
          if (!deleteModal.product?.uuid || !prev.has(deleteModal.product.uuid)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(deleteModal.product.uuid);
          return next;
        });
        setDeleteModal({ isOpen: false, product: null, isLoading: false });
        fetchProducts(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus produk');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, product: null, isLoading: false });
  };

  const handleToggleProductSelection = (uuid: string) => {
    setSelectedProductUuids((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const handleToggleSelectCurrentPage = () => {
    setSelectedProductUuids((prev) => {
      const next = new Set(prev);
      if (isAllCurrentPageSelected) {
        products.forEach((product) => next.delete(product.uuid));
      } else {
        products.forEach((product) => next.add(product.uuid));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedProductUuids(new Set());
  };

  const handleDownloadSelectedBarcodePdf = async () => {
    if (selectedCount === 0) {
      toast.error('Pilih minimal 1 produk untuk download PDF barcode');
      return;
    }

    try {
      setIsGeneratingBarcodePdf(true);
      const response = await fetch('/api/app/pos/products/barcode-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuids: Array.from(selectedProductUuids) }),
      });

      if (!response.ok) {
        let message = 'Gagal membuat PDF barcode';
        try {
          const result = await response.json();
          message = result?.message || message;
        } catch {
          // fallback to default message when response is not JSON
        }
        throw new Error(message);
      }

      const pdfBlob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const matchedFilename = contentDisposition.match(/filename="?([^"]+)"?/i);
      const filename = matchedFilename?.[1] || `barcode-produk-${new Date().toISOString().slice(0, 10)}.pdf`;
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success(`PDF barcode berhasil diunduh (${selectedCount} produk)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat PDF barcode');
    } finally {
      setIsGeneratingBarcodePdf(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns: Column<Product>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={isAllCurrentPageSelected}
          ref={(element) => {
            if (element) {
              element.indeterminate = isSomeCurrentPageSelected;
            }
          }}
          onChange={handleToggleSelectCurrentPage}
          className="w-4 h-4 rounded border-gray-300 text-[#142D52] focus:ring-[#EBC170] cursor-pointer"
          aria-label="Pilih semua produk di halaman ini"
        />
      ),
      sortable: false,
      width: '3rem',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedProductUuids.has(row.uuid)}
          onChange={() => handleToggleProductSelection(row.uuid)}
          className="w-4 h-4 rounded border-gray-300 text-[#142D52] focus:ring-[#EBC170] cursor-pointer"
          aria-label={`Pilih produk ${row.name}`}
        />
      ),
    },
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = products.findIndex(p => p.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'image',
      label: 'Gambar',
      sortable: false,
      width: '4rem',
      render: (_, row) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {row.image ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}${row.image}`}
              alt={row.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nama Produk',
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      width: '20rem',
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      sortable: false,
      width: '12rem',
      render: (_, row) => (
        <p className="text-sm text-gray-600">{row.category?.name || '-'}</p>
      ),
    },
    {
      key: 'selling_price',
      label: 'Harga Jual',
      sortable: true,
      sortValue: (row) => row.selling_price,
      width: '10rem',
      render: (_, row) => (
        <p className="text-sm font-medium text-gray-900">{formatCurrency(row.selling_price)}</p>
      ),
    },
    {
      key: 'total_stock',
      label: 'Total Stok',
      sortable: true,
      sortValue: (row) => row.total_stock || 0,
      width: '8rem',
      render: (_, row) => {
        const totalStock = row.total_stock || 0;
        const isLowStock = totalStock <= row.min_stock;
        return (
          <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
            {totalStock}
            {isLowStock && <span className="ml-1 text-xs">(Low)</span>}
          </span>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: false,
      width: '8rem',
      render: (_, row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.is_active ? 'Aktif' : 'Non-aktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          {hasPermission('admin.pos.product.update') && (
            <Link
              href={`/app/pos/products/${row.uuid}/edit`}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </Link>
          )}
          {hasPermission('admin.pos.product.delete') && (
            <button
              onClick={() => handleDeleteClick(row)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">Produk</h1>
          <p className="text-gray-600 mt-1">Kelola produk untuk sistem POS.</p>
        </div>
        {hasPermission('admin.pos.product.create') && (
          <Link
            href="/app/pos/products/create"
            className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Produk</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={products}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari produk..."
        actionComponent={(
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-[#F6E7C6] text-[#6A4B16]">
                {selectedCount} dipilih
              </span>
            )}
            <button
              type="button"
              onClick={handleDownloadSelectedBarcodePdf}
              disabled={selectedCount === 0 || isGeneratingBarcodePdf}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#142D52] text-white hover:bg-[#0f2442] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingBarcodePdf ? 'Memproses...' : 'Download PDF Barcode'}</span>
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        )}
        emptyMessage="Tidak ada produk ditemukan"
        emptyIcon={<Package className="w-16 h-16 text-gray-300 mx-auto" />}
        serverSide={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        isLoading={isLoading}
        getRowId={(row) => row.uuid}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${deleteModal.product?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
