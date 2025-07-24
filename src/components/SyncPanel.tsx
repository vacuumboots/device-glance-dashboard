import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SyncProgress } from '@/types/electron';

export function SyncPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electronAPI) {
      setError('This feature is only available in the desktop app');
      return;
    }

    const checkStatus = async () => {
      try {
        const status = await window.electronAPI.getSyncStatus();
        setIsRunning(status.isRunning);
      } catch (err) {
        console.error('Failed to get sync status:', err);
      }
    };

    checkStatus();

    const handleProgress = (event: unknown, progressData: SyncProgress) => {
      setProgress(progressData);
      setIsRunning(
        progressData.stage !== 'complete' &&
          progressData.stage !== 'error' &&
          progressData.stage !== 'cancelled'
      );

      if (progressData.stage === 'error') {
        setError(progressData.message);
      } else {
        setError(null);
      }
    };

    window.electronAPI.onSyncProgress(handleProgress);

    return () => {
      window.electronAPI.removeAllListeners('sync-progress');
    };
  }, []);

  const handleStartSync = async () => {
    try {
      setError(null);
      setProgress(null);
      const result = await window.electronAPI.startSync();

      if (!result.success) {
        setError(result.error || 'Failed to start sync');
        return;
      }

      setIsRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sync');
    }
  };

  const handleStopSync = async () => {
    try {
      await window.electronAPI.stopSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop sync');
    }
  };

  const getStageIcon = (stage: SyncProgress['stage']) => {
    switch (stage) {
      case 'starting':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'downloading':
        return <Download className="w-4 h-4" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (!window.electronAPI) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Azure Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Azure Sync is only available in the desktop app. Please use the desktop version to
              sync inventory data from Azure Storage.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Azure Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleStartSync}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isRunning ? 'Syncing...' : 'Start Sync'}
          </Button>

          {isRunning && (
            <Button
              onClick={handleStopSync}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          )}
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStageIcon(progress.stage)}
              <span className="text-sm text-muted-foreground">{progress.message}</span>
            </div>

            {progress.percentage !== undefined && (
              <Progress value={progress.percentage} className="w-full" />
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            This will download the latest device inventory from Azure Storage and process unique
            device files.
          </p>
          <p className="mt-1">
            <strong>Note:</strong> Make sure Azure credentials are configured in Settings panel
            above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
