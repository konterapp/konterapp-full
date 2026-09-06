/**
 * Normalisasi nomor WhatsApp ke format internasional (628xx...), tanpa '+'.
 * Dipakai di layer service & manager sebagai sumber tunggal, supaya format
 * nomor di seluruh modul tidak bergantung pada input klien.
 */
export function normalizeWhatsappPhone(input: string | null | undefined): string {
  const digits = (input ?? "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

export function isLikelyWhatsappPhone(input: string | null | undefined): boolean {
  const normalized = normalizeWhatsappPhone(input);
  return /^62[1-9]\d{7,11}$/.test(normalized);
}