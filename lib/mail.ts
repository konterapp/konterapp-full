import nodemailer from "nodemailer";

/**
 * Helper kirim email. Kalau MAIL_HOST tidak diisi (mode development),
 * email cuma dilog ke console supaya link verifikasi tetap bisa diambil
 * tanpa setup SMTP.
 */
export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const { to, subject, html, text } = params;

  if (!process.env.MAIL_HOST) {
    console.log(
      `[mail:dev] Ke: ${to}\n[mail:dev] Subjek: ${subject}\n[mail:dev] ${text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`
    );
    return;
  }

  const host = process.env.MAIL_HOST;
  const port = Number(process.env.MAIL_PORT ?? 587);
  const secure =
    process.env.MAIL_SECURE !== undefined
      ? process.env.MAIL_SECURE === "true"
      : process.env.MAIL_ENCRYPTION === "ssl";
  const user = process.env.MAIL_USER ?? process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASS ?? process.env.MAIL_PASSWORD;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? user ?? "KonterApp <no-reply@konterapp.id>",
    to,
    subject,
    html,
    text,
  });
}
