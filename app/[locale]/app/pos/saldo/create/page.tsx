import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import SaldoAccountForm from '../_components/SaldoAccountForm';

export default function CreateSaldoAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/saldo"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Saldo</span>
        </Link>
      </div>
      <SaldoAccountForm mode="create" />
    </div>
  );
}
