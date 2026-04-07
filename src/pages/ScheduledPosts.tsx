import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter,
  Loader2,
  CalendarDays,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Post {
  id: string;
  platform: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  image_url: string | null;
  hashtags: string[] | null;
  created_at: string;
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: () => <span className="text-xs font-bold">TT</span>,
};

const platformColors: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  facebook: 'from-blue-600 to-blue-400',
  twitter: 'from-gray-700 to-gray-500',
  linkedin: 'from-blue-700 to-blue-500',
  tiktok: 'from-pink-600 to-cyan-400',
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  scheduled: { icon: Clock, color: 'text-amber-400', label: 'Scheduled' },
  published: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Published' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  draft: { icon: AlertCircle, color: 'text-muted-foreground', label: 'Draft' },
};

export default function ScheduledPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (business) {
        setBusinessId(business.id);
      }
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!businessId) return;
    fetchPosts();

    const channel = supabase
      .channel('scheduled-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `business_id=eq.${businessId}` }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId]);

  const fetchPosts = async () => {
    if (!businessId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('business_id', businessId)
      .order('scheduled_at', { ascending: false, nullsFirst: false })
      .limit(50);

    if (!error && data) setPosts(data);
    setIsLoading(false);
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: 'Post deleted' });
    }
  };

  const handleRetry = async (postId: string) => {
    const { error } = await supabase.from('posts').update({ status: 'scheduled' }).eq('id', postId);
    if (error) {
      toast({ title: 'Retry failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post rescheduled for retry' });
      fetchPosts();
    }
  };

  const filtered = statusFilter === 'all' ? posts : posts.filter(p => p.status === statusFilter);

  const counts = {
    all: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
    failed: posts.filter(p => p.status === 'failed').length,
    draft: posts.filter(p => p.status === 'draft').length,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <DashboardHeader 
            title="Scheduled Posts"
            subtitle="Manage and monitor all your scheduled content"
          />

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(['scheduled', 'published', 'failed', 'draft'] as const).map(status => {
              const cfg = statusConfig[status];
              const Icon = cfg.icon;
              return (
                <Card key={status} className="p-4 bg-card border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter(status)}>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{counts[status]}</p>
                      <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </motion.div>

          {/* Filter */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-4 md:mb-6 overflow-x-auto">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="all" className="gap-1 text-xs md:text-sm"><Filter className="w-3 h-3 md:w-4 md:h-4" />All ({counts.all})</TabsTrigger>
                <TabsTrigger value="scheduled" className="gap-1 text-xs md:text-sm"><Clock className="w-3 h-3 md:w-4 md:h-4" />Scheduled ({counts.scheduled})</TabsTrigger>
                <TabsTrigger value="published" className="gap-1 text-xs md:text-sm"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />Published ({counts.published})</TabsTrigger>
                <TabsTrigger value="failed" className="gap-1 text-xs md:text-sm"><XCircle className="w-3 h-3 md:w-4 md:h-4" />Failed ({counts.failed})</TabsTrigger>
                <TabsTrigger value="draft" className="gap-1 text-xs md:text-sm"><AlertCircle className="w-3 h-3 md:w-4 md:h-4" />Draft ({counts.draft})</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Posts List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <Card className="p-12 bg-card border-border text-center">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No posts found</p>
              </Card>
            ) : (
              filtered.map(post => {
                const PlatformIcon = platformIcons[post.platform] || Clock;
                const cfg = statusConfig[post.status] || statusConfig.draft;
                const StatusIcon = cfg.icon;

                return (
                  <Card key={post.id} className="p-4 bg-card border-border hover:border-primary/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platformColors[post.platform] || 'from-gray-500 to-gray-400'} flex items-center justify-center shrink-0`}>
                        <PlatformIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize text-sm">{post.platform}</span>
                          <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.hashtags.slice(0, 5).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {post.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(post.scheduled_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          )}
                          {post.image_url && (
                            <span className="text-primary">📷 With image</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {post.status === 'failed' && (
                          <Button variant="ghost" size="icon" onClick={() => handleRetry(post.id)} title="Retry">
                            <RefreshCw className="w-4 h-4 text-amber-400" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </motion.div>
        </main>
      </div>
    </SidebarProvider>
  );
}
