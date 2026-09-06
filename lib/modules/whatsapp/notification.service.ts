import { prisma } from "@/lib/prisma";
import { whatsappRepository } from "./repository";
import { isLikelyWhatsappPhone, normalizeWhatsappPhone } from "./phone";

const MAX_LINES_PER_MESSAGE = 20;

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildLowStockText(companyName: string, items: { name: string; branch: string; stock: number; min: number }[]): string {
  const lines = items.map((i) => `• ${i.name} (${i.branch}): ${i.stock} pcs — min ${i.min} pcs`);
  const shown = lines.slice(0, MAX_LINES_PER_MESSAGE);
  const more = lines.length - shown.length > 0 ? `\n…dan ${lines.length - shown.length} produk lainnya` : "";
  return [
    "⚠️ *Stok Menipis*",
    `Perusahaan: ${companyName}`,
    "",
    ...shown,
    more,
    "",
    `Total ${lines.length} produk di bawah batas minimal.`,
  ]
    .filter((line, idx) => line !== "" || idx === 0)
    .join("\n");
}

function buildLowSaldoText(companyName: string, items: { name: string; balanceName: string; balance: number; min: number }[]): string {
  const lines = items.map(
    (i) => `• ${i.name}${i.balanceName ? ` (${i.balanceName})` : ""}: ${formatRupiah(i.balance)} — min ${formatRupiah(i.min)}`
  );
  const shown = lines.slice(0, MAX_LINES_PER_MESSAGE);
  const more = lines.length - shown.length > 0 ? `\n…dan ${lines.length - shown.length} saldo lainnya` : "";
  return [
    "⚠️ *Saldo Menipis*",
    `Perusahaan: ${companyName}`,
    "",
    ...shown,
    more,
    "",
    `Total ${lines.length} saldo di bawah batas minimal.`,
  ].join("\n");
}

/**
 * Notifikasi "stok menipis": scan produk barang yang stock-nya di bawah
 * batas (setting.stock_low.threshold kalau diset, kalau tidak pakai
 * product.minStock owner). Dibuat sebagai pesan pending; pengiriman dilakukan
 * socket manager saat koneksi tersedia.
 */
async function checkLowStock(companyUuids?: string[]): Promise<void> {
  let settings = (await whatsappRepository.findEnabledSettingsGrouped()).filter((s) => s.type === "stock_low");
  if (companyUuids) {
    settings = settings.filter((s) => companyUuids.includes(s.companyUuid));
  }
  settings = settings.filter((s) => s.targetPhone && isLikelyWhatsappPhone(s.targetPhone));

  const companies = settings.map((s) => s.companyUuid);
  if (companies.length === 0) return;

  const companyRows = await prisma.company.findMany({
    where: { uuid: { in: companies } },
    select: { uuid: true, name: true },
  });
  const companyNameById = new Map(companyRows.map((c) => [c.uuid, c.name]));

  const stocks = await prisma.appPosProductStock.findMany({
    where: {
      companyUuid: { in: companies },
      product: { isActive: true, kind: "barang" },
    },
    include: {
      product: { select: { uuid: true, name: true, minStock: true } },
      branch: { select: { uuid: true, name: true } },
    },
  });

  for (const setting of settings) {
    const threshold = setting.threshold !== null ? Number(setting.threshold) : null;
    const companyStocks = stocks.filter((s) => s.companyUuid === setting.companyUuid);

    const items = companyStocks.flatMap((row) => {
      const min = threshold !== null ? threshold : row.product.minStock;
      if (min <= 0) return [];
      if (Number(row.stock) >= min) return [];
      return [
        {
          dedupKey: `stock_low:${row.product.uuid}:${row.branch?.uuid ?? "none"}`,
          name: row.product.name,
          branch: row.branch?.name ?? "-",
          stock: row.stock,
          min,
        },
      ];
    });

    const keepKeys = items.map((i) => i.dedupKey);
    const text = buildLowStockText(companyNameById.get(setting.companyUuid) ?? setting.companyUuid, items);

    await whatsappRepository.runInTransaction(async (tx) => {
      if (items.length > 0) {
        const active = await whatsappRepository.findActiveMessageKeys(tx, setting.companyUuid, "stock_low", keepKeys);
        const activeKeys = new Set(active.map((a) => a.dedupKey).filter((k): k is string => Boolean(k)));
        const toCreate = items.filter((i) => !activeKeys.has(i.dedupKey));

        await whatsappRepository.createManyMessages(
          tx,
          toCreate.map((i) => ({
            companyUuid: setting.companyUuid,
            type: "stock_low",
            recipientPhone: normalizeWhatsappPhone(setting.targetPhone),
            text,
            dedupKey: i.dedupKey,
          }))
        );
      }
      await whatsappRepository.resolveDedupKeys(tx, setting.companyUuid, "stock_low", keepKeys);
    });
  }
}

