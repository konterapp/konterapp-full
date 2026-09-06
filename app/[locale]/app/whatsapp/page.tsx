'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, RefreshCw, Send, Unplug, Wifi, WifiOff } from 'lucide-react';
import {
  connectWhatsapp,
  disconnectWhatsapp,
  getWhatsappMessages,
  getWhatsappStatus,
  sendWhatsappTest,
  updateWhatsappSettings,
  WhatsappMessage,
  WhatsappSettings,
  WhatsappSessionStatus,
  WhatsappStatusResponse,
} from '@/lib/api/app/whatsapp';
import { useToast } from '@/components/toast/ToastContainer';

const STATUS_LABEL: Record<WhatsappSessionStatus, string> = {
  disconnected: 'Terputus',
  connecting: 'Menghubungkan...',
  waiting_qr: 'Menunggu Scan QR',
  connected: 'Terhubung',
  failed: 'Gagal',
};

const STATUS_COLOR: Record<WhatsappSessionStatus, string> = {
  disconnected: 'bg-gray-100 text-gray-700',
  connecting: 'bg-yellow-100 text-yellow-700',
  waiting_qr: 'bg-orange-100 text-orange-700',
  connected: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const MESSAGE_STATUS_LABEL: Record<string, string> = {
  pending: 'Antri',
  sending: 'Mengirim',
  sent: 'Terkirim',
  failed: 'Gagal',
  resolved: 'Selesai',
};

export default function WhatsappSettingsPage() {
  const toast = useToast();

  const [data, setData] = useState<WhatsappStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [allowPoll, setAllowPoll] = useState(false);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [settings, setSettings] = useState<WhatsappSettings>({
    target_phone: '',
    stock_low_enabled: false,
    stock_low_threshold: null,
    saldo_low_enabled: false,
    saldo_low_threshold: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const latestDataRef = useRef(data);
  latestDataRef.current = data;

  const fetchMessages = useCallback(async () => {
    try {
      const response = await getWhatsappMessages();
      if (response.status === 'success' && response.data) {
        setMessages(response.data.data);
      }
    } catch {
      // abaikan -- log pesan sifatnya pelengkap
    }
  }, []);

  const loadStatus = useCallback(async (effectiveAllowPoll?: boolean) => {
    try {
      const response = await getWhatsappStatus();
      if (response.status === 'success' && response.data) {
        setData(response.data);
        setSettings((prev) => ({
          ...prev,
          target_phone: response.data.settings.target_phone ?? prev.target_phone ?? '',
          stock_low_enabled: response.data.settings.stock_low_enabled,
          stock_low_threshold: response.data.settings.stock_low_threshold ?? prev.stock_low_threshold ?? null,
          saldo_low_enabled: response.data.settings.saldo_low_enabled,
          saldo_low_threshold: response.data.settings.saldo_low_threshold ?? prev.saldo_low_threshold ?? null,
        }));
        const status = response.data.status;
        setAllowPoll(status === 'connecting' || status === 'waiting_qr' || status === 'connected');
        if (effectiveAllowPoll !== false && status === 'connected') {
          fetchMessages();
        }
      }
    } catch {
      // abaikan -- status diproses ulang oleh polling berikutnya
    } finally {
      setIsLoading(false);
    }
  }, [fetchMessages]);

  useEffect(() => {
    loadStatus(true);
    const timer = setInterval(() => {
      const current = latestDataRef.current;
      if (current && (current.status === 'connecting' || current.status === 'waiting_qr')) {
        loadStatus(true);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [loadStatus]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await connectWhatsapp();
      if (response.status === 'success' && response.data) {
        setData((prev) => ({ ...(prev as WhatsappStatusResponse), ...response.data }));
        toast.success(response.message || 'Menghubungkan WhatsApp...');
      } else {
        toast.error(response.message || 'Gagal menghubungkan WhatsApp');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghubungkan');
    } finally {
      setIsConnecting(false);
      loadStatus(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await disconnectWhatsapp();
      if (response.status === 'success') {
        toast.success('Koneksi WhatsApp diputus');
        setAllowPoll(false);
      } else {
        toast.error(response.message || 'Gagal memutus koneksi');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memutus koneksi');
    } finally {
      loadStatus(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await updateWhatsappSettings({
        targetPhone: settings.target_phone || null,
        stockLowEnabled: settings.stock_low_enabled,
        stockLowThreshold: settings.stock_low_enabled ? settings.stock_low_threshold : null,
        saldoLowEnabled: settings.saldo_low_enabled,
        saldoLowThreshold: settings.saldo_low_enabled ? settings.saldo_low_threshold : null,
      });
      if (response.status === 'success' && response.data) {
        setSettings((prev) => ({
          ...prev,
          target_phone: response.data?.target_phone ?? prev.target_phone ?? '',
          stock_low_enabled: response.data?.stock_low_enabled ?? false,
          stock_low_threshold: response.data?.stock_low_threshold ?? prev.stock_low_threshold,
          saldo_low_enabled: response.data?.saldo_low_enabled ?? false,
          saldo_low_threshold: response.data?.saldo_low_threshold ?? prev.saldo_low_threshold,
        }));
        toast.success(response.message || 'Pengaturan tersimpan');
      } else {
        const firstError = response.errors ? Object.values(response.errors).flat()[0] : null;
        toast.error(firstError || response.message || 'Gagal menyimpan pengaturan');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!settings.target_phone) {
      toast.error('Isi nomor WhatsApp tujuan terlebih dahulu');
      return;
    }
    setIsTesting(true);
    try {
      const response = await sendWhatsappTest({ phone: settings.target_phone });
      if (response.status === 'success') {
        toast.success(response.message || 'Notifikasi tes terkirim');
        fetchMessages();
      } else {
        const firstError = response.errors ? Object.values(response.errors).flat()[0] : null;
        toast.error(firstError || response.message || 'Gagal mengirim notifikasi tes');
      }
    } catch {
      toast.error('Terjadi kesalahan saat mengirim tes');
    } finally {
      setIsTesting(false);
    }
  };

  const status = data?.status ?? 'disconnected';
  const connected = status === 'connected';
  const showPollHint = allowPoll && (status === 'connecting' || status === 'waiting_qr');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Pengaturan WhatsApp</h1>
        <p className="text-gray-600 mt-1">
          Hubungkan WhatsApp bisnis Anda lalu atur notifikasi otomatis (stok menipis, saldo menipis).
        </p>
      </div>

      {/* Koneksi */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#142D52]/5 flex items-center justify-center text-[#142D52]">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Koneksi WhatsApp</h2>
              <p className="text-xs text-gray-500">
                {data?.phone_number ? `Terpasang di nomor ${data.phone_number}` : 'Belum ada nomor terhubung'}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[status]}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {STATUS_LABEL[status]}
          </span>
        </div>

        {showPollHint && (
          <div className="flex items-center gap-2 text-xs text-orange-600 mb-4">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Memeriksa status koneksi secara berkala...
          </div>
        )}

        {status === 'waiting_qr' && data?.qr_image && (
          <div className="flex flex-col items-center gap-3 mb-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6">
            <p className="text-sm font-medium text-gray-700">
              Scan QR ini dengan <strong>WhatsApp</strong> di HP Anda (menu Link Devices / WhatsApp Web).
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qr_image} alt="QR Code WhatsApp" className="w-64 h-64 bg-white p-2 rounded-lg border border-gray-200" />
            <p className="text-xs text-gray-500">QR diperbarui otomatis. Koneksi aman & hanya dipakai akun ini.</p>
          </div>
        )}

        {status === 'failed' && data?.last_error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {data.last_error}
          </div>
        )}

        <div className="flex items-center gap-3">
          {connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-600/20 transition-all cursor-pointer"
            >
              <Unplug className="w-4 h-4" />
              Putuskan Koneksi
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Wifi className="w-4 h-4" />
              {isConnecting ? 'Menghubungkan...' : 'Hubungkan WhatsApp'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isTesting || !connected}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[#142D52] bg-[#142D52]/5 hover:bg-[#142D52]/10 focus:ring-4 focus:ring-[#142D52]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isTesting ? 'Mengirim...' : 'Kirim Notifikasi Tes'}
          </button>
        </div>

        {!connected && (
          <p className="text-xs text-gray-500 mt-3">
            Fitur ini memakai Baileys (WhatsApp Web, tidak resmi). Gunakan nomor khusus / tidak untuk nomor bisnis utama.
          </p>
        )}
      </div>

      {/* Pengaturan notifikasi */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Notifikasi Otomatis</h2>

        <div>
          <label htmlFor="wa_target_phone" className="block text-sm font-medium text-gray-700 mb-2">
            Nomor WhatsApp Penerima Notifikasi
          </label>
          <input
            type="text"
            id="wa_target_phone"
            value={settings.target_phone ?? ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, target_phone: e.target.value }))}
            placeholder="contoh: 0812xxxxxxx"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">
            Penerima bisa nomor pemilik atau HP pribadi yang sama dengan nomor terhubung.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.stock_low_enabled}
              onChange={(e) => setSettings((prev) => ({ ...prev, stock_low_enabled: e.target.checked }))}
              className="w-4 h-4 accent-[#142D52] cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Notifikasi Stok Menipis</p>
              <p className="text-xs text-gray-500">Kirim peringatan saat stok barang di bawah batas minimal.</p>
            </div>
          </label>
          {settings.stock_low_enabled && (
            <div>
              <label htmlFor="wa_stock_low_threshold" className="block text-xs font-medium text-gray-600 mb-1">
                Batas Stok Minimum (pcs)
              </label>
              <input
                type="number"
                id="wa_stock_low_threshold"
                min={0}
                step={1}
                value={settings.stock_low_threshold ?? ''}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, stock_low_threshold: e.target.value === '' ? null : Number(e.target.value) }))
                }
                className="w-full max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
              />
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.saldo_low_enabled}
              onChange={(e) => setSettings((prev) => ({ ...prev, saldo_low_enabled: e.target.checked }))}
              className="w-4 h-4 accent-[#142D52] cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Notifikasi Saldo Menipis</p>
              <p className="text-xs text-gray-500">Kirim peringatan saat saldo akun (kas/bank/e-wallet) di bawah batas.</p>
            </div>
          </label>
          {settings.saldo_low_enabled && (
            <div>
              <label htmlFor="wa_saldo_low_threshold" className="block text-xs font-medium text-gray-600 mb-1">
                Batas Saldo Minimum (Rp)
              </label>
              <input
                type="number"
                id="wa_saldo_low_threshold"
                min={0}
                step={1000}
                value={settings.saldo_low_threshold ?? ''}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, saldo_low_threshold: e.target.value === '' ? null : Number(e.target.value) }))
                }
                className="w-full max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>

      {/* Log pesan */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Log Pesan</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada pesan yang dikirim.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {messages.map((message) => (
              <li key={message.uuid} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-800">{message.recipient_phone}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{formatDateTime(message.created_at)}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        message.status === 'sent'
                          ? 'bg-green-100 text-green-700'
                          : message.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : message.status === 'resolved'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {MESSAGE_STATUS_LABEL[message.status] ?? message.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 whitespace-pre-line line-clamp-2">{message.text}</p>
                {message.status === 'failed' && message.error_message && (
                  <p className="text-xs text-red-500 mt-1">{message.error_message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      )}
    </div>
  );
}