import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import UnitForm from '../../_components/UnitForm';

export default function EditUnitPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/units"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Satuan</span>
        </Link>
      </div>
      <UnitForm mode="edit" unitId={uuid} />
    </div>
  );
}
