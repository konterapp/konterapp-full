import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import SupplierForm from '../../_components/SupplierForm';

export default function EditSupplierPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pos/suppliers"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Supplier</span>
        </Link>
      </div>
      <SupplierForm mode="edit" supplierId={uuid} />
    </div>
  );
}
