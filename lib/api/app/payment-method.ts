export interface PaymentMethod {
  uuid: string;
  code: string;
  name: string;
  type: string;
  account_number?: string;
  account_name?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAllPaymentMethods(): Promise<{ status: string; data: PaymentMethod[] }> {
  const response = await fetch('/api/app/pos/payment-methods');
  return response.json();
}

export async function getPaymentMethod(uuid: string): Promise<{ status: string; data: PaymentMethod }> {
  const response = await fetch(`/api/app/pos/payment-methods/${uuid}`);
  return response.json();
}

export async function createPaymentMethod(data: {
  code: string;
  name: string;
  type: string;
  account_number?: string;
  account_name?: string;
  description?: string;
  is_active?: boolean;
}): Promise<{ status: string; data: PaymentMethod }> {
  const response = await fetch('/api/app/pos/payment-methods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updatePaymentMethod(
  uuid: string,
  data: {
    code?: string;
    name?: string;
    type?: string;
    account_number?: string;
    account_name?: string;
    description?: string;
    is_active?: boolean;
  }
): Promise<{ status: string; data: PaymentMethod }> {
  const response = await fetch(`/api/app/pos/payment-methods/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deletePaymentMethod(uuid: string): Promise<{ status: string }> {
  const response = await fetch(`/api/app/pos/payment-methods/${uuid}`, {
    method: 'DELETE',
  });
  return response.json();
}
