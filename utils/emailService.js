/**
 * Email Service untuk SIVILIZE HUB PRO
 * Mendukung dua provider: Nodemailer (SMTP) dan Resend API
 * 
 * Environment variables yang dibutuhkan:
 * - EMAIL_SERVICE: 'nodemailer' atau 'resend' (default: 'nodemailer')
 * - EMAIL_FROM: alamat email pengirim (default: noreply@sivilize.app)
 * 
 * Untuk Nodemailer (Gmail SMTP):
 * - SMTP_HOST: smtp.gmail.com
 * - SMTP_PORT: 587
 * - SMTP_USER: email@gmail.com
 * - SMTP_PASS: app password dari Google
 * 
 * Untuk Resend:
 * - RESEND_API_KEY: re_xxxxxxxxxxxx
 */

const getEmailTemplate = (name, resetUrl) => {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - SIVILIZE HUB PRO</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#121826;border-radius:16px;border:1px solid #1e293b;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF7A00,#ff9a3c);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">SIVILIZE HUB PRO</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Platform Teknik Sipil Berbasis AI</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#ffffff;font-size:20px;font-weight:700;">Reset Password Anda</h2>
              <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;line-height:1.6;">Halo <strong style="color:#ffffff;">${name || 'Pengguna'}</strong>,</p>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Kami menerima permintaan untuk mereset password akun SIVILIZE HUB PRO Anda. 
                Klik tombol di bawah untuk membuat password baru.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetUrl}" 
                       style="display:inline-block;background-color:#FF7A00;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                      Reset Password Saya
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <div style="background-color:#1e293b;border-radius:10px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                  ⏰ <strong style="color:#fbbf24;">Link ini berlaku selama 1 jam</strong> sejak email ini dikirim.<br>
                  🔒 Jika Anda tidak meminta reset password, abaikan email ini — akun Anda tetap aman.
                </p>
              </div>
              
              <!-- Fallback URL -->
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                Jika tombol tidak berfungsi, salin dan tempel URL berikut ke browser Anda:<br>
                <a href="${resetUrl}" style="color:#FF7A00;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:20px 32px;border-top:1px solid #1e293b;">
              <p style="margin:0;color:#475569;font-size:12px;text-align:center;line-height:1.6;">
                Email ini dikirim oleh SIVILIZE HUB PRO<br>
                Jangan balas email ini — ini adalah email otomatis.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Kirim email reset password
 * @param {string} to - Alamat email penerima
 * @param {string} name - Nama pengguna
 * @param {string} resetUrl - URL reset password lengkap dengan token
 * @returns {Promise<void>}
 * @throws {Error} Jika pengiriman email gagal
 */
async function sendResetPasswordEmail(to, name, resetUrl) {
  const emailService = process.env.EMAIL_SERVICE || 'nodemailer';
  const emailFrom = process.env.EMAIL_FROM || 'noreply@sivilize.app';
  const subject = 'Reset Password - SIVILIZE HUB PRO';
  const html = getEmailTemplate(name, resetUrl);

  if (emailService === 'resend') {
    // ── Resend API ──────────────────────────────────────────
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY tidak dikonfigurasi');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Resend API error: ${error.message || response.statusText}`);
    }

    console.log(`✅ Email reset password terkirim via Resend ke: ${to}`);

  } else {
    // ── Nodemailer (SMTP) ───────────────────────────────────
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch {
      throw new Error('nodemailer tidak terinstall. Jalankan: npm install nodemailer');
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error('SMTP tidak dikonfigurasi. Set SMTP_HOST, SMTP_USER, SMTP_PASS di environment variables.');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"SIVILIZE HUB PRO" <${emailFrom}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email reset password terkirim via SMTP ke: ${to}`);
  }
}

module.exports = { sendResetPasswordEmail };
