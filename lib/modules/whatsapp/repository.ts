import { prisma, type TransactionClient } from "@/lib/prisma";

type Client = TransactionClient | typeof prisma;

export type WhatsappMessageStatus = "pending" | "sending" | "sent" | "failed" | "resolved";

export type NotificationSettingInput = {
  type: string;
  isEnabled: boolean;
  targetPhone: string | null;
  threshold: number | null;
};

export const whatsappRepository = {
  runInTransaction<T>(cb: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(cb);
  },

  // ---- Session ---------------------------------------------------------

  upsertSession(companyUuid: string, data: {
    status?: string;
    phoneNumber?: string | null;
    lastError?: string | null;
    lastConnectedAt?: Date | null;
  } = {}) {
    return prisma.appWhatsappSession.upsert({
      where: { companyUuid },
      update: { ...data },
      create: {
        companyUuid,
        status: data.status ?? "disconnected",
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
        ...(data.lastError !== undefined ? { lastError: data.lastError } : {}),
        ...(data.lastConnectedAt !== undefined ? { lastConnectedAt: data.lastConnectedAt } : {}),
      },
    });
  },

  findSessionByCompany(companyUuid: string) {
    return prisma.appWhatsappSession.findUnique({ where: { companyUuid } });
  },

  updateSession(companyUuid: string, data: {
    status?: string;
    phoneNumber?: string | null;
    lastError?: string | null;
    lastConnectedAt?: Date | null;
  }) {
    return prisma.appWhatsappSession.update({
      where: { companyUuid },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
        ...(data.lastError !== undefined ? { lastError: data.lastError } : {}),
        ...(data.lastConnectedAt !== undefined ? { lastConnectedAt: data.lastConnectedAt } : {}),
      },
    });
  },

  /** Dipakai background worker untuk me-reconnect sesi yang tadinya connect. */
  findCompanyUuidsByStatuses(statuses: string[]) {
    return prisma.appWhatsappSession.findMany({
      where: { status: { in: statuses } },
      select: { companyUuid: true },
    });
  },

  // ---- Notification settings ------------------------------------------

  findNotificationSettings(companyUuid: string) {
    return prisma.appWhatsappNotificationSetting.findMany({
      where: { companyUuid },
      orderBy: { type: "asc" },
    });
  },

  /**
   * Semua setting notifikasi yang ENABLED + punya target_phone, dikelompokkan
   * per company. Dipakai oleh background worker (tanpa tenant context).
   */
  findEnabledSettingsGrouped() {
    return prisma.appWhatsappNotificationSetting.findMany({
      where: {
        isEnabled: true,
        targetPhone: { not: null },
      },
      orderBy: { companyUuid: "asc" },
    });
  },

  updateNotificationSettings(companyUuid: string, items: NotificationSettingInput[]) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        const row = await tx.appWhatsappNotificationSetting.upsert({
          where: { companyUuid_type: { companyUuid, type: item.type } },
          update: {
            isEnabled: item.isEnabled,
            targetPhone: item.targetPhone,
            threshold: item.threshold,
          },
          create: {
            companyUuid,
            type: item.type,
            isEnabled: item.isEnabled,
            targetPhone: item.targetPhone,
            threshold: item.threshold,
          },
        });
        results.push(row);
      }
      return results;
    });
  },

  // ---- Messages --------------------------------------------------------

  createMessage(tx: Client, data: {
    companyUuid: string;
    type: string;
    recipientPhone: string;
    text: string;
    dedupKey?: string | null;
  }) {
    return tx.appWhatsappMessage.create({ data });
  },

  createManyMessages(tx: Client, data: Array<{
    companyUuid: string;
    type: string;
    recipientPhone: string;
    text: string;
    dedupKey?: string | null;
  }>) {
    if (data.length === 0) return;
    return tx.appWhatsappMessage.createMany({ data });
  },

  /**
   * dedupKey yang masih "aktif" (pending/sending/sent) untuk (company, type).
   * Dipakai notifikasi service supaya tidak mengirim duplikat kondisi yang sama.
   */
  findActiveMessageKeys(tx: Client, companyUuid: string, type: string, keys: string[]) {
    if (keys.length === 0) return Promise.resolve([] as Array<{ dedupKey: string | null }>);
    return tx.appWhatsappMessage.findMany({
      where: {
        companyUuid,
        type,
        status: { in: ["pending", "sending", "sent"] },
        dedupKey: { in: keys },
      },
      select: { dedupKey: true },
    });
  },

  findPendingMessages(companyUuid: string) {
    return prisma.appWhatsappMessage.findMany({
      where: { companyUuid, status: "pending" },
      orderBy: { createdAt: "asc" },
    });
  },

  markMessageSending(uuid: string) {
    return prisma.appWhatsappMessage.update({ where: { uuid }, data: { status: "sending" } });
  },

  markMessageSent(uuid: string) {
    return prisma.appWhatsappMessage.update({
      where: { uuid },
      data: { status: "sent", sentAt: new Date() },
    });
  },

  markMessageFailed(uuid: string, errorMessage: string) {
    return prisma.appWhatsappMessage.update({
      where: { uuid },
      data: { status: "failed", errorMessage },
    });
  },

  /**
   * Baris notifikasi (stok/saldo) yang masih active (pending/sending/sent)
   * dengan dedupKey tidak lagi memenuhi kondisi → resolved + dedupKey dikosongkan,
   * supaya kalau kondisi menipis lagi, boleh notifikasi lagi.
   */
  resolveDedupKeys(tx: Client, companyUuid: string, type: string, keepKeys: string[]) {
    return tx.appWhatsappMessage.updateMany({
      where: {
        companyUuid,
        type,
        status: { in: ["pending", "sending", "sent"] },
        dedupKey: { not: null },
        ...(keepKeys.length > 0
          ? { NOT: { dedupKey: { in: keepKeys } } }
          : {}),
      },
      data: { status: "resolved", dedupKey: null },
    });
  },

  findMessageLog(companyUuid: string, page: number, perPage: number) {
    const skip = (page - 1) * perPage;
    return prisma.$transaction([
      prisma.appWhatsappMessage.count({ where: { companyUuid } }),
      prisma.appWhatsappMessage.findMany({
        where: { companyUuid },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
    ]);
  },
};