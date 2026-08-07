import { describe, it, expect } from 'vitest';
import { generateEncryptionKey, exportKey, importKey, encryptChunk, decryptChunk } from '../../services/encryption';

describe('Encryption Service', () => {
  it('generates a key', async () => {
    const key = await generateEncryptionKey();
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
  });

  it('exports and imports a key', async () => {
    const key = await generateEncryptionKey();
    const exported = await exportKey(key);
    expect(typeof exported).toBe('string');
    expect(exported.length).toBeGreaterThan(0);
    
    const imported = await importKey(exported);
    expect(imported).toBeDefined();
    expect(imported.type).toBe('secret');
  });

  it('encrypts and decrypts data correctly', async () => {
    const key = await generateEncryptionKey();
    const originalData = new TextEncoder().encode('Hello FlashShare!');
    
    const { ciphertext, iv } = await encryptChunk(originalData.buffer as ArrayBuffer, key);
    expect(ciphertext).toBeDefined();
    expect(ciphertext.byteLength).toBeGreaterThan(originalData.byteLength);
    
    const decrypted = await decryptChunk(ciphertext, key, iv);
    const decryptedText = new TextDecoder().decode(decrypted);
    expect(decryptedText).toBe('Hello FlashShare!');
  });

  it('fails decryption with wrong key', async () => {
    const key1 = await generateEncryptionKey();
    const key2 = await generateEncryptionKey();
    const data = new TextEncoder().encode('Secret data');
    
    const { ciphertext, iv } = await encryptChunk(data.buffer as ArrayBuffer, key1);
    
    await expect(decryptChunk(ciphertext, key2, iv)).rejects.toThrow();
  });
});
