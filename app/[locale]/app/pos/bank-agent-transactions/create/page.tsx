import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import BankAgentTransactionForm from './_components/BankAgentTransactionForm';

export default function CreateBankAgentTransactionPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile: satu baris ala navigasi aplikasi -- panah kembali + judul,
          supaya bagian atas tidak menghabiskan ruang layar (dulu tautan
          kembali dan judul besar bertumpuk jadi dua blok terpisah).
          Desktop: tetap tautan berteks di atas judul seperti semula. */}
      <Link
        href="/app/pos/bank-agent-transactions"
        className="hidden sm:inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Kembali ke Agen Bank</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/app/pos/bank-agent-transactions"
          aria-label="Kembali ke Agen Bank"
          className="sm:hidden -ml-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="min-w-0 text-lg sm:text-2xl font-bold text-gray-900">Buat Transaksi Agen Bank</h1>
      </div>

      <BankAgentTransactionForm />
    </div>
  );
}
