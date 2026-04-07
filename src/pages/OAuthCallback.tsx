import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your connection...');
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authorization denied: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code or state');
        return;
      }

      try {
        // Decode state to get platform
        const stateData = JSON.parse(atob(state));
        setPlatform(stateData.platform);

        // Exchange code for tokens
        const redirectUri = `${window.location.origin}/oauth/callback`;
        
        const { data, error: callbackError } = await supabase.functions.invoke('oauth-callback', {
          body: {
            action: 'callback',
            code,
            state,
            redirectUri,
          },
        });

        if (callbackError || !data?.success) {
          throw new Error(data?.error || callbackError?.message || 'Connection failed');
        }

        setStatus('success');
        setMessage(`Successfully connected to ${data.platform}${data.accountName ? ` as ${data.accountName}` : ''}!`);

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/onboarding', { state: { platformConnected: data.platform } });
        }, 2000);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Failed to complete connection');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connected!</h2>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting you back...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/onboarding')}>
                  Back to Onboarding
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
