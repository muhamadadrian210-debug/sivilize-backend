/**
 * OTP Service â€” Generate, simpan, verifikasi, dan kirim OTP
 * Pakai Resend API dengan nama pengirim "Sivilize Corp"
 */

const crypto = require('crypto');

// In-memory OTP store (cukup untuk serverless, expire otomatis)
// Format: { email: { otp, hashedOtp, expiresAt, attempts } }
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000;  // 5 menit
const MAX_ATTEMPTS  = 5;               // Maks salah 5x

/**
 * Generate OTP 6 digit
 */
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Hash OTP sebelum disimpan (keamanan)
 */
function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Simpan OTP ke store
 */
function storeOTP(email, otp) {
  otpStore.set(email.toLowerCase(), {
    hashedOtp: hashOTP(otp),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });
}

/**
 * Verifikasi OTP
 * Return: { valid: bool, reason: string }
 */
function verifyOTP(email, inputOtp) {
  const record = otpStore.get(email.toLowerCase());

  if (!record) {
    return { valid: false, reason: 'OTP tidak ditemukan atau sudah kedaluwarsa' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: 'OTP sudah kedaluwarsa. Minta OTP baru.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: 'Terlalu banyak percobaan. Minta OTP baru.' };
  }

  if (hashOTP(inputOtp) !== record.hashedOtp) {
    record.attempts++;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return { valid: false, reason: `OTP salah. Sisa percobaan: ${remaining}` };
  }

  // OTP valid â€” hapus dari store
  otpStore.delete(email.toLowerCase());
  return { valid: true, reason: 'OK' };
}

/**
 * Kirim OTP via Resend API
 * Pengirim: "Sivilize Corp <noreply@sivilize-corp.com>"
 */
async function sendOTPEmail(email, otp, purpose = 'login') {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = 'sivilize-hub-pro@sivilize-corp.com';
  const fromName  = 'Sivilize Corp';

  const purposeLabel = purpose === 'register' ? 'Verifikasi Pendaftaran' : 'Verifikasi Login';
  const purposeDesc  = purpose === 'register'
    ? 'Anda baru saja mendaftar di Sivilize Hub Pro.'
    : 'Anda mencoba masuk ke Sivilize Hub Pro.';

  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#fff;padding:40px 32px;border-radius:16px;border:1px solid #1e293b;">
      
      <!-- Logo â€” sama persis dengan di web -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;align-items:center;gap:12px;">
          <div style="background:#FF7A00;width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(255,122,0,0.4);">
            <span style="color:#fff;font-size:26px;font-weight:900;font-family:'Segoe UI',sans-serif;">S</span>
          </div>
          <div style="text-align:left;">
            <p style="margin:0;color:#fff;font-weight:900;font-size:18px;font-style:italic;letter-spacing:-0.5px;">SIVILIZE HUB</p>
            <p style="margin:0;color:#FF7A00;font-weight:700;font-size:10px;letter-spacing:3px;text-transform:uppercase;">PRO EDITION</p>
          </div>
        </div>
      </div>

      <!-- Title -->
      <h2 style="text-align:center;margin:0 0 8px;font-size:22px;font-weight:700;">${purposeLabel}</h2>
      <p style="text-align:center;color:#94a3b8;margin:0 0 32px;font-size:14px;">${purposeDesc}</p>

      <!-- OTP Box -->
      <div style="background:#121826;border:2px solid #FF7A00;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Kode OTP Anda</p>
        <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:14px;color:#FF7A00;font-family:monospace;">${otp}</p>
        <p style="margin:12px 0 0;color:#64748b;font-size:12px;">Berlaku selama <strong style="color:#fff;">5 menit</strong></p>
      </div>

      <!-- Warning -->
      <div style="background:#1a1a0a;border:1px solid #854d0e;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;color:#fbbf24;font-size:12px;">
          âš ï¸ <strong>Jangan bagikan kode ini</strong> kepada siapapun, termasuk tim Sivilize Corp. Kami tidak pernah meminta kode OTP Anda.
        </p>
      </div>

      <!-- Divider -->
      <div style="border-top:1px solid #1e293b;margin:24px 0;"></div>

      <!-- Footer -->
      <p style="text-align:center;color:#475569;font-size:12px;margin:0;">
        Jika Anda tidak melakukan ini, abaikan email ini.<br>
        Dikirim oleh <strong style="color:#FF7A00;">Sivilize Corp</strong> &bull; sivilize-hub-pro@sivilize-corp.com<br>
        &copy; 2026 Sivilize Corp. All rights reserved.
      </p>
    </div>
  `;

  if (!apiKey) {
    // Dev mode: log OTP ke console
    console.log(`ðŸ“§ [DEV] OTP untuk ${email}: ${otp}`);
    return { success: true, dev: true };
  }

  // Gunakan domain yang sudah diverifikasi di Resend
  // Jika domain custom belum verified, fallback ke onboarding@resend.dev
  const verifiedFrom = process.env.RESEND_FROM_VERIFIED === 'true'
    ? `${fromName} <${fromEmail}>`
    : `${fromName} <onboarding@resend.dev>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: verifiedFrom,
        to: [email],
        subject: `[Sivilize Corp] Kode OTP ${purposeLabel}: ${otp}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Resend API error');
    }

    console.log(`âœ… OTP terkirim ke ${email}`);
    return { success: true };
  } catch (err) {
    console.error('âŒ Gagal kirim OTP:', err.message);
    throw err;
  }
}

module.exports = { generateOTP, storeOTP, verifyOTP, sendOTPEmail };
