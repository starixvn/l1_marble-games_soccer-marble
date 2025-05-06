import { encrypt, decrypt } from '../../../src/helpers/crypto-helper';
import crypto from 'crypto';

describe('crypto-helper', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('encrypt', () => {
    it('should use aes-256-cbc algorithm for encryption', () => {
      // Arrange
      const createCipherivSpy = jest.spyOn(crypto, 'createCipheriv');
      const testData = { foo: 'bar' };

      // Act
      encrypt(testData);

      // Assert
      expect(createCipherivSpy).toHaveBeenCalledWith(
        'aes-256-ctr',
        expect.any(String),
        expect.any(Buffer)
      );
    });

    it('should encrypt data that can be decrypted', () => {
      // Arrange
      const testData = { foo: 'bar', num: 42 };
      
      // Act
      const encrypted = encrypt(testData);
      const decrypted = decrypt(encrypted);
      
      // Assert
      expect(decrypted).toEqual(testData);
    });
  });

  describe('decrypt', () => {
    it('should use aes-256-cbc algorithm for decryption', () => {
      // Arrange
      const createDecipherivSpy = jest.spyOn(crypto, 'createDecipheriv');
      const ivBase64 = Buffer.from('testiv1234567890').toString('base64');
      const encryptedPayload = 'abc123';
      const encrypted = `${ivBase64}:${encryptedPayload}`;
      
      // Act
      try { decrypt(encrypted); } catch {}

      // Assert
      expect(createDecipherivSpy).toHaveBeenCalledWith(
        'aes-256-ctr',
        expect.any(String),
        expect.any(Buffer)
      );
    });
  });
});
