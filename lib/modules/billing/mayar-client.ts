import { ApiError } from "@/lib/api-errors";

interface MayarInvoiceItem {
  quantity: number;
  rate: number;
  description: string;
}

interface CreateMayarInvoiceParams {
  name: string;
  email: string;
  mobile: string;
  description?: string;
  items: MayarInvoiceItem[];
  extraData?: Record<string, unknown>;
}

interface MayarInvoiceData {
  id: string;
  transactionId?: string;
  link: string;
  expiredAt?: number;
  status?: string;
}

function getMayarConfig() {
  const apiKey = process.env.MAYAR_API_KEY;
  const baseUrl = process.env.MAYAR_BASE_URL || "https://api.mayar.io/hl/v2";
  if (!apiKey) {
    throw new ApiError("Konfigurasi MAYAR_API_KEY belum diisi", 500);
  }
  return { apiKey, baseUrl };
}

async function mayarRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey, baseUrl } = getMayarConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
  });

  const json = await response.json();

  if (!response.ok || json.statusCode >= 400) {
    throw new ApiError(json.messages || json.message || "Gagal menghubungi Mayar", 502);
  }

  return json.data as T;
}

export async function createMayarInvoice(params: CreateMayarInvoiceParams): Promise<MayarInvoiceData> {
  return mayarRequest<MayarInvoiceData>("/invoices/create", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getMayarInvoice(id: string): Promise<MayarInvoiceData> {
  return mayarRequest<MayarInvoiceData>(`/invoices/${id}`, {
    method: "GET",
  });
}
