"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptText = exports.encryptText = void 0;
const crypto_1 = __importDefault(require("crypto"));
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here-123';
const ivLength = 16;
// Ensure the key is exactly 32 bytes (256 bits) for AES-256
const getKey = () => {
    return crypto_1.default.scryptSync(secretKey, 'salt', 32);
};
const encryptText = (text) => {
    try {
        const iv = crypto_1.default.randomBytes(ivLength);
        const key = getKey();
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt text');
    }
};
exports.encryptText = encryptText;
const decryptText = (encryptedText) => {
    try {
        if (!encryptedText || !encryptedText.includes(':')) {
            throw new Error('Invalid encrypted text format');
        }
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = getKey();
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt text');
    }
};
exports.decryptText = decryptText;
