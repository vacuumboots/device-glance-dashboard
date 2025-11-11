import { app, safeStorage } from 'electron';
import logger from '@/core/logging/logger';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface AzureCredentials {
  accountName: string;
  containerName: string;
  accessKey: string;
}

export class CredentialsService {
  private credentialsPath: string;

  constructor() {
    this.credentialsPath = path.join(app.getPath('userData'), 'credentials.json');
  }

  async saveCredentials(credentials: AzureCredentials): Promise<void> {
    const credentialsJson = JSON.stringify(credentials);
    const encryptedCredentials = safeStorage.encryptString(credentialsJson);
    await fs.writeFile(this.credentialsPath, encryptedCredentials);
  }

  async getCredentials(): Promise<AzureCredentials | null> {
    try {
      const encryptedCredentials = await fs.readFile(this.credentialsPath);
      const decryptedCredentials = safeStorage.decryptString(encryptedCredentials);
      return JSON.parse(decryptedCredentials);
    } catch (error) {
      // It's likely the file doesn't exist, which is fine.
      // Log other errors for debugging.
      const err = error as NodeJS.ErrnoException;
      if (err && err.code && err.code !== 'ENOENT') {
        logger.error('Failed to read or decrypt credentials', { err });
      }
      return null;
    }
  }

  async hasCredentials(): Promise<boolean> {
    try {
      await fs.access(this.credentialsPath);
      return true;
    } catch {
      return false;
    }
  }
}
