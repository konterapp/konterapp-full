'use client';

import { useRef } from 'react';

interface RupiahInputProps {
  value: string;
  onChange: (digitsOnly: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
  /** Tampilkan prefix "Rp" + styling default (border, padding, dst). Set
   * false untuk pakai styling custom sendiri lewat className (mis. field
   * ringkas kanan-rata di panel kasir) -- logic format & cursor tetap sama. */
  showPrefix?: boolean;
  /** 'compact' -- padding & posisi prefix lebih kecil, buat kolom tabel
   * sempit. Cuma berlaku kalau showPrefix true. */
  size?: 'default' | 'compact';
}

function digitsOnly(value: string): string {
  return (value || '').replace(/\D/g, '');
}

function formatDisplay(value: string): string {
  const digits = digitsOnly(value).replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const SIZE_INPUT_CLASSES: Record<'default' | 'compact', string> = {
  // Di layar kecil field dibuat lebih tinggi & 16px: lebih nyaman ditekan
  // jari, sekaligus mencegah Safari iOS auto-zoom saat field difokus (itu
  // terjadi kalau font-size < 16px). Mulai sm ukurannya kembali seperti
  // semula sehingga tampilan desktop tidak berubah.
  default: 'py-3 sm:py-2 pl-9 pr-4 text-base sm:text-sm',
  compact: 'py-1.5 pl-7 pr-1.5 text-sm',
};

const SIZE_PREFIX_CLASSES: Record<'default' | 'compact', string> = {
  default: 'left-3 text-sm',
  compact: 'left-2 text-xs',
};

/**
 * Input nominal uang -- tampil dengan pemisah ribuan ("10.000.000") sambil
 * diketik, tapi value yang dikirim ke onChange selalu angka polos tanpa
 * titik. Posisi kursor dijaga (dihitung dari akhir string) supaya edit di
 * tengah angka tidak melompat ke ujung.
 */
export default function RupiahInput({
  value,
  onChange,
  placeholder = '0',
  id,
  required,
  hasError,
  disabled,
  className = '',
  showPrefix = true,
  size = 'default',
}: RupiahInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCustomWidth = /(^|\s)w-/.test(className);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorFromEnd = input.value.length - (input.selectionStart ?? input.value.length);
    onChange(digitsOnly(input.value));

    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const pos = Math.max(el.value.length - cursorFromEnd, 0);
      el.setSelectionRange(pos, pos);
    });
  };

  const input = (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      id={id}
      required={required}
      disabled={disabled}
      value={formatDisplay(value)}
      onChange={handleChange}
      placeholder={placeholder}
      className={
        showPrefix
          ? `${hasCustomWidth ? '' : 'w-full '}${SIZE_INPUT_CLASSES[size]} border rounded-lg focus:outline-none focus:ring-2 bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
              hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#EBC170]'
            } ${className}`
          : className
      }
    />
  );

  if (!showPrefix) return input;

  return (
    <div className="relative">
      <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 ${SIZE_PREFIX_CLASSES[size]}`}>Rp</span>
      {input}
    </div>
  );
}
