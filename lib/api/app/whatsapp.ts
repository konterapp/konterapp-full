export type WhatsappSessionStatus = "disconnected" | "connecting" | "waiting_qr" | "connected" | "failed";

export interface WhatsappStatus {
  status: WhatsappSessionStatus;
  qr_image: string | null;
  phone_number: string | null;
  last_error: string | null;
}

export interface WhatsappSettings {
  target_phone: string | null;
  stock_low_enabled: boolean;
  stock_low_threshold: number | null;
  saldo_low_enabled: boolean;
  saldo_low_threshold: number | null;
}

export interface WhatsappStatusResponse extends WhatsappStatus {
  settings: WhatsappSettings;
}

export interface WhatsappMessage {
  uuid: string;
  type: string;
  recipient_phone: string;
  text: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export async function getWhatsappStatus(): Promise<{ status: string; message: string; data: WhatsappStatusResponse }> {
  const response = await fetch('/api/app/whatsapp');
  return response.json();
}

export async function connectWhatsapp(): Promise<{ status: string; message: string; data: WhatsappStatus }> {
  const response = await fetch('/api/app/whatsapp/connect', { method: 'POST' });
  return response.json();
}

export async function disconnectWhatsapp(): Promise<{ status: string; message: string; data: { status: string } }> {
  const response = await fetch('/api/app/whatsapp/disconnect', { method: 'POST' });
  return response.json();
}

export async function updateWhatsappSettings(data: {
  targetPhone: string | null;
  stockLowEnabled: boolean;
  stockLowThreshold: number | null;
  saldoLowEnabled: boolean;
  saldoLowThreshold: number | null;
}): Promise<{ status: string; message: string; errors?: Record<string, string[]>; data?: WhatsappSettings }> {
  const response = await fetch('/api/app/whatsapp', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_phone: data.targetPhone,
      stock_low_enabled: data.stockLowEnabled,
      stock_low_threshold: data.stockLowThreshold,
      saldo_low_enabled: data.saldoLowEnabled,
      saldo_low_threshold: data.saldoLowThreshold,
    }),
  });
  return response.json();
}

export async function sendWhatsappTest(data: {
  phone?: string | null;
  text?: string;
}): Promise<{ status: string; message: string; errors?: Record<string, string[]>; data?: WhatsappMessage }> {
  const response = await fetch('/api/app/whatsapp/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: data.phone ?? null, text: data.text }),
  });
  return response.json();
}

export async function getWhatsappMessages(page = 1): Promise<{
  status: string;
  message: string;
  data: { data: WhatsappMessage[]; meta: { current_page: number; per_page: number; total: number; last_page: number } };
}> {
  const response = await fetch(`/api/app/whatsapp/messages?page=${page}&per_page=20`);
  return response.json();
}