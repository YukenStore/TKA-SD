import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// Buat transporter jika SMTP dikonfigurasi di .env
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (user && pass) {
    if (host.includes('gmail') || user.includes('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
};

/**
 * Helper internal untuk mengirim email (Brevo API, Resend API, dengan fallback SMTP)
 */
export const sendMailInternal = async ({ to, subject, text, html }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!brevoApiKey && !resendApiKey && (!user || !pass)) {
    throw new Error(
      'Server belum dikonfigurasi untuk mengirim email. Silakan isi BREVO_API_KEY, RESEND_API_KEY, atau SMTP_USER & SMTP_PASS di backend/.env.'
    );
  }

  // 1. Prioritaskan pengiriman via Brevo REST API jika API Key tersedia (port 443 HTTPS, bebas blokir ISP)
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: process.env.EMAIL_FROM_NAME || 'Portal TKA SD',
            email: process.env.BREVO_FROM_EMAIL || process.env.SMTP_USER || 'noreply@tkasd.com',
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Brevo API HTTP ${response.status}`);
      }

      console.log(`[EMAIL/BREVO] Email berhasil dikirim ke: ${to} (MessageID: ${data.messageId})`);
      return { sent: true, provider: 'brevo' };
    } catch (err) {
      console.error('[BREVO FAILED]:', err.message);
    }
  }

  // 2. Pengiriman via Resend API jika API Key tersedia
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromSender = process.env.RESEND_FROM || 'Portal TKA SD <onboarding@resend.dev>';

      const { data, error } = await resend.emails.send({
        from: fromSender,
        to: [to],
        subject,
        text,
        html,
      });

      if (error) {
        if (error.message?.includes('only send testing emails to your own email address')) {
          const match = error.message.match(/\(([^)]+)\)/);
          const ownerEmail = match ? match[1] : 'akun terdaftar';
          throw new Error(
            `Kunci RESEND_API_KEY di backend/.env terdaftar untuk ${ownerEmail}, sehingga Resend menolak kirim ke ${to}. Silakan buat API Key gratis di resend.com menggunakan akun ${to} lalu perbarui RESEND_API_KEY di backend/.env`
          );
        }
        throw new Error(`Resend: ${error.message}`);
      }

      console.log(`[EMAIL/RESEND] Email berhasil dikirim ke: ${to} (ID: ${data?.id})`);
      return { sent: true, provider: 'resend' };
    } catch (err) {
      console.error('[RESEND FAILED]:', err.message);
      if (!user || !pass) {
        throw err;
      }
      console.log('[EMAIL] Mencoba fallback ke Google SMTP...');
      // Simpan error resend untuk pesan gabungan jika SMTP juga gagal
      var lastResendError = err.message;
    }
  }

  // 3. Pengiriman via Transporter SMTP (Gmail)
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Gagal menginisialisasi pengirim email SMTP. Periksa konfigurasi di backend/.env.');
  }

  try {
    await transporter.sendMail({
      from: `"Portal Belajar TKA SD" <${process.env.SMTP_USER}>`,
      replyTo: process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        Importance: 'Normal',
        'X-Entity-Ref-ID': `tka-${Date.now()}`,
      },
    });
    console.log(`[EMAIL/SMTP] Email berhasil dikirim ke: ${to}`);
    return { sent: true, provider: 'smtp' };
  } catch (err) {
    console.error(`[SMTP ERROR]:`, err.message);
    const detail = lastResendError || `Koneksi SMTP diblokir provider (${err.message})`;
    throw new Error(detail);
  }
};

/**
 * Mengirim email kode verifikasi OTP pendaftaran akun
 * @param {string} to - Alamat email penerima
 * @param {string} otpCode - 6 digit kode OTP
 * @param {string} username - Nama pengguna
 * @returns {Promise<{ sent: boolean }>}
 */
export const sendOtpEmail = async (to, otpCode, username = 'Siswa') => {
  const subject = '[TKA SD] Verifikasi Pendaftaran Akun Baru Anda';
  const text = `Halo ${username},\n\nKode verifikasi akun TKA SD Anda adalah: ${otpCode}\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun demi keamanan akun Anda.\n\nSalam,\nTim Portal TKA SD`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Kode Verifikasi TKA SD</title>
    </head>
    <body style="font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin: 0 auto;">
        <tr>
          <td style="padding: 24px 28px 16px 28px; text-align: center; background-color: #2563eb;">
            <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: bold; letter-spacing: 0.5px;">Portal TKA SD</h1>
            <p style="color: #dbeafe; font-size: 13px; margin: 4px 0 0 0;">Tes Kemampuan Akademik Sekolah Dasar</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px;">
            <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px 0; color: #334155;">
              Halo <strong>${username}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #475569;">
              Terima kasih telah mendaftar di Portal Latihan Soal TKA SD. Berikut adalah kode verifikasi akun Anda:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <div style="display: inline-block; background-color: #eff6ff; border: 2px dashed #2563eb; border-radius: 8px; padding: 12px 28px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1d4ed8; font-family: monospace;">
                  ${otpCode}
                </span>
              </div>
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 16px 0; text-align: center;">
              Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
            <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
              Jika Anda tidak merasa melakukan pendaftaran akun di Portal TKA SD, abaikan email ini.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; padding: 16px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
              &copy; ${new Date().getFullYear()} Portal TKA SD. Seluruh hak cipta dilindungi.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    return await sendMailInternal({ to, subject, text, html });
  } catch (err) {
    console.warn(`\n================================================================================`);
    console.warn(`⚠️ [KONEKSI EMAIL TERKENDALA - SIMULASI OTP KONSOL DIAKTIFKAN]`);
    console.warn(`--------------------------------------------------------------------------------`);
    console.warn(`Tujuan      : ${to} (${username})`);
    console.warn(`Keperluan   : Verifikasi Akun Baru`);
    console.warn(`🔑 KODE OTP : [ ${otpCode} ]`);
    console.warn(`Masa Berlaku: 10 Menit`);
    console.warn(`Penyebab    : ${err.message}`);
    console.warn(`Solusi      : Salin kode OTP di atas untuk verifikasi pendaftaran di browser.`);
    console.warn(`================================================================================\n`);

    throw new Error(err.message);
  }
};

/**
 * Mengirim email kode OTP untuk Reset Password pengguna
 * @param {string} to - Alamat email penerima
 * @param {string} otpCode - 6 digit kode OTP reset
 * @param {string} username - Nama pengguna
 * @returns {Promise<{ sent: boolean }>}
 */
export const sendResetPasswordEmail = async (to, otpCode, username = 'Pengguna') => {
  const subject = '[TKA SD] Permintaan Reset Kata Sandi Akun';
  const text = `Halo ${username},\n\nKami menerima permintaan untuk mereset kata sandi (password) akun Anda di Portal TKA SD.\n\nKode verifikasi reset password Anda adalah: ${otpCode}\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun demi keamanan akun Anda.\n\nJika Anda tidak merasa meminta reset password, akun Anda tetap aman dan Anda dapat mengabaikan email ini.\n\nSalam,\nTim Portal TKA SD`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Reset Password TKA SD</title>
    </head>
    <body style="font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin: 0 auto;">
        <tr>
          <td style="padding: 24px 28px 16px 28px; text-align: center; background-color: #0f172a;">
            <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: bold; letter-spacing: 0.5px;">Portal TKA SD</h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Permintaan Reset Kata Sandi Akun</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px;">
            <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px 0; color: #334155;">
              Halo <strong>${username}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #475569;">
              Kami menerima permintaan untuk mereset kata sandi (password) akun Portal TKA SD Anda. Gunakan kode keamanan berikut untuk mengatur password baru:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #0f172a; border-radius: 8px; padding: 12px 28px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a; font-family: monospace;">
                  ${otpCode}
                </span>
              </div>
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 16px 0; text-align: center;">
              Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
            <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
              Jika Anda tidak meminta perubahan kata sandi ini, akun Anda tetap aman dan abaikan email ini.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; padding: 16px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
              &copy; ${new Date().getFullYear()} Portal TKA SD. Seluruh hak cipta dilindungi.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    return await sendMailInternal({ to, subject, text, html });
  } catch (err) {
    console.warn(`\n================================================================================`);
    console.warn(`⚠️ [KONEKSI EMAIL TERKENDALA - SIMULASI OTP KONSOL DIAKTIFKAN]`);
    console.warn(`--------------------------------------------------------------------------------`);
    console.warn(`Tujuan      : ${to} (${username})`);
    console.warn(`Keperluan   : Reset Password Akun`);
    console.warn(`🔑 KODE OTP : [ ${otpCode} ]`);
    console.warn(`Masa Berlaku: 10 Menit`);
    console.warn(`Penyebab    : ${err.message}`);
    console.warn(`Solusi      : Salin kode OTP di atas untuk melanjutkan form reset di browser.`);
    console.warn(`================================================================================\n`);

    throw new Error(err.message);
  }
};


