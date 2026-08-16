export interface ProfileCompany {
  uuid: string;
  code: string;
  name: string;
}

export interface ProfileData {
  uuid: string;
  name: string;
  email: string;
  companies: ProfileCompany[];
  roles: { companyUuid: string; name: string }[];
  created_at: string;
  updated_at: string;
}

export async function getProfile(): Promise<{ status: string; message?: string; data?: ProfileData }> {
  const response = await fetch('/api/app/profile');
  return response.json();
}

export async function updateProfile(data: {
  name?: string;
  current_password?: string;
  new_password?: string;
  new_password_confirmation?: string;
}): Promise<{ status: string; message?: string; data?: ProfileData; errors?: Record<string, string[]> }> {
  const response = await fetch('/api/app/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
