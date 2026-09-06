import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { mkdirSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { whatsappRepository } from "./repository";
import { normalizeWhatsappPhone } from "./phone";
import { runNotificationChecks } from "./notification.service";

export type WhatsappSessionStatus = "disconnected" | "connecting" | "waiting_qr" | "connected" | "failed";

type WaSocket = ReturnType<typeof makeWASocket>;

interface RuntimeSession {
  socket: WaSocket | null;
  status: WhatsappSessionStatus;
  qr: string | null;
  phoneNumber: string | null;
  lastError: string | null;
  connectingPromise: Promise<void> | null;
}

interface WhatsappRuntime {
  sessions: Map<string, RuntimeSession>;
  backgroundStarted: boolean;
}

/**
 * Singleton per proses (globalThis) -- sama pola dgn prisma.ts & tenant-context.ts,
 * supaya socket Baileys tetap hidup walau Turbopack hot-reload module.
 * Crawat: library ini unofficial, satu socket = satu koneksi WhatsApp Web.
 */
const g = globalThis as unknown as {
  __konterWhatsappRuntime?: WhatsappRuntime;
};

function getRuntime(): WhatsappRuntime {
  if (!g.__konterWhatsappRuntime) {
    g.__konterWhatsappRuntime = { sessions: new Map(), backgroundStarted: false };
  }
  return g.__konterWhatsappRuntime;
}

function getStorageDir(companyUuid: string): string {
  // Cred per-company disimpan di filesystem (auth info Baileys berbentuk file).
  return path.join(process.cwd(), "storage", "whatsapp", companyUuid);
}

function formatBaileysError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return String(error);
}

async function persistStatus(
  companyUuid: string,
  status: string,
  extra?: { phoneNumber?: string | null; lastError?: string | null; lastConnectedAt?: Date | null }
) {
  await whatsappRepository.upsertSession(companyUuid, { status, ...extra });
}

/**
 * Mulai koneksi Baileys untuk sebuah company. Idempotent: kalau socket sudah
 * terhubung atau sedang proses connect, tidak membuat socket baru.
 */
async function connectSession(companyUuid: string): Promise<void> {
  const runtime = getRuntime();
  const existing = runtime.sessions.get(companyUuid);
  if (existing?.connectingPromise) {
    return existing.connectingPromise;
  }
  if (existing?.socket && existing.status === "connected") {
    return;
  }
  if (existing?.socket) {
    try {
      existing.socket.end(undefined);
    } catch {
      // abaikan
    }
  }

  const dir = getStorageDir(companyUuid);
  mkdirSync(dir, { recursive: true });

  const state: RuntimeSession = {
    socket: null,
    status: "connecting",
    qr: null,
    phoneNumber: existing?.phoneNumber ?? null,
    lastError: null,
    connectingPromise: null,
  };
  runtime.sessions.set(companyUuid, state);
  await persistStatus(companyUuid, "connecting");

  const start = (async () => {
    const { state: authState, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      browser: Browsers.appropriate("KonterApp"),
      auth: authState,
      printQRInTerminal: false,
      syncFullHistory: false,
      // Jangan sampai server main disuruh sinkronisasi history chat besar.
      markOnlineOnConnect: true,
    });

    const current = runtime.sessions.get(companyUuid);
    if (!current) return;
    current.socket = sock;
    current.status = "connecting";

    sock.ev.on("creds.update", async () => {
      try {
        await saveCreds();
      } catch {
        // abaikan -- kalau gagal simpan cred, scan ulang tetap bisa
      }
    });

    sock.ev.on("connection.update", (update) => {
      const live = runtime.sessions.get(companyUuid);
      if (!live) return;
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        live.qr = qr;
        live.status = "waiting_qr";
        live.lastError = null;
        void persistStatus(companyUuid, "waiting_qr");
      }

      if (connection === "open") {
        const phone = sock.user?.id ? sock.user.id.split("@")[0] : null;
        live.socket = sock;
        live.status = "connected";
        live.qr = null;
        live.phoneNumber = phone;
        live.lastError = null;
        void persistStatus(companyUuid, "connected", {
          phoneNumber: phone,
          lastConnectedAt: new Date(),
        });
        // Kirim pesan yang sudah antri begitu koneksi siap.
        void flushCompanyPending(companyUuid);
      }

      if (connection === "close") {
        const wasConnected = live.status === "connected";
        live.socket = null;
        live.qr = null;
        live.status = "disconnected";

        const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
          ?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const normalClose = statusCode === DisconnectReason.connectionClosed;
        const errorMessage = formatBaileysError(lastDisconnect?.error);

        if (!wasConnected && !loggedOut && !normalClose && errorMessage) {
          live.lastError = errorMessage;
          void persistStatus(companyUuid, "failed", { lastError: errorMessage });
        } else {
          live.lastError = null;
          void persistStatus(companyUuid, "disconnected");
        }
      }
    });

    // (Error di baileys muncul lewat connection.update -> lastDisconnect.error,
      // jadi tidak perlu listener 'error' terpisah yang tidak ada di event map-nya.)
    })();

  state.connectingPromise = start;
  try {
    await start;
  } finally {
    if (runtime.sessions.get(companyUuid)?.connectingPromise === state.connectingPromise) {
      runtime.sessions.get(companyUuid)!.connectingPromise = null;
    }
  }
}

