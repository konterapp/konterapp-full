const PHONE_PREFIX_MAP: Record<string, string[]> = {
  'TELKOMSEL': ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'],
  'INDOSAT': ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
  'XL': ['0817', '0818', '0819', '0859', '0877', '0878'],
  'AXIS': ['0831', '0832', '0833', '0838'],
  'TRI': ['0895', '0896', '0897', '0898', '0899'],
  'SMARTFREN': ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'],
  'BY.U': ['0851'],
};

export function detectBrandFromPhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return null;
  const prefix4 = cleaned.substring(0, 4);
  for (const [brand, prefixes] of Object.entries(PHONE_PREFIX_MAP)) {
    if (prefixes.includes(prefix4)) return brand;
  }
  return null;
}
