import { app } from 'electron';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface AzureCredentials {
  accountName: string;
  containerName: string;
  accessKey: string;
}

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class CredentialsService {
  private credentialsPath: string;
  private keyPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.credentialsPath = join(userDataPath, 'credentials.enc');
    this.keyPath = join(userDataPath, 'key.enc');
  }

  private async getOrCreateKey(): Promise<Buffer> {
    try {
      const keyData = await readFile(this.keyPath);
      return keyData;
    } catch {
      const key = randomBytes(KEY_LENGTH);
      await mkdir(join(this.keyPath, '..'), { recursive: true });
      await writeFile(this.keyPath, key);
      return key;
    }
  }

  private async encrypt(data: string): Promise<Buffer> {
    const key = await this.getOrCreateKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]);
  }

  private async decrypt(encryptedData: Buffer): Promise<string> {
    const key = await this.getOrCreateKey();
    const iv = encryptedData.slice(0, IV_LENGTH);
    const tag = encryptedData.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = encryptedData.slice(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  async saveCredentials(credentials: AzureCredentials): Promise<void> {
    const credentialsJson = JSON.stringify(credentials);
    const encryptedData = await this.encrypt(credentialsJson);
    await writeFile(this.credentialsPath, encryptedData);
  }

  async getCredentials(): Promise<AzureCredentials | null> {
    try {
      const encryptedData = await readFile(this.credentialsPath);
      const decryptedJson = await this.decrypt(encryptedData);
      return JSON.parse(decryptedJson);
    } catch {
      return null;
    }
  }

  async hasCredentials(): Promise<boolean> {
    try {
      await readFile(this.credentialsPath);
      return true;
    } catch {
      return false;
    }
  }
}
