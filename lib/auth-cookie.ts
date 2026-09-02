/**
 * Satu-satunya sumber kebenaran untuk nama & flag cookie sesi tenant (NextAuth).
 *
 * Sebelumnya penentuan nama cookie tersebar di banyak file dengan dua aturan
 * berbeda: route yang MENULIS cookie memakai `NODE_ENV === "production"`,
 * sedangkan `proxy.ts` yang MEMBACA cookie memakai `protocol === 'https:'`.
 * Akibatnya saat dev server diakses lewat HTTPS (Cloudflare Tunnel), cookie
 * ditulis sebagai `authjs.session-token` tapi dicari sebagai
 * `__Secure-authjs.session-token` -- middleware menganggap user belum login dan
 * melempar balik ke /login, termasuk sesudah "login as" dari administrator.
 *
 * Karena `salt` pada encode/decode JWT NextAuth terikat ke nama cookie, penulis
 * dan pembaca WAJIB memakai nilai yang sama. Jangan hitung ulang nilai ini di
 * tempat lain.
 */
export const SESSION_COOKIE_SECURE = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_NAME = SESSION_COOKIE_SECURE
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
