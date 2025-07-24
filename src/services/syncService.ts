import { EventEmitter } from 'node:events';
import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { CredentialsService } from './credentialsService.js';

export interface SyncProgress {
  stage: 'starting' | 'downloading' | 'processing' | 'complete' | 'error' | 'cancelled';
  message: string;
  percentage?: number;
}

// Helper function to convert a readable stream to a buffer
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data: Buffer | string) => {
        chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

export class SyncService extends EventEmitter {
  private isRunning = false;
  private credentialsService: CredentialsService;
  private abortController: AbortController | null = null;

  constructor() {
    super();
    this.credentialsService = new CredentialsService();
  }

  async startSync(): Promise<void> {
    if (this.isRunning) {
      this.emit('progress', {
        stage: 'error',
        message: 'Sync is already in progress.',
      } as SyncProgress);
      return;
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    this.emit('progress', { stage: 'starting', message: 'Starting sync...', percentage: 0 } as SyncProgress);

    try {
      const credentials = await this.credentialsService.getCredentials();
      if (!credentials?.accountName || !credentials?.containerName || !credentials?.accessKey) {
        throw new Error('Azure credentials not configured. Please configure them in Settings.');
      }

      const sharedKeyCredential = new StorageSharedKeyCredential(
        credentials.accountName,
        credentials.accessKey
      );
      const blobServiceClient = new BlobServiceClient(
        `https://${credentials.accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
      const containerClient = blobServiceClient.getContainerClient(credentials.containerName);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const downloadPath = path.join(app.getPath('userData'), 'data', 'downloads', timestamp);
      await fs.mkdir(downloadPath, { recursive: true });

      this.emit('progress', {
        stage: 'downloading',
        message: 'Listing inventory files...',
        percentage: 5,
      } as SyncProgress);

      const blobs = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        blobs.push(blob.name);
      }

      let downloadedCount = 0;
      for (const blobName of blobs) {
        if (this.abortController.signal.aborted) {
          throw new Error('Sync cancelled by user.');
        }
        const blobClient = containerClient.getBlobClient(blobName);
        const downloadResponse = await blobClient.download(0, undefined, {
            abortSignal: this.abortController.signal,
        });

        if (!downloadResponse.readableStreamBody) {
            throw new Error(`Failed to download blob ${blobName}: No readable stream.`);
        }

        const downloadedData = await streamToBuffer(downloadResponse.readableStreamBody);
        const filePath = path.join(downloadPath, blobName);
        await fs.writeFile(filePath, downloadedData);
        downloadedCount++;
        this.emit('progress', {
          stage: 'downloading',
          message: `Downloading file ${downloadedCount} of ${blobs.length}...`,
          percentage: 5 + Math.round((downloadedCount / blobs.length) * 55),
        } as SyncProgress);
      }

      this.emit('progress', {
        stage: 'processing',
        message: 'Processing unique files...',
        percentage: 60,
      } as SyncProgress);

      const uniquePath = path.join(app.getPath('userData'), 'data', 'unique', timestamp);
      await fs.mkdir(uniquePath, { recursive: true });

      const files = await fs.readdir(downloadPath);
      const deviceFiles: { [key: string]: string[] } = {};

      for (const file of files) {
        if (path.extname(file) === '.json') {
          const deviceId = file.split('_')[0];
          if (!deviceFiles[deviceId]) {
            deviceFiles[deviceId] = [];
          }
          deviceFiles[deviceId].push(file);
        }
      }

      let processedCount = 0;
      const deviceIds = Object.keys(deviceFiles);
      for (const deviceId of deviceIds) {
        if (this.abortController.signal.aborted) {
            throw new Error('Sync cancelled by user.');
        }
        const deviceSpecificFiles = deviceFiles[deviceId].sort().reverse();
        const latestFile = deviceSpecificFiles[0];
        const sourcePath = path.join(downloadPath, latestFile);
        const destPath = path.join(uniquePath, latestFile);
        await fs.copyFile(sourcePath, destPath);
        processedCount++;
        this.emit('progress', {
            stage: 'processing',
            message: `Processing device ${processedCount} of ${deviceIds.length}...`,
            percentage: 60 + Math.round((processedCount / deviceIds.length) * 35),
          } as SyncProgress);
      }

      const uniqueBaseDir = path.join(app.getPath('userData'), 'data', 'unique');
      const dateFolders = await fs.readdir(uniqueBaseDir);
      const indexFile = path.join(uniqueBaseDir, 'index.json');
      await fs.writeFile(indexFile, JSON.stringify(dateFolders.sort().reverse()));

      this.emit('progress', {
        stage: 'complete',
        message: 'Sync completed successfully.',
        percentage: 100,
      } as SyncProgress);
    } catch (error) {
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('Sync cancelled'))) {
            this.emit('progress', {
              stage: 'cancelled',
              message: 'Sync was cancelled.',
            } as SyncProgress);
          } else {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            this.emit('progress', {
              stage: 'error',
              message: `Sync failed: ${errorMessage}`,
            } as SyncProgress);
          }
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  stopSync(): void {
    if (this.isRunning && this.abortController) {
      this.abortController.abort();
      console.log('Sync cancellation requested.');
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}