import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { whatsappRepository } from "./repository";
import { whatsappSocketManager } from "./socket-manager";
import {
  mapWhatsappConnectionState,
  mapWhatsappStatus,
  mapWhatsappSettings,
  mapWhatsappMessage,
  mapWhatsappMessageLog,
} from "./whatsapp.mapper";
import { isLikelyWhatsappPhone, normalizeWhatsappPhone } from "./phone";
import { runNotificationChecksForCompany } from "./notification.service";

const TEST_MESSAGE = [
  "🧪 *Test KonterApp*",
  "Ini pesan uji coba notifikasi WhatsApp.",
  "Kalau kamu menerima pesan ini, koneksi WhatsApp sudah berfungsi dengan benar.",
].join("\n");

export const whatsappAdminService = {
  /**
   * Status koneksi + pengaturan notifikasi. Dipanggil GET, sekaligus memastikan
   * sesi dibuat & (kalau pernah connect) dikoneksikan ulang otomatis.
   */
  async getStatus(companyUuid: string) {
    await whatsappRepository.upsertSession(companyUuid);
    const [state, settings] = await Promise.all([
      whatsappSocketManager.getSessionState(companyUuid),
      whatsappRepository.findNotificationSettings(companyUuid),
    ]);
    return mapWhatsappStatus(state, settings);
  },

  /** Mulai/hubungkan ulang sesi WhatsApp (scan QR bila perlu). */
  async connect(companyUuid: string) {
    await whatsappRepository.upsertSession(companyUuid);
    await whatsappSocketManager.ensureSession(companyUuid);
    const state = await whatsappSocketManager.getSessionState(companyUuid);
    return mapWhatsappConnectionState(state);
  },

  async disconnect(companyUuid: string) {
    await whatsappSocketManager.disconnectSession(companyUuid);
    return { status: "disconnected" };
  },

  async updateSettings(
    companyUuid: string,
    data: {
      targetPhone?: string | null;
      stockLowEnabled?: boolean;
      stockLowThreshold?: number | null;
      saldoLowEnabled?: boolean;
      saldoLowThreshold?: number | null;
    }
  ) {
    const targetPhone = data.targetPhone ? normalizeWhatsappPhone(data.targetPhone) : null;
    if (targetPhone && !isLikelyWhatsappPhone(targetPhone)) {
      throw new ApiError("Nomor WhatsApp tujuan tidak valid (contoh: 08x.. / 628xx)", 422);
    }

    const stockLowEnabled = data.stockLowEnabled ?? false;
    const saldoLowEnabled = data.saldoLowEnabled ?? false;

    const rows = await whatsappRepository.updateNotificationSettings(companyUuid, [
      {
        type: "stock_low",
        isEnabled: stockLowEnabled,
        targetPhone,
        threshold: stockLowEnabled ? data.stockLowThreshold ?? null : null,
      },
      {
        type: "saldo_low",
        isEnabled: saldoLowEnabled,
        targetPhone,
        threshold: saldoLowEnabled ? data.saldoLowThreshold ?? null : null,
      },
    ]);

    // Pengecekan langsung setelah simpan supaya notifikasi (kalau memenuhi
    // kondisi) langsung masuk antrian & terkirim tanpa nunggu interval 60 detik.
    if (stockLowEnabled || saldoLowEnabled) {
      whatsappSocketManager.startBackgroundTasks();
      await runNotificationChecksForCompany(companyUuid);
      await whatsappSocketManager.flushCompanyPending(companyUuid);
    }

    return mapWhatsappSettings(rows);
  },

  /** Kirim pesan uji langsung (butuh koneksi aktif) + catat ke log. */
  async sendTestMessage(
    companyUuid: string,
    input: { phone?: string | null; text?: string | null }
  ) {
    const settings = await whatsappRepository.findNotificationSettings(companyUuid);
    const settingsPhone = settings.find((s) => s.targetPhone)?.targetPhone ?? null;
    const rawPhone = input.phone ?? settingsPhone;

    if (!rawPhone) {
      throw new ApiError("Nomor WhatsApp tujuan belum diisi", 422);
    }
    const phone = normalizeWhatsappPhone(rawPhone);
    if (!isLikelyWhatsappPhone(phone)) {
      throw new ApiError("Nomor WhatsApp tujuan tidak valid (contoh: 08x.. / 628xx)", 422);
    }

    const state = await whatsappSocketManager.getSessionState(companyUuid);
    if (state.status !== "connected") {
      throw new ApiError("WhatsApp belum terhubung. Silakan connect & scan QR dulu.", 400);
    }

    const text = input.text?.trim() || TEST_MESSAGE;
    const message = await whatsappRepository.createMessage(prisma, {
      companyUuid,
      type: "test",
      recipientPhone: phone,
      text,
    });

    try {
      await whatsappRepository.markMessageSending(message.uuid);
      await whatsappSocketManager.sendTextMessage(companyUuid, phone, text);
      const sent = await whatsappRepository.markMessageSent(message.uuid);
      return mapWhatsappMessage(sent);
    } catch (err) {
      await whatsappRepository.markMessageFailed(
        message.uuid,
        err instanceof Error ? err.message : "Gagal mengirim pesan"
      );
      throw new ApiError("Pesan gagal dikirim. Periksa log pesan untuk detail.", 400, undefined, "WHATSAPP_SEND_FAILED");
    }
  },

  async listMessages(companyUuid: string, page: number, perPage: number) {
    const [total, rows] = await whatsappRepository.findMessageLog(companyUuid, page, perPage);
    return mapWhatsappMessageLog(total, rows, page, perPage);
  },
};