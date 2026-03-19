import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import CategoryForm from '../../_components/CategoryForm';

export default function EditCategoryPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pos/categories"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Kategori</span>
        </Link>
      </div>
      <CategoryForm mode="edit" categoryId={uuid} />
    </div>
  );
}
