/**
 * Alert Service — kirim notifikasi ke admin saat ada aktivitas mencurigakan
 * Email dikirim ke ADMIN_ALERT_EMAIL di environment variables
 */

const ALERT_COOLDOWN = new Map(); // Cegah spam alert
const COOLDOWN_MS = 5 * 60 * 1000; // 5 menit per IP

/**
 * Lookup informasi IP (negara, kota, ISP)
 */
async function lookupIP(ip) {
  try {
    // Skip private/local IPs
    if (!ip || ip === 'unknown' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.') || ip === '::1') {
      return { country: 'Local/Private', city: '-', isp: '-', org: '-' };
    }
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,org,lat,lon,regionName`);
    const data = await response.json();
    if (data.status === 'success') {
      return {
        country: data.country || '-',
        city: data.city || '-',
        region: data.regionName || '-',
        isp: data.isp || '-',
        org: data.org || '-',
        lat: data.lat,
        lon: data.lon,
      };
    }
  } catch {}
  return { country: 'Unknown', city: '-', isp: '-', org: '-' };
}

/**
 * Kirim alert ke admin
 */
async function sendSecurityAlert(type, details) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) return;

  // Cegah spam
  const cooldownKey = `${type}_${details.ip}`;
  if (ALERT_COOLDOWN.has(cooldownKey)) return;
  ALERT_COOLDOWN.set(cooldownKey, true);
  setTimeout(() => ALERT_COOLDOWN.delete(cooldownKey), COOLDOWN_MS);

  // Lookup IP info
  const ipInfo = await lookupIP(details.ip);

  const typeLabels = {
    brute_force: '🔴 PERCOBAAN BRUTE FORCE LOGIN',
    honeypot: '🟡 AKSES HONEYPOT TERDETEKSI',
    injection: '🔴 PERCOBAAN INJECTION ATTACK',
    unauthorized: '🟠 AKSES TIDAK SAH',
  };

  const subject = `[SIVILIZE SECURITY] ${typeLabels[type] || type}`;

  // Google Maps link jika ada koordinat
  const mapsLink = ipInfo.lat && ipInfo.lon
    ? `https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon}`
    : null;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;padding:32px;border-radius:12px;">
      <h2 style="color:#FF7A00;margin:0 0 16px;">⚠️ Security Alert</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">Aktivitas mencurigakan terdeteksi di SIVILIZE HUB PRO</p>
      
      <div style="background:#121826;border:1px solid #1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;">DETAIL KEJADIAN</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;padding:4px 0;width:140px;">Tipe Serangan</td><td style="color:#f97316;font-weight:bold;">${typeLabels[type] || type}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">IP Address</td><td style="color:#fff;font-family:monospace;font-weight:bold;">${details.ip || 'Unknown'}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">Waktu</td><td style="color:#fff;">${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">Endpoint</td><td style="color:#fff;font-family:monospace;">${details.endpoint || '-'}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">Method</td><td style="color:#fff;">${details.method || '-'}</td></tr>
          ${details.email ? `<tr><td style="color:#94a3b8;padding:4px 0;">Email Target</td><td style="color:#fff;">${details.email}</td></tr>` : ''}
          ${details.attempts ? `<tr><td style="color:#94a3b8;padding:4px 0;">Percobaan</td><td style="color:#f97316;font-weight:bold;">${details.attempts}x</td></tr>` : ''}
        </table>
      </div>

      <div style="background:#0f172a;border:1px solid #f97316;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;color:#f97316;font-size:12px;text-transform:uppercase;font-weight:bold;">📍 LOKASI PENYERANG</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;padding:4px 0;width:140px;">Negara</td><td style="color:#fff;font-weight:bold;">${ipInfo.country}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">Kota</td><td style="color:#fff;">${ipInfo.city}${ipInfo.region ? ', ' + ipInfo.region : ''}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">ISP/Provider</td><td style="color:#fff;">${ipInfo.isp}</td></tr>
          <tr><td style="color:#94a3b8;padding:4px 0;">Organisasi</td><td style="color:#fff;">${ipInfo.org}</td></tr>
          ${mapsLink ? `<tr><td style="color:#94a3b8;padding:4px 0;">Koordinat</td><td><a href="${mapsLink}" style="color:#f97316;">Lihat di Google Maps</a></td></tr>` : ''}
        </table>
      </div>

      <div style="background:#121826;border:1px solid #1e293b;border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:12px;">USER AGENT</p>
        <p style="margin:0;color:#94a3b8;font-size:12px;word-break:break-all;">${(details.userAgent || '-').substring(0, 150)}</p>
      </div>

      <div style="background:#1a0a0a;border:1px solid #7f1d1d;border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="margin:0;color:#fca5a5;font-size:13px;">
          🔒 IP ini sudah <strong>diblokir otomatis</strong> oleh sistem firewall SIVILIZE HUB PRO.
          Tidak ada tindakan manual yang diperlukan.
        </p>
      </div>
      
      <p style="color:#475569;font-size:12px;margin:0;">
        Email ini dikirim otomatis oleh sistem keamanan SIVILIZE HUB PRO.<br>
        Jangan balas email ini.
      </p>
    </div>
  `;

  try {
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

    console.log(`📧 Security alert terkirim ke ${adminEmail}: ${type} dari ${details.ip} (${ipInfo.city}, ${ipInfo.country})`);
  } catch (err) {
    console.error('❌ Gagal kirim security alert:', err.message);
  }
}

module.exports = { sendSecurityAlert };
