import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Instagram, Facebook, Linkedin, Twitter, CheckCircle, XCircle, Loader2, ExternalLink, Unlink } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const platformMeta: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-400' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-blue-400' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-sky-400' },
  twitter: { icon: Twitter, label: 'X / Twitter', color: 'text-slate-300' },
  tiktok: { icon: Users, label: 'TikTok', color: 'text-purple-400' },
};

export default function Accounts() {
  const [connections, setConnections] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchConnections = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: business } = await supabase
        .from('businesses').select('id').eq('user_id', session.user.id).limit(1).single();
      if (!business) { navigate('/onboarding'); return; }

      setBusinessId(business.id);
      const { data } = await supabase
        .from('social_connections').select('*').eq('business_id', business.id);
      setConnections(data || []);
      setIsLoading(false);
    };
    fetchConnections();
  }, [navigate]);

  const handleConnect = async (platform: string) => {
    if (!businessId) return;
    setConnecting(platform);
    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/oauth-callback?action=authorize`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ platform, businessId, redirectUri }),
      });

      const result = await response.json();

      if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || `Could not initiate ${platform} connection. Make sure OAuth credentials are configured.`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: `Failed to connect ${platform}`,
        variant: 'destructive',
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!businessId) return;
    const { error } = await supabase
      .from('social_connections')
      .update({ is_connected: false, access_token: null, refresh_token: null })
      .eq('business_id', businessId)
      .eq('platform', platform as any);

    if (error) {
      toast({ title: 'Error', description: 'Failed to disconnect', variant: 'destructive' });
    } else {
      setConnections(prev => prev.map(c => c.platform === platform ? { ...c, is_connected: false } : c));
      toast({ title: 'Disconnected', description: `${platform} has been disconnected` });
    }
  };

  const allPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <DashboardHeader 
            title="Connected Accounts"
            subtitle="Manage your social media connections"
            icon={<Users className="w-6 h-6 text-primary" />}
          />

          <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allPlatforms.map((platform) => {
              const meta = platformMeta[platform];
              const connection = connections.find(c => c.platform === platform);
              const isConnected = connection?.is_connected;
              const Icon = meta.icon;

              return (
                <motion.div key={platform} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={`transition-colors ${isConnected ? 'border-primary/30' : 'border-dashed'}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-6 h-6 ${meta.color}`} />
                          <span className="font-medium">{meta.label}</span>
                        </div>
                        {isConnected ? (
                          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 gap-1">
                            <CheckCircle className="w-3 h-3" /> Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground gap-1">
                            <XCircle className="w-3 h-3" /> Not connected
                          </Badge>
                        )}
                      </div>
                      {isConnected && connection.account_name && (
                        <p className="text-sm text-muted-foreground mb-3">{connection.account_name}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant={isConnected ? 'outline' : 'default'}
                          className="flex-1 gap-2"
                          size="sm"
                          disabled={connecting === platform}
                          onClick={() => handleConnect(platform)}
                        >
                          {connecting === platform ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3 h-3" />
                          )}
                          {isConnected ? 'Reconnect' : 'Connect'}
                        </Button>
                        {isConnected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDisconnect(platform)}
                          >
                            <Unlink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
