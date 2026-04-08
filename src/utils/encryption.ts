/**
 * AES-256-GCM Encryption Utility
 * 
 * Alur:
 * 1. Key derivasi dari userId + secret menggunakan PBKDF2 (browser native)
 * 2. Enkripsi data dengan AES-256-GCM (authenticated encryption)
 * 3. Output: base64(iv + authTag + ciphertext)
 * 
 * Risiko:
 * - Key disimpan di memory saja, tidak di localStorage (aman)
 * - Jika userId berubah, data lama tidak bisa didekripsi
 * - Browser lama (IE) tidak support SubtleCrypto — sudah tidak relevan
 */

const SALT = 'sivilize-hub-pro-v1'; // static salt, bisa diganti per-user

async function deriveKey(userId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(userId + SALT),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: unknown, userId: string): Promise<string> {
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV untuk GCM
  const enc = new TextEncoder();
  const encoded = enc.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Gabungkan iv + ciphertext → base64
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData<T>(encrypted: string, userId: string): Promise<T> {
  const key = await deriveKey(userId);
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted)) as T;
}

/**
 * Enkripsi field sensitif proyek (RAB items + financial summary)
 * Field non-sensitif (name, location, status) tetap plaintext untuk query
 */
export async function encryptProjectSensitiveData(
  project: { versions: unknown[]; [key: string]: unknown },
  userId: string
): Promise<{ versions: string; [key: string]: unknown }> {
  const encrypted = await encryptData(project.versions, userId);
  return {
    ...project,
    versions: encrypted,        // encrypted string
    _encrypted: true,           // flag
  };
}

export async function decryptProjectSensitiveData(
  project: { versions: string | unknown[]; _encrypted?: boolean; [key: string]: unknown },
  userId: string
): Promise<{ versions: unknown[]; [key: string]: unknown }> {
  if (!project._encrypted || typeof project.versions !== 'string') {
    return project as { versions: unknown[]; [key: string]: unknown };
  }
  const versions = await decryptData<unknown[]>(project.versions, userId);
  return { ...project, versions, _encrypted: false };
}
