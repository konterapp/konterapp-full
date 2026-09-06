import { z } from "zod";

export const midtransNotificationSchema = z.object({
  order_id: z.string({ error: "order_id wajib diisi" }).min(1),
  status_code: z.string({ error: "status_code wajib diisi" }).min(1),
  gross_amount: z.string({ error: "gross_amount wajib diisi" }).min(1),
  transaction_status: z.string({ error: "transaction_status wajib diisi" }).min(1),
  fraud_status: z.string().optional(),
  signature_key: z.string({ error: "signature_key wajib diisi" }).min(1),
});

export const markInvoicePaidSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
