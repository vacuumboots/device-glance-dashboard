import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import path from 'node:path';

export interface SyncProgress {
  stage: 'starting' | 'downloading' | 'processing' | 'complete' | 'error';
  message: string;
  percentage?: number;
}

export class SyncService extends EventEmitter {
  private isRunning = false;
  private currentProcess?: any;

  async startSync(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Sync is already running');
    }

    this.isRunning = true;
    
    try {
      // Check if environment variables are set
      const requiredEnvVars = [
        'AZURE_STORAGE_ACCOUNT_NAME',
        'AZURE_STORAGE_CONTAINER_NAME', 
        'AZURE_STORAGE_KEY'
      ];

      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          throw new Error(`Environment variable ${envVar} is not set`);
        }
      }

      this.emit('progress', {
        stage: 'starting',
        message: 'Starting Azure sync process...',
        percentage: 0
      } as SyncProgress);

      const scriptPath = path.join(process.cwd(), 'sync_inventory.ps1');
      
      // Use PowerShell to run the script
      this.currentProcess = spawn('powershell.exe', [
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath
      ], {
        stdio: 'pipe',
        env: { ...process.env }
      });

      let outputBuffer = '';

      this.currentProcess.stdout.on('data', (data: Buffer) => {
        outputBuffer += data.toString();
        this.processOutput(outputBuffer);
      });

      this.currentProcess.stderr.on('data', (data: Buffer) => {
        const errorMessage = data.toString();
        console.error('PowerShell Error:', errorMessage);
        
        this.emit('progress', {
          stage: 'error',
          message: `Error: ${errorMessage}`,
        } as SyncProgress);
      });

      this.currentProcess.on('close', (code: number) => {
        this.isRunning = false;
        this.currentProcess = undefined;
        
        if (code === 0) {
          this.emit('progress', {
            stage: 'complete',
            message: 'Sync completed successfully',
            percentage: 100
          } as SyncProgress);
        } else {
          this.emit('progress', {
            stage: 'error',
            message: `Sync failed with exit code ${code}`,
          } as SyncProgress);
        }
      });

    } catch (error) {
      this.isRunning = false;
      this.emit('progress', {
        stage: 'error',
        message: `Failed to start sync: ${error instanceof Error ? error.message : 'Unknown error'}`,
      } as SyncProgress);
    }
  }

  private processOutput(output: string): void {
    const lines = output.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Parse different stages based on output
      if (trimmedLine.includes('Downloading inventory files')) {
        this.emit('progress', {
          stage: 'downloading',
          message: 'Downloading files from Azure...',
          percentage: 25
        } as SyncProgress);
      } else if (trimmedLine.includes('Processing unique files')) {
        this.emit('progress', {
          stage: 'processing',
          message: 'Processing unique files...',
          percentage: 75
        } as SyncProgress);
      } else if (trimmedLine.includes('Sync complete')) {
        this.emit('progress', {
          stage: 'complete',
          message: 'Sync completed successfully',
          percentage: 100
        } as SyncProgress);
      }
    }
  }

  stopSync(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = undefined;
    }
    this.isRunning = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}