'use client';

import { useEffect } from 'react';
import { apiRequest } from '@/lib/api/api';

export default function ReferralClaimer() {
  useEffect(() => {
    const code = localStorage.getItem('pending_referral_code');
    if (!code) return;

    apiRequest('/api/app/referral/claim', {
      method: 'POST',
      data: { code },
    }).finally(() => {
      localStorage.removeItem('pending_referral_code');
    });
  }, []);

  return null;
}
