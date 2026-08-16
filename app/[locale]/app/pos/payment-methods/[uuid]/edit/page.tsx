import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import PaymentMethodForm from '../../_components/PaymentMethodForm';

export default function EditPaymentMethodPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/payment-methods"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Metode Pembayaran</span>
        </Link>
      </div>
      <PaymentMethodForm mode="edit" paymentMethodId={uuid} />
    </div>
  );
}
