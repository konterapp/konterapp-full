'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X, Upload, ImageOff } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Select2 from '@/components/ui/Select2';
import { useToast } from '@/components/toast/ToastContainer';
import { getBerita, createBerita, updateBerita, BeritaCreateData } from '@/lib/api/admin/berita';

interface BeritaFormProps {
    beritaUuid?: string;
    mode: 'create' | 'edit';
}

const NEWS_TYPE_OPTIONS = [
    { id: 'spotlight', label: 'Spotlight' },
    { id: 'rilis-pers', label: 'Rilis Pers' },
    { id: 'artikel', label: 'Artikel' },
];

const CATEGORY_OPTIONS = [
    { id: 'music', label: 'Music' },
    { id: 'sport-wellness', label: 'Sport & Wellness' },
    { id: 'culinary', label: 'Culinary' },
    { id: 'creative', label: 'Creative' },
    { id: 'carnaval', label: 'Carnaval' },
    { id: 'art-culture', label: 'Art & Culture' },
    { id: 'mice', label: 'MICE' },
];

interface FormData {
    title: string;
    content: string;
    published_at: string;
    is_published: boolean;
    tags: string[];
    news_type: string;
    category: string;
}

export default function BeritaForm({ beritaUuid, mode }: BeritaFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState('');

    const [formData, setFormData] = useState<FormData>({
        title: '',
        content: '',
        published_at: new Date().toISOString().split('T')[0],
        is_published: false,
        tags: [],
        news_type: '',
        category: '',
    });

    useEffect(() => {
        if (mode === 'edit' && beritaUuid) {
            fetchBerita();
        }
    }, [mode, beritaUuid]);

    const fetchBerita = async () => {
        if (!beritaUuid) return;

        try {
            setIsLoadingData(true);
            const response = await getBerita(beritaUuid);

            if (response.status === 'success' && response.data) {
                const berita = response.data;
                setFormData({
                    title: berita.title,
                    content: berita.content,
                    published_at: berita.published_at,
                    is_published: berita.is_published,
                    tags: berita.tags || [],
                    news_type: berita.news_type || '',
                    category: berita.category || '',
                });
                if (berita.image_url) {
                    setImagePreview(berita.image_url);
                }
            } else {
                setError(response.message || 'Gagal memuat data berita');
                toast.error(response.message || 'Gagal memuat data berita');
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
            setError(errorMsg);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleContentChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            content: value,
        }));
        if (fieldErrors.content) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.content;
                return newErrors;
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            if (fieldErrors.image) {
                setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.image;
                    return newErrors;
                });
            }
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove),
        }));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setIsLoading(true);

        try {
            const dataToSend: BeritaCreateData = {
                title: formData.title,
                content: formData.content,
                published_at: formData.published_at,
                is_published: formData.is_published,
                tags: formData.tags,
                news_type: formData.news_type || undefined,
                category: formData.category || undefined,
                image: imageFile || undefined,
            };

            let response;
            if (mode === 'edit' && beritaUuid) {
                response = await updateBerita(beritaUuid, dataToSend);
            } else {
                response = await createBerita(dataToSend);
            }

            if (response.status === 'success') {
                toast.success(mode === 'edit' ? 'Berita berhasil diperbarui' : 'Berita berhasil dibuat');
                router.push('/admin/berita');
            } else {
                if (response.errors) {
                    setFieldErrors(response.errors);
                }
                setError(response.message || 'Terjadi kesalahan, silakan coba lagi');
                toast.error(response.message || 'Terjadi kesalahan, silakan coba lagi');
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                    <div className="text-gray-500">Memuat data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {mode === 'edit' ? 'Edit Berita' : 'Tambah Berita Baru'}
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Judul <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.title
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
                            }`}
                        placeholder="Masukkan judul berita..."
                    />
                    {fieldErrors.title && (
                        <div className="mt-1 text-sm text-red-600">{fieldErrors.title[0]}</div>
                    )}
                </div>

                {/* Content */}
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                        Konten <span className="text-red-500">*</span>
                    </label>
                    <RichTextEditor
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleContentChange}
                        placeholder="Tulis konten berita..."
                        hasError={!!fieldErrors.content}
                    />
                    {fieldErrors.content && (
                        <div className="mt-1 text-sm text-red-600">{fieldErrors.content[0]}</div>
                    )}
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Utama
                    </label>
                    {imagePreview ? (
                        <div className="relative">
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                <p className="text-sm text-gray-500">Klik untuk upload gambar</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Max. 2MB)</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                    )}
                    {fieldErrors.image && (
                        <div className="mt-1 text-sm text-red-600">{fieldErrors.image[0]}</div>
                    )}
                </div>

                {/* News Type & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="news_type" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipe Berita
                        </label>
                        <Select2
                            name="news_type"
                            value={formData.news_type || ''}
                            options={NEWS_TYPE_OPTIONS}
                            onChange={handleChange}
                            placeholder="Pilih tipe berita"
                            hasError={!!fieldErrors.news_type}
                        />
                        {fieldErrors.news_type && (
                            <div className="mt-1 text-sm text-red-600">{fieldErrors.news_type[0]}</div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Kategori
                        </label>
                        <Select2
                            name="category"
                            value={formData.category || ''}
                            options={CATEGORY_OPTIONS}
                            onChange={handleChange}
                            placeholder="Pilih kategori"
                            searchable={true}
                            hasError={!!fieldErrors.category}
                        />
                        {fieldErrors.category && (
                            <div className="mt-1 text-sm text-red-600">{fieldErrors.category[0]}</div>
                        )}
                    </div>
                </div>

                {/* Published Date and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="published_at" className="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal Publikasi <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="published_at"
                            name="published_at"
                            value={formData.published_at}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.published_at
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
                                }`}
                        />
                        {fieldErrors.published_at && (
                            <div className="mt-1 text-sm text-red-600">{fieldErrors.published_at[0]}</div>
                        )}
                    </div>

                    <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer mt-6">
                            <input
                                type="checkbox"
                                name="is_published"
                                checked={formData.is_published}
                                onChange={handleCheckboxChange}
                                className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170]"
                            />
                            <span className="text-sm font-medium text-gray-700">Publikasikan Berita</span>
                        </label>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] bg-white"
                            placeholder="Ketik tag dan tekan Enter"
                        />
                        <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            Tambah
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Link
                        href="/admin/berita"
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                        <span>Batal</span>
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 cursor-pointer text-sm font-semibold bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Menyimpan...' : 'Simpan'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
