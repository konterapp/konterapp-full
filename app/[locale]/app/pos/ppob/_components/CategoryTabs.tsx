'use client';

import { Smartphone, Wifi, Zap, Heart, Droplets, Phone, Wallet, Gamepad2 } from 'lucide-react';

interface CategoryTabsProps {
  categories: string[];
  categoryLabels?: Record<string, string>;
  activeCategory: string;
  onSelect: (category: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'PULSA': <Smartphone className="w-4 h-4" />,
  'DATA': <Wifi className="w-4 h-4" />,
  'PLNPRA': <Zap className="w-4 h-4" />,
  'PLNPASCA': <Zap className="w-4 h-4" />,
  'BPJS': <Heart className="w-4 h-4" />,
  'PDAM': <Droplets className="w-4 h-4" />,
  'TELKOM': <Phone className="w-4 h-4" />,
  'EMONEY': <Wallet className="w-4 h-4" />,
  'GAME': <Gamepad2 className="w-4 h-4" />,
};

export default function CategoryTabs({ categories, categoryLabels, activeCategory, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
            activeCategory === cat
              ? 'bg-[#142D52] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {categoryIcons[cat] || null}
          {categoryLabels?.[cat] || cat}
        </button>
      ))}
    </div>
  );
}
