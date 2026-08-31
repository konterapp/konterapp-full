'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { Landmark, Plus, Eye } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { getBankAgentTransactions, BankAgentTransaction } from '@/lib/api/app/bank-agent-transaction';

interface BranchOption {
  uuid: string;
  name: string;
  code?: string;
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  deposit: 'Setor Tunai',
  withdrawal: 'Tarik Tunai',
  transfer: 'Transfer Saldo',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function BankAgentTransactionsPage() {
  const { hasPermission } = usePermissions();
  const [transactions, setTransactions] = useState<BankAgentTransaction[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [branchUuid, setBranchUuid] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetch('/api/app/pos/branches/options')
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success' && result.data) setBranches(result.data);
      })
      .catch(() => {});
  }, []);

  const fetchTransactions = useCallback(
    async (page: number) => {
      try {
        setIsLoading(true);
        setError('');
        const result = await getBankAgentTransactions({
          page,
          perPage: itemsPerPage,
          search: debouncedSearch,
          branchUuid: branchUuid || undefined,
        });
        if (result.status === 'success' && result.data) {
          setTransactions(result.data.data || []);
          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        } else {
          setError('Gagal memuat data transaksi');
        }
      } catch {
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage, debouncedSearch, branchUuid]
  );

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, fetchTransactions]);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const filterComponent = useMemo(
    () => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
        <select
          value={branchUuid}
          onChange={(e) => { setBranchUuid(e.target.value); setCurrentPage(1); }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
        >
          <option value="">Semua Cabang</option>
          {branches.map((branch) => (
            <option key={branch.uuid} value={branch.uuid}>{branch.name}</option>
          ))}
        </select>
      </div>
    ),
    [branchUuid, branches]
  );

  const columns: Column<BankAgentTransaction>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = transactions.findIndex((t) => t.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      width: '4rem',
      render: (_, row) => (
        <Link
          href={`/app/pos/bank-agent-transactions/${row.uuid}`}
          className="inline-flex cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
          title="Lihat Detail"
        >
          <Eye className="h-4 w-4 text-gray-600" />
        </Link>
      ),
    },
    {
      key: 'transaction_number',
      label: 'No. Transaksi',
      sortable: false,
      render: (_, row) => (
        <div>
          <span className="text-sm font-mono text-gray-700">{row.transaction_number}</span>
          <p className="text-xs text-gray-400">{formatDateTime(row.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'transaction_type',
      label: 'Jenis',
      sortable: false,
      render: (_, row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.cash_direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {TRANSACTION_TYPE_LABELS[row.transaction_type] || row.transaction_type}
        </span>
      ),
    },
    {
      key: 'branch',
      label: 'Cabang',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-700">{row.branch?.name || '-'}</span>,
    },
    {
      key: 'account',
      label: 'Akun',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-700">{row.account?.name || '-'}</span>,
    },
    {
      key: 'base_amount',
      label: 'Nominal',
      sortable: false,
      render: (_, row) => <span className="text-sm font-semibold text-gray-900">{formatCurrency(row.base_amount)}</span>,
    },
    {
      key: 'fee',
      label: 'Komisi',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-700">{row.fee > 0 ? formatCurrency(row.fee) : '-'}</span>,
    },
    {
      key: 'admin_fee',
      label: 'Adm Bank',
      sortable: false,
      render: (_, row) => (
        <span className={`text-sm ${row.admin_fee > 0 ? 'text-red-600' : 'text-gray-400'}`}>
          {row.admin_fee > 0 ? `- ${formatCurrency(row.admin_fee)}` : '-'}
        </span>
      ),
    },
    {
      key: 'net_profit',
      label: 'Laba Bersih',
      sortable: false,
      render: (_, row) => (
        <span className={`text-sm font-semibold ${row.net_profit === 0 ? 'text-gray-400' : row.net_profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {row.net_profit === 0 ? '-' : formatCurrency(row.net_profit)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52] flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Agen Bank
          </h1>
          <p className="text-gray-600 mt-1">Transaksi setor/tarik tunai & transfer saldo (bank maupun e-wallet)</p>
        </div>
        {hasPermission('pos.bank-agent-transaction.create') && (
          <Link
            href="/app/pos/bank-agent-transactions/create"
            className="flex items-center space-x-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] px-4 py-2 transition-colors cursor-pointer font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Transaksi</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <DataTable
        data={transactions}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari nomor transaksi / no. rekening..."
        emptyMessage="Belum ada transaksi"
        emptyIcon={<Landmark className="w-16 h-16 text-gray-300 mx-auto" />}
        filterComponent={filterComponent}
        serverSide={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy="created_at"
        sortOrder="desc"
        onSortChange={() => {}}
        isLoading={isLoading}
        getRowId={(row) => row.uuid}
      />
    </div>
  );
}
