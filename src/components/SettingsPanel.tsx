import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Eye, EyeOff, Save, AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AzureCredentials } from '@/types/electron';

export function SettingsPanel() {
  const [credentials, setCredentials] = useState<AzureCredentials>({
    accountName: '',
    containerName: '',
    accessKey: '',
  });
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    if (!window.electronAPI) return;

    try {
      const stored = await window.electronAPI.getAzureCredentials();
      if (stored) {
        setCredentials(stored);
      }
    } catch {
      // Failed to load credentials, will use defaults
    }
  };

  const handleSave = async () => {
    if (!window.electronAPI) {
      setMessage({ type: 'error', text: 'Settings are only available in the desktop app' });
      return;
    }

    if (!credentials.accountName || !credentials.containerName || !credentials.accessKey) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await window.electronAPI.saveAzureCredentials(credentials);
      setMessage({ type: 'success', text: 'Azure credentials saved successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save credentials' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof AzureCredentials, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
    setMessage(null);
  };

  if (!window.electronAPI) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Azure Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Settings are only available in the desktop app. Please use the desktop version to
              configure Azure credentials.
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
          <Settings className="w-5 h-5" />
          Azure Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountName">Storage Account Name</Label>
          <Input
            id="accountName"
            type="text"
            placeholder="Enter Azure Storage Account Name"
            value={credentials.accountName}
            onChange={(e) => handleInputChange('accountName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="containerName">Container Name</Label>
          <Input
            id="containerName"
            type="text"
            placeholder="Enter Container Name"
            value={credentials.containerName}
            onChange={(e) => handleInputChange('containerName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessKey">Access Key</Label>
          <div className="relative">
            <Input
              id="accessKey"
              type={showAccessKey ? 'text' : 'password'}
              placeholder="Enter Azure Storage Access Key"
              value={credentials.accessKey}
              onChange={(e) => handleInputChange('accessKey', e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowAccessKey(!showAccessKey)}
            >
              {showAccessKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Credentials'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          data-testid="open-logs-folder"
          onClick={async () => {
            if (!window.electronAPI) {
              setMessage({ type: 'error', text: 'Logs are only available in the desktop app' });
              return;
            }
            try {
              const res = await window.electronAPI.openLogsFolder();
              if (res?.success) {
                setMessage({ type: 'success', text: 'Opened logs folder' });
              } else {
                setMessage({ type: 'error', text: res?.error || 'Failed to open logs folder' });
              }
            } catch (e) {
              setMessage({ type: 'error', text: 'Failed to open logs folder' });
            }
          }}
        >
          <FolderOpen className="w-4 h-4 mr-2" /> Open Logs Folder
        </Button>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            Your Azure credentials are stored securely on your device and are not transmitted
            anywhere except to Azure for authentication.
          </p>
          <p className="mt-1">
            Logs are written to your application data directory. Use "Open Logs Folder" to view
            recent logs.
          </p>
          <p className="mt-1">
            <strong>Required:</strong> Storage Account Name, Container Name, and Access Key from
            your Azure Storage account.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
