import { ApiError } from "@/lib/api-errors";

interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
}

interface SnapTransactionData {
  token: string;
  redirect_url: string;
}

function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new ApiError("Konfigurasi MIDTRANS_SERVER_KEY belum diisi", 500);
  }
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const baseUrl = isProduction
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";
  return { serverKey, baseUrl };
}

export async function createSnapTransaction(params: CreateSnapTransactionParams): Promise<SnapTransactionData> {
  const { serverKey, baseUrl } = getMidtransConfig();
  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

  const response = await fetch(`${baseUrl}/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      },
      item_details: [
        {
          id: params.orderId,
          price: params.grossAmount,
          quantity: 1,
          name: params.itemName,
        },
      ],
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(json.error_messages?.join(", ") || "Gagal menghubungi Midtrans", 502);
  }

  return json as SnapTransactionData;
}

export function getMidtransServerKey(): string {
  const { serverKey } = getMidtransConfig();
  return serverKey;
}
