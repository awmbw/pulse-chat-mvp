/**
 * Web Crypto API Utility
 * This handles all mathematically complex Cryptography (Asymmetric ECDH + Symmetric AES-GCM)
 */

// 1. Generate Public/Private Key Pair (ECDH)
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // Extractable (so we can save private key to localStorage)
    ["deriveKey", "deriveBits"]
  );
}

// 2. Export Keys to Strings (To send over network / save to localStorage)
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// 3. Import Keys from Strings
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return window.crypto.subtle.importKey(
    "spki", bytes.buffer, { name: "ECDH", namedCurve: "P-256" }, true, []
  );
}

export async function importPrivateKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return window.crypto.subtle.importKey(
    "pkcs8", bytes.buffer, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]
  );
}

// 4. Derive Shared Secret from My Private + Their Public Key
export async function deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false, // Non-extractable for max security
    ["encrypt", "decrypt"]
  );
}

// 5. Encrypt Text (AES-GCM)
export async function encryptText(text: string, sharedSecret: CryptoKey): Promise<{ cipherText: string, iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, sharedSecret, encodedText
  );

  return { 
    cipherText: btoa(String.fromCharCode(...new Uint8Array(encryptedBuf))), 
    iv: btoa(String.fromCharCode(...iv)) 
  };
}

// 6. Decrypt Text (AES-GCM)
export async function decryptText(cipherText: string, ivBase64: string, sharedSecret: CryptoKey): Promise<string> {
  const ivBinary = atob(ivBase64);
  const iv = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) iv[i] = ivBinary.charCodeAt(i);

  const cipherBinary = atob(cipherText);
  const cipherBytes = new Uint8Array(cipherBinary.length);
  for (let i = 0; i < cipherBinary.length; i++) cipherBytes[i] = cipherBinary.charCodeAt(i);

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, sharedSecret, cipherBytes.buffer
  );

  return new TextDecoder().decode(decryptedBuf);
}

// 7. Generate Temp AES Key (For Files)
export async function generateFileKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
}

export async function exportFileKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importFileKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return window.crypto.subtle.importKey(
    "raw", bytes.buffer, "AES-GCM", true, ["encrypt", "decrypt"]
  );
}

// 8. Encrypt File ArrayBuffer
export async function encryptFile(buffer: ArrayBuffer, fileKey: CryptoKey): Promise<{ encryptedBlob: Blob, iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuf = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, fileKey, buffer);
  return { encryptedBlob: new Blob([encryptedBuf]), iv: btoa(String.fromCharCode(...iv)) };
}

// 9. Decrypt File ArrayBuffer
export async function decryptFile(encryptedBuffer: ArrayBuffer, ivBase64: string, fileKey: CryptoKey): Promise<Blob> {
  const ivBinary = atob(ivBase64);
  const iv = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) iv[i] = ivBinary.charCodeAt(i);
  const decryptedBuf = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, fileKey, encryptedBuffer);
  return new Blob([decryptedBuf]);
}
