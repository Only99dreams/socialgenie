import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Pause, Brain, RefreshCw, Loader2, Settings2, Minus, Plus } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function AIAgent() {
  const [agent, setAgent] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: biz } = await supabase
        .from('businesses').select('*').eq('user_id', session.user.id).limit(1).single();
      if (!biz) { navigate('/onboarding'); return; }
      setBusiness(biz);

      const { data: ag } = await supabase
        .from('ai_agents').select('*').eq('business_id', biz.id).limit(1).single();
      if (ag) setAgent(ag);
      setIsLoading(false);
    };
    fetchData();
  }, [navigate]);

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('ai_agents').update({ status: newStatus }).eq('id', agent.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }); return; }
    setAgent({ ...agent, status: newStatus });
    toast({ title: newStatus === 'active' ? 'Agent Activated' : 'Agent Paused' });
  };

  const toggleMode = async (autopilot: boolean) => {
    if (!agent) return;
    const newMode = autopilot ? 'autopilot' : 'review';
    const { error } = await supabase.from('ai_agents').update({ mode: newMode }).eq('id', agent.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update mode', variant: 'destructive' }); return; }
    setAgent({ ...agent, mode: newMode });
    toast({ title: `Mode set to ${newMode}` });
  };

  const updatePostsPerDay = async (delta: number) => {
    if (!agent) return;
    const newVal = Math.max(1, Math.min(10, (agent.posts_per_day || 1) + delta));
    if (newVal === agent.posts_per_day) return;
    const { error } = await supabase.from('ai_agents').update({ posts_per_day: newVal } as any).eq('id', agent.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }); return; }
    setAgent({ ...agent, posts_per_day: newVal });
    toast({ title: `Posts per day set to ${newVal}` });
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400',
    paused: 'bg-amber-500/20 text-amber-400',
    learning: 'bg-blue-500/20 text-blue-400',
    inactive: 'bg-muted text-muted-foreground',
  };

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
            title="AI Agent"
            subtitle="Configure and manage your AI content agent"
            icon={<Bot className="w-6 h-6 text-primary" />}
          />

          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Agent Status
                  {agent && <Badge className={statusColors[agent.status] || ''} variant="secondary">{agent.status}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${agent?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                  <span className="text-sm">{agent?.status === 'active' ? 'Agent is actively creating content' : 'Agent is currently paused'}</span>
                </div>
                <Button onClick={toggleStatus} variant={agent?.status === 'active' ? 'outline' : 'default'} className="w-full gap-2">
                  {agent?.status === 'active' ? <><Pause className="w-4 h-4" /> Pause Agent</> : <><Play className="w-4 h-4" /> Activate Agent</>}
                </Button>
              </CardContent>
            </Card>

            {/* Mode Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" /> Agent Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="agent-mode" className="text-sm">Autopilot Mode</Label>
                  <Switch
                    id="agent-mode"
                    checked={agent?.mode === 'autopilot'}
                    onCheckedChange={toggleMode}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {agent?.mode === 'autopilot'
                    ? 'Posts are published automatically without review.'
                    : 'All posts require your approval before publishing.'}
                </p>
              </CardContent>
            </Card>

            {/* Posts Per Day Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" /> Posts Per Day
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose how many posts are auto-generated and published each day across your connected platforms.
                </p>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => updatePostsPerDay(-1)} disabled={!agent || (agent.posts_per_day || 1) <= 1}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-3xl font-bold text-primary min-w-[3ch] text-center">{agent?.posts_per_day || 1}</span>
                  <Button variant="outline" size="icon" onClick={() => updatePostsPerDay(1)} disabled={!agent || (agent.posts_per_day || 1) >= 10}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">posts / day</span>
                </div>
              </CardContent>
            </Card>

            {/* Business Profile */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" /> Business Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Business</p>
                    <p className="text-sm font-medium">{business?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Industry</p>
                    <p className="text-sm font-medium capitalize">{business?.industry || 'Not set'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Brand Tone</p>
                    <p className="text-sm font-medium capitalize">{business?.brand_tone || 'Not set'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Website</p>
                    <p className="text-sm font-medium truncate">{business?.website_url}</p>
                  </div>
                </div>
                {business?.brand_keywords?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Brand Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {business.brand_keywords.map((kw: string) => (
                        <Badge key={kw} variant="secondary">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
