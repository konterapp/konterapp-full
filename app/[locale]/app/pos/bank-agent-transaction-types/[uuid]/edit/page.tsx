import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import BankAgentTransactionTypeForm from '../../_components/BankAgentTransactionTypeForm';

export default function EditBankAgentTransactionTypePage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/bank-agent-transaction-types"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Jenis Transaksi Agen Bank</span>
        </Link>
      </div>
      <BankAgentTransactionTypeForm mode="edit" typeUuid={uuid} />
    </div>
  );
}
