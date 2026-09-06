import type { AppWhatsappMessage, AppWhatsappNotificationSetting } from "@prisma/client";

export interface WhatsappStatusPayload {
  status: "disconnected" | "connecting" | "waiting_qr" | "connected" | "failed";
  qrImage: string | null;
  phoneNumber: string | null;
  lastError: string | null;
}

export function mapWhatsappSettings(
  rows: AppWhatsappNotificationSetting[]
): {
  target_phone: string | null;
  stock_low_enabled: boolean;
  stock_low_threshold: number | null;
  saldo_low_enabled: boolean;
  saldo_low_threshold: number | null;
} {
  const byType = new Map(rows.map((row) => [row.type, row]));

  const stockLow = byType.get("stock_low");
  const saldoLow = byType.get("saldo_low");

  return {
    target_phone: stockLow?.targetPhone ?? saldoLow?.targetPhone ?? null,
    stock_low_enabled: stockLow?.isEnabled ?? false,
    stock_low_threshold: stockLow?.threshold !== null && stockLow?.threshold !== undefined ? Number(stockLow.threshold) : null,
    saldo_low_enabled: saldoLow?.isEnabled ?? false,
    saldo_low_threshold: saldoLow?.threshold !== null && saldoLow?.threshold !== undefined ? Number(saldoLow.threshold) : null,
  };
}

export function mapWhatsappConnectionState(state: WhatsappStatusPayload) {
  return {
    status: state.status,
    qr_image: state.qrImage,
    phone_number: state.phoneNumber,
    last_error: state.lastError,
  };
}

export function mapWhatsappStatus(state: WhatsappStatusPayload, settings: AppWhatsappNotificationSetting[]) {
  return {
    ...mapWhatsappConnectionState(state),
    settings: mapWhatsappSettings(settings),
  };
}

export function mapWhatsappMessage(row: AppWhatsappMessage) {
  return {
    uuid: row.uuid,
    type: row.type,
    recipient_phone: row.recipientPhone,
    text: row.text,
    status: row.status,
    error_message: row.errorMessage,
    sent_at: row.sentAt,
    created_at: row.createdAt,
  };
}

export function mapWhatsappMessageLog(total: number, rows: AppWhatsappMessage[], page: number, perPage: number) {
  return {
    data: rows.map(mapWhatsappMessage),
    meta: {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}