/** Pastikan background task (reconnect & notifikasi) berjalan sekali per proses. */
function startBackgroundTasks() {
  const runtime = getRuntime();
  if (runtime.backgroundStarted) return;
  runtime.backgroundStarted = true;

  setInterval(() => {
    void reconnectStoredSessions().catch(() => {});
  }, 30_000);

  setInterval(() => {
    void runNotificationChecks().catch(() => {});
  }, 60_000);

  setInterval(() => {
    void flushAllPending().catch(() => {});
  }, 10_000);
}

/** Reconnect sesi yang tadinya connected/connecting saat proses restart. */
async function reconnectStoredSessions(): Promise<void> {
  const runtime = getRuntime();
  const rows = await whatsappRepository.findCompanyUuidsByStatuses(["connected", "connecting", "waiting_qr"]);
  for (const row of rows) {
    const current = runtime.sessions.get(row.companyUuid);
    if (!current?.socket) {
      await connectSession(row.companyUuid).catch(() => {});
    }
  }
}

/** Pastikan ada koneksi untuk company (dipakai route status/connect). */
async function ensureSession(companyUuid: string): Promise<void> {
  startBackgroundTasks();
  await connectSession(companyUuid);
}

async function disconnectSession(companyUuid: string): Promise<void> {
  const runtime = getRuntime();
  const session = runtime.sessions.get(companyUuid);
  if (session?.socket) {
    try {
      session.socket.end(undefined);
    } catch {
      // abaikan
    }
  }
  runtime.sessions.delete(companyUuid);
  await whatsappRepository.upsertSession(companyUuid, { status: "disconnected", lastError: null });
}

export async function getSessionState(
  companyUuid: string
): Promise<{ status: WhatsappSessionStatus; qrImage: string | null; phoneNumber: string | null; lastError: string | null }> {
  const runtime = getRuntime();
  let session = runtime.sessions.get(companyUuid);

  // Kalau belum ada di memory, coba pulihkan (reconnect tanpa QR kalau cred ada).
  if (!session) {
    await ensureSession(companyUuid);
    session = runtime.sessions.get(companyUuid);
  }

  if (!session) {
    return { status: "disconnected", qrImage: null, phoneNumber: null, lastError: null };
  }

  if (session.status === "waiting_qr" && session.qr) {
    const qrImage = await QRCode.toDataURL(session.qr, {
      width: 280,
      margin: 1,
      color: { dark: "#142D52", light: "#FFFFFF" },
    });
    return { status: session.status, qrImage, phoneNumber: null, lastError: session.lastError };
  }

  return {
    status: session.status,
    qrImage: null,
    phoneNumber: session.phoneNumber,
    lastError: session.lastError,
  };
}

/** Flush pesan pending milik satu company yang socket-nya connected. */
async function flushCompanyPending(companyUuid: string): Promise<void> {
  const runtime = getRuntime();
  const session = runtime.sessions.get(companyUuid);
  if (!session?.socket || session.status !== "connected") {
    return;
  }

  const messages = await whatsappRepository.findPendingMessages(companyUuid);
  for (const msg of messages) {
    await whatsappRepository.markMessageSending(msg.uuid);
    try {
      const jid = `${normalizeWhatsappPhone(msg.recipientPhone)}@s.whatsapp.net`;
      await session.socket.sendMessage(jid, { text: msg.text });
      await whatsappRepository.markMessageSent(msg.uuid);
    } catch (err) {
      await whatsappRepository.markMessageFailed(msg.uuid, formatBaileysError(err) ?? "Gagal mengirim pesan");
    }
  }
}

async function flushAllPending(): Promise<void> {
  const runtime = getRuntime();
  for (const companyUuid of runtime.sessions.keys()) {
    await flushCompanyPending(companyUuid);
  }
}

/** Kirim pesan sesaat (dipakai tombol "Kirim notifikasi tes"). Butuh koneksi aktif. */
export async function sendTextMessage(companyUuid: string, recipientPhone: string, text: string): Promise<void> {
  const runtime = getRuntime();
  const session = runtime.sessions.get(companyUuid);
  if (!session?.socket || session.status !== "connected") {
    throw new Error("WhatsApp belum terhubung. Silakan sambungkan dulu lewat tombol Connect.");
  }
  const jid = `${normalizeWhatsappPhone(recipientPhone)}@s.whatsapp.net`;
  await session.socket.sendMessage(jid, { text });
}

export const whatsappSocketManager = {
  ensureSession,
  getSessionState,
  disconnectSession,
  sendTextMessage,
  flushCompanyPending,
  startBackgroundTasks,
};