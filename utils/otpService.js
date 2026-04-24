/**
 * OTP Service — Generate, simpan, verifikasi, dan kirim OTP
 * Email wajib dari: sivilize-hub-pro@sivilize-corp.com (Sivilize Corp)
 * PENTING: Domain sivilize-corp.com harus diverifikasi di Resend dashboard
 * https://resend.com/domains
 */

const crypto = require('crypto');

// In-memory OTP store
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 menit
const MAX_ATTEMPTS  = 5;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function storeOTP(email, otp) {
  otpStore.set(email.toLowerCase(), {
    hashedOtp: hashOTP(otp),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });
}

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
    return { valid: false, reason: 'OTP salah. Sisa percobaan: ' + remaining };
  }

  otpStore.delete(email.toLowerCase());
  return { valid: true, reason: 'OK' };
}

async function sendOTPEmail(email, otp, purpose) {
  purpose = purpose || 'login';

  const apiKey   = process.env.RESEND_API_KEY;
  // Pakai onboarding@resend.dev (sudah verified) dengan nama "Sivilize Corp"
  // Ganti ke sivilize-hub-pro@sivilize-corp.com setelah domain diverifikasi
  const FROM     = 'Sivilize Corp <onboarding@resend.dev>';
  const label    = purpose === 'register' ? 'Verifikasi Pendaftaran' : 'Verifikasi Login';
  const desc     = purpose === 'register'
    ? 'Anda baru saja mendaftar di Sivilize Hub Pro.'
    : 'Anda mencoba masuk ke Sivilize Hub Pro.';

  // Logo SVG inline — gedung sipil orange di background biru (logo Sivilize Corp)
  const logoSvg = '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<circle cx="32" cy="32" r="32" fill="#1a3a6b"/>'
    + '<g stroke="#FF7A00" stroke-linecap="round" stroke-linejoin="round">'
    + '<rect x="16" y="44" width="32" height="12" stroke-width="2" fill="none"/>'
    + '<rect x="18" y="24" width="28" height="20" stroke-width="2" fill="none"/>'
    + '<polygon points="18,24 32,8 46,24" stroke-width="2" fill="none"/>'
    + '<rect x="22" y="28" width="4" height="4" stroke-width="1.5" fill="none"/>'
    + '<rect x="22" y="36" width="4" height="4" stroke-width="1.5" fill="none"/>'
    + '<rect x="38" y="28" width="4" height="4" stroke-width="1.5" fill="none"/>'
    + '<rect x="38" y="36" width="4" height="4" stroke-width="1.5" fill="none"/>'
    + '<rect x="30" y="38" width="4" height="6" stroke-width="1.5" fill="none"/>'
    + '</g></svg>';

  const html = '<div style="font-family:\'Segoe UI\',sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#fff;padding:40px 32px;border-radius:16px;border:1px solid #1e293b;">'
    + '<div style="text-align:center;margin-bottom:32px;">'
    + '<div style="display:inline-flex;align-items:center;gap:14px;">'
    + logoSvg
    + '<div style="text-align:left;">'
    + '<p style="margin:0;color:#fff;font-weight:900;font-size:20px;font-style:italic;letter-spacing:-0.5px;">SIVILIZE HUB</p>'
    + '<p style="margin:0;color:#FF7A00;font-weight:700;font-size:10px;letter-spacing:3px;text-transform:uppercase;">PRO EDITION</p>'
    + '<p style="margin:2px 0 0;color:#64748b;font-size:10px;">by Sivilize Corp</p>'
    + '</div></div></div>'
    + '<h2 style="text-align:center;margin:0 0 8px;font-size:22px;font-weight:700;">' + label + '</h2>'
    + '<p style="text-align:center;color:#94a3b8;margin:0 0 32px;font-size:14px;">' + desc + '</p>'
    + '<div style="background:#121826;border:2px solid #FF7A00;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">'
    + '<p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Kode OTP Anda</p>'
    + '<p style="margin:0;font-size:48px;font-weight:900;letter-spacing:14px;color:#FF7A00;font-family:monospace;">' + otp + '</p>'
    + '<p style="margin:12px 0 0;color:#64748b;font-size:12px;">Berlaku selama <strong style="color:#fff;">5 menit</strong></p>'
    + '</div>'
    + '<div style="background:#1a1a0a;border:1px solid #854d0e;border-radius:8px;padding:12px 16px;margin-bottom:24px;">'
    + '<p style="margin:0;color:#fbbf24;font-size:12px;"><strong>Jangan bagikan kode ini</strong> kepada siapapun. Sivilize Corp tidak pernah meminta kode OTP Anda.</p>'
    + '</div>'
    + '<div style="border-top:1px solid #1e293b;margin:24px 0;"></div>'
    + '<p style="text-align:center;color:#475569;font-size:12px;margin:0;">'
    + 'Jika Anda tidak melakukan ini, abaikan email ini.<br>'
    + 'Dikirim oleh <strong style="color:#FF7A00;">Sivilize Corp</strong><br>'
    + '&copy; 2026 Sivilize Corp. All rights reserved.'
    + '</p></div>';

  if (!apiKey) {
    console.log('[DEV] OTP untuk ' + email + ': ' + otp);
    return { success: true, dev: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: '[Sivilize Corp] Kode OTP ' + label + ': ' + otp,
      html: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Resend API error: ' + res.status);
  }

  console.log('OTP terkirim ke ' + email);
  return { success: true };
}

module.exports = { generateOTP, storeOTP, verifyOTP, sendOTPEmail };
