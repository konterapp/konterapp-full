import { apiRequest, ApiResponse } from '../api';

export interface ReferralStats {
  total_referrals: number;
  paid_referrals: number;
  total_commission: number;
}

export interface ReferralItem {
  id: number;
  name: string;
  email: string;
  verified: boolean;
  joined_at: string;
}

export interface CommissionItem {
  uuid: string;
  amount: number;
  base_amount: number;
  plan_code: string;
  status: string;
  created_at: string;
  referred: { name: string; email: string };
}

export interface ReferralDashboard {
  referral_code: string;
  referral_balance: number;
  name: string | null;
  stats: ReferralStats;
  referrals: ReferralItem[];
  commissions: CommissionItem[];
}

export async function getReferralDashboard(): Promise<ApiResponse<ReferralDashboard>> {
  return apiRequest<ReferralDashboard>('/api/app/referral');
}