/**
 * Notifikasi "saldo menipis": scan saldo akun yang balance-nya di bawah
 * threshold setting.saldo_low.threshold.
 */
async function checkLowSaldo(companyUuids?: string[]): Promise<void> {
  let settings = (await whatsappRepository.findEnabledSettingsGrouped())
    .filter((s) => s.type === "saldo_low")
    .filter((s) => s.threshold !== null);
  if (companyUuids) {
    settings = settings.filter((s) => companyUuids.includes(s.companyUuid));
  }
  settings = settings.filter((s) => s.targetPhone && isLikelyWhatsappPhone(s.targetPhone));

  const companies = settings.map((s) => s.companyUuid);
  if (companies.length === 0) return;

  const companyRows = await prisma.company.findMany({
    where: { uuid: { in: companies } },
    select: { uuid: true, name: true },
  });
  const companyNameById = new Map(companyRows.map((c) => [c.uuid, c.name]));

  const balances = await prisma.appPosSaldoAccountBalance.findMany({
    where: {
      companyUuid: { in: companies },
      saldoAccount: { isActive: true },
    },
    include: {
      saldoAccount: { select: { name: true } },
    },
  });

  for (const setting of settings) {
    const threshold = Number(setting.threshold);
    const companyBalances = balances.filter((b) => b.companyUuid === setting.companyUuid);

    const items = companyBalances
      .filter((b) => Number(b.balance) < threshold)
      .map((b) => ({
        name: b.saldoAccount.name,
        balanceName: b.name ?? b.accountName ?? "",
        balance: Number(b.balance),
        min: threshold,
        uuid: b.uuid,
      }));

    const keepKeys = items.map((i) => `saldo_low:${i.uuid}`);
    const text = buildLowSaldoText(companyNameById.get(setting.companyUuid) ?? setting.companyUuid, items);

    await whatsappRepository.runInTransaction(async (tx) => {
      if (items.length > 0) {
        const active = await whatsappRepository.findActiveMessageKeys(tx, setting.companyUuid, "saldo_low", keepKeys);
        const activeKeys = new Set(active.map((a) => a.dedupKey).filter((k): k is string => Boolean(k)));
        const toCreate = items.filter((i) => !activeKeys.has(`saldo_low:${i.uuid}`));

        await whatsappRepository.createManyMessages(
          tx,
          toCreate.map((i) => ({
            companyUuid: setting.companyUuid,
            type: "saldo_low",
            recipientPhone: normalizeWhatsappPhone(setting.targetPhone),
            text,
            dedupKey: `saldo_low:${i.uuid}`,
          }))
        );
      }
      await whatsappRepository.resolveDedupKeys(tx, setting.companyUuid, "saldo_low", keepKeys);
    });
  }
}

export async function runNotificationChecks(): Promise<void> {
  await checkLowStock();
  await checkLowSaldo();
}

/** Jalankan pengecekan untuk satu company tertentu (dipakai usai simpan settings). */
export async function runNotificationChecksForCompany(companyUuid: string): Promise<void> {
  await checkLowStock([companyUuid]);
  await checkLowSaldo([companyUuid]);
}