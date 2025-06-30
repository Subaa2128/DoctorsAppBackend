import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here-123';
const ivLength = 16;

// Ensure the key is exactly 32 bytes (256 bits) for AES-256
const getKey = (): Buffer => {
  return crypto.scryptSync(secretKey, 'salt', 32);
};

export const encryptText = (text: string): string => {
  try {
    const iv = crypto.randomBytes(ivLength);
    const key = getKey();
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt text');
  }
};

export const decryptText = (encryptedText: string): string => {
  try {
    if (!encryptedText || !encryptedText.includes(':')) {
      throw new Error('Invalid encrypted text format');
    }
    
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = getKey();
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt text');
  }
};
