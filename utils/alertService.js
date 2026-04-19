/**
 * Alert Service — kirim notifikasi ke admin saat ada aktivitas mencurigakan
 * Email dikirim ke ADMIN_ALERT_EMAIL di environment variables
 */

const ALERT_COOLDOWN = new Map(); // Cegah spam alert
const COOLDOWN_MS = 5 * 60 * 1000; // 5 menit per IP

/**
 * Kirim alert ke admin
 * @param {string} type - Jenis alert: 'brute_force' | 'honeypot' | 'injection'
 * @param {object} details - Detail kejadian
 */
async function sendSecurityAlert(type, details) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) return; // Tidak dikonfigurasi, skip

  // Cegah spam — max 1 alert per IP per 5 menit
  const cooldownKey = `${type}_${details.ip}`;
  if (ALERT_COOLDOWN.has(cooldownKey)) return;
  ALERT_COOLDOWN.set(cooldownKey, true);
  setTimeout(() => ALERT_COOLDOWN.delete(cooldownKey), COOLDOWN_MS);

  const typeLabels = {
    brute_force: '🔴 PERCOBAAN BRUTE FORCE LOGIN',
    honeypot: '🟡 AKSES HONEYPOT TERDETEKSI',
    injection: '🔴 PERCOBAAN INJECTION ATTACK',
    unauthorized: '🟠 AKSES TIDAK SAH',
  };

  const subject = `[SIVILIZE SECURITY] ${typeLabels[type] || type}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;padding:32px;border-radius:12px;">
      <h2 style="color:#FF7A00;margin:0 0 16px;">⚠️ Security Alert</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">Aktivitas mencurigakan terdeteksi di SIVILIZE HUB PRO</p>
      
      <div style="background:#121826;border:1px solid #1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;">DETAIL KEJADIAN</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;padding:4px 0;width:120px;">Tipe</td><td style="color:#f97316;font-weight:bold;">${typeLabels[type] || type}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">IP Address</td><td style="color:#fff;font-family:monospace;">${details.ip || 'Unknown'}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">Waktu</td><td style="color:#fff;">${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">Endpoint</td><td style="color:#fff;font-family:monospace;">${details.endpoint || '-'}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">Method</td><td style="color:#fff;">${details.method || '-'}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">User Agent</td><td style="color:#fff;font-size:12px;">${(details.userAgent || '-').substring(0, 100)}</td></tr>
          ${details.email ? `<tr><td style="color:#94a3b8;padding:4px 0;">Email</td><td style="color:#fff;">${details.email}</td></tr>` : ''}
          ${details.attempts ? `<tr><td style="color:#94a3b8;padding:4px 0;">Percobaan</td><td style="color:#f97316;font-weight:bold;">${details.attempts}x</td></tr>` : ''}
        </table>
      </div>
      
      <p style="color:#475569;font-size:12px;margin:0;">
        Email ini dikirim otomatis oleh sistem keamanan SIVILIZE HUB PRO.<br>
        Jika ini bukan aktivitas yang lo kenal, segera periksa server.
      </p>
    </div>
  `;

  try {
    // Gunakan emailService yang sudah ada
    const emailService = process.env.EMAIL_SERVICE || 'nodemailer';

    if (emailService === 'resend' && process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'security@sivilize.app',
          to: [adminEmail],
          subject,
          html,
        }),
      });
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { rejectUnauthorized: false },
      });
      await transporter.sendMail({
        from: `"SIVILIZE Security" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: adminEmail,
        subject,
        html,
      });
    }

    console.log(`📧 Security alert terkirim ke ${adminEmail}: ${type}`);
  } catch (err) {
    console.error('❌ Gagal kirim security alert:', err.message);
  }
}

module.exports = { sendSecurityAlert };
