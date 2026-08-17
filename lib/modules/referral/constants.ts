export const REFERRAL_DISCOUNT_PERCENT = 10;
export const REFERRAL_COMMISSION_PERCENT = 40;
export const REFERRAL_CODE_LENGTH = 6;

// Tanpa karakter ambiguo (O/0/I/1) supaya mudah dibaca.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length: number = REFERRAL_CODE_LENGTH): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}