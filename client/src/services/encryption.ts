export async function generateEncryptionKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const exportedKeyBuffer = new Uint8Array(exported);
  const base64Str = btoa(String.fromCharCode(...exportedKeyBuffer));
  return base64Str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function importKey(keyStr: string): Promise<CryptoKey> {
  let base64Str = keyStr.replace(/-/g, '+').replace(/_/g, '/');
  while (base64Str.length % 4) {
    base64Str += '=';
  }
  const binaryDerString = atob(base64Str);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return window.crypto.subtle.importKey(
    'raw',
    binaryDer,
    {
      name: 'AES-GCM',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptChunk(data: ArrayBuffer, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    data
  );
  return { ciphertext, iv };
}

export async function decryptChunk(ciphertext: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
  return window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    ciphertext
  );
}

export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hash = await window.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
