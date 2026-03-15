'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, resendVerification } from '@/lib/api/auth';

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified');
    const verification = searchParams.get('verification');

    if (verified === '1') {
      setSuccessMessage('Email berhasil diverifikasi. Silakan login.');
    } else if (verification === 'expired') {
      setError('Link verifikasi sudah kedaluwarsa. Silakan minta kirim ulang.');
    } else if (verification === 'failed') {
      setError('Verifikasi email gagal. Silakan coba lagi.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setResendMessage('');
    try {
      const response = await resendVerification(unverifiedEmail);
      setResendMessage(response.message || 'Email verifikasi telah dikirim ulang.');
      setResendCooldown(60);
    } catch {
      setResendMessage('Gagal mengirim ulang email. Silakan coba lagi.');
    }
  }, [unverifiedEmail, resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setEmailNotVerified(false);
    setResendMessage('');
    setIsLoading(true);

    try {
      const response = await login(email, password);

      if (response.status === 'success' && response.data) {
        const redirectUrl = searchParams.get('redirect') || '/admin';
        router.push(redirectUrl);
      } else {
        const errors = response.errors as Record<string, string[]> | undefined;
        if (errors) {
          if (errors.error_code?.includes('EMAIL_NOT_VERIFIED')) {
            setEmailNotVerified(true);
            setUnverifiedEmail(email);
          }
          setFieldErrors(errors);
        }
        setError(response.message || 'Email atau password salah');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    fieldErrors,
    successMessage,
    emailNotVerified,
    resendCooldown,
    resendMessage,
    handleSubmit,
    handleResend,
  };
}
