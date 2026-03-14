import { describe, it, expect, beforeEach } from 'bun:test';
import { encrypt, decrypt } from '../utils/encryption';

describe('Encryption Utility', () => {
  const password = 'test-password-123';
  const plaintext = 'sensitive-data-here';

  it('should encrypt data correctly', () => {
    const encrypted = encrypt(plaintext, password);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(':');
  });

  it('should decrypt data correctly', () => {
    const encrypted = encrypt(plaintext, password);
    const decrypted = decrypt(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for same plaintext (due to random salt/iv)', () => {
    const encrypted1 = encrypt(plaintext, password);
    const encrypted2 = encrypt(plaintext, password);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should fail to decrypt with wrong password', () => {
    const encrypted = encrypt(plaintext, password);
    expect(() => decrypt(encrypted, 'wrong-password')).toThrow();
  });

  it('should fail with invalid encrypted text format', () => {
    expect(() => decrypt('invalid-data', password)).toThrow();
  });
});
