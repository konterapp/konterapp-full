#!/usr/bin/env node
/**
 * Heuristic checklist (BUKAN gate/CI blocker) untuk nemuin fungsi service
 * yang melakukan >1 write ke database (create/update/delete/upsert, baik
 * lewat repository.method(...) atau langsung tx.model.xxx(...)/prisma.model.xxx(...))
 * tapi kelihatannya TIDAK dibungkus transaction (runInTransaction / $transaction).
 *
 * Kenapa ini penting: kalau write ke-2 gagal setelah write ke-1 berhasil,
 * write ke-1 nyangkut jadi data yatim/sampah di database, dan retry sering
 * gagal lagi (mis. kena unique constraint). Sudah pernah kejadian nyata di
 * lib/modules/auth/provisioning.ts, lib/modules/billing/webhook.service.ts,
 * lib/modules/pos/products/admin.service.ts, lib/modules/roles/admin.service.ts.
 *
 * Ini heuristik regex, BUKAN static analysis yang presisi -- bisa false
 * positive/negative. Kalau ada temuan, cek manual dulu sebelum "memperbaiki".
 * Cara pakai: node scripts/check-transactions.js  (atau: npm run check:transactions)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TARGET_DIR = path.join(ROOT, "lib", "modules");

const WRITE_CALL_RE = /\.(create|createMany|update|updateMany|delete|deleteMany|upsert)\(/g;
const TRANSACTION_HINT_RE = /runInTransaction|\$transaction/;
const JS_KEYWORDS = new Set([
  "if", "for", "while", "switch", "catch", "function", "return",
  "typeof", "in", "of", "with", "do",
]);
const METHOD_START_RE = /(?:^|\n)(?:\s*)(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g;

// Awalnya cuma *.service.ts/*.repository.ts, tapi itu kelewat file logic
// lain di lib/modules yang juga nulis ke DB langsung (mis. auth/provisioning.ts,
// auth/password-reset.ts, auth/verification.ts -- dua terakhir sempat ada
// bug nyata: deleteMany+create tanpa transaction, ketemu pas audit manual
// karena checker versi lama tidak menjangkau file-file ini). Sekarang scan
// semua .ts di lib/modules kecuali mapper/template/constants yang murni
// data/formatting dan tidak menulis ke DB.
const SKIP_FILE_RE = /\.(mapper|templates|constants)\.ts$/;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !SKIP_FILE_RE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function extractMethodBodies(source) {
  const methods = [];
  let match;
  METHOD_START_RE.lastIndex = 0;
  while ((match = METHOD_START_RE.exec(source))) {
    const name = match[1];
    if (JS_KEYWORDS.has(name)) continue;
    const bodyStart = match.index + match[0].length; // right after the opening `{`
    let depth = 1;
    let i = bodyStart;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") depth--;
      i++;
    }
    const body = source.slice(bodyStart, i - 1);
    const params = match[2];
    methods.push({ name, params, body });
  }
  return methods;
}

// Method sudah menerima `tx` sebagai parameter pertama -- artinya, mengikuti
// konvensi proyek ini, method tsb ditulis untuk dipanggil di dalam
// `repository.runInTransaction(...)` milik caller-nya. Regex per-method tidak
// bisa lihat lintas fungsi untuk memverifikasi itu, jadi daripada heuristik
// terus false-positive di pola yang justru direkomendasikan, method begini
// dilewati -- cek manual tetap perlu untuk memastikan caller-nya benar wrap.
const TX_FIRST_PARAM_RE = /^\s*tx\s*[:,)]/;

function checkFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const methods = extractMethodBodies(source);
  const findings = [];

  for (const { name, params, body } of methods) {
    if (TX_FIRST_PARAM_RE.test(params)) continue;

    const writeCalls = body.match(WRITE_CALL_RE) || [];
    if (writeCalls.length < 2) continue;
    if (TRANSACTION_HINT_RE.test(body)) continue;

    findings.push({ method: name, writeCount: writeCalls.length });
  }

  return findings;
}

function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`Direktori tidak ditemukan: ${TARGET_DIR}`);
    process.exit(1);
  }

  const files = walk(TARGET_DIR);
  let totalFindings = 0;

  for (const file of files) {
    const findings = checkFile(file);
    if (findings.length === 0) continue;

    const relPath = path.relative(ROOT, file);
    console.log(`\n${relPath}`);
    for (const f of findings) {
      totalFindings++;
      console.log(`  - ${f.method}(): ${f.writeCount} write call terdeteksi, tidak ada runInTransaction/$transaction di dalamnya`);
    }
  }

  console.log("");
  if (totalFindings === 0) {
    console.log("Tidak ada kandidat baru. (Heuristik regex -- tetap cek manual kalau ragu.)");
  } else {
    console.log(
      `${totalFindings} kandidat ditemukan di atas. Ini CUMA heuristik (advisory, bukan gate) --\n` +
        "cek manual tiap temuan: apakah write-write itu benar saling terkait (butuh atomicity)\n" +
        "atau memang independen (aman terpisah). Pola perbaikan yang sudah dipakai di proyek ini:\n" +
        "tambah `runInTransaction(cb)` di repository, ubah method write jadi terima `tx` sebagai\n" +
        "parameter pertama, lalu panggil semuanya di dalam satu `repository.runInTransaction(async (tx) => {...})`\n" +
        "di service. Lihat lib/modules/pos/products/repository.ts + admin.service.ts sebagai contoh."
    );
  }
}

main();
