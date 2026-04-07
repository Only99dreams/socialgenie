import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  RefreshCw,
  Check,
  X,
  Edit3,
  Send,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Loader2,
  Bot,
  Settings2,
  Filter,
} from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: () => <span className="text-xs font-bold">TT</span>,
};

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-400',
  facebook: 'bg-blue-500/20 text-blue-400',
  linkedin: 'bg-sky-500/20 text-sky-400',
  twitter: 'bg-slate-400/20 text-slate-300',
  tiktok: 'bg-purple-500/20 text-purple-400',
};

const statusColors: Record<string, string> = {
  pending_review: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-blue-500/20 text-blue-400',
  posted: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
  failed: 'bg-red-500/20 text-red-400',
};

export default function Comments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isAutopilot, setIsAutopilot] = useState(false);

  // Fetch user's business
  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();
      if (data) setBusinessId(data.id);
    };
    fetchBusiness();
  }, []);

  // Fetch comment settings
  useEffect(() => {
    if (!businessId) return;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('comment_settings')
        .select('response_mode')
        .eq('business_id', businessId)
        .single();
      if (data) setIsAutopilot(data.response_mode === 'autopilot');
    };
    fetchSettings();
  }, [businessId]);

  // Fetch comments with responses
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', businessId, platformFilter, statusFilter],
    queryFn: async () => {
      if (!businessId) return [];
      
      let query = supabase
        .from('comment_responses')
        .select('*, comments(*)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by platform on the client side since it's in the joined table
      if (platformFilter !== 'all') {
        return (data || []).filter((r: any) => r.comments?.platform === platformFilter);
      }
      return data || [];
    },
    enabled: !!businessId,
  });

  // Fetch comments mutation
  const fetchCommentsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('comment-responder', {
        body: { action: 'fetch', businessId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast({
        title: 'Comments fetched!',
        description: `Found ${data.fetched} new comments with AI responses generated.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to fetch comments', description: err.message, variant: 'destructive' });
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (commentResponseId: string) => {
      const { data, error } = await supabase.functions.invoke('comment-responder', {
        body: { action: 'approve', commentResponseId, businessId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast({ title: 'Response posted!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to post response', description: err.message, variant: 'destructive' });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (commentResponseId: string) => {
      const { data, error } = await supabase.functions.invoke('comment-responder', {
        body: { action: 'reject', commentResponseId, businessId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast({ title: 'Response rejected' });
    },
  });

  // Edit response
  const handleSaveEdit = async (responseId: string) => {
    await supabase.from('comment_responses')
      .update({ edited_response: editedText })
      .eq('id', responseId);
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ['comments'] });
    toast({ title: 'Response edited' });
  };

  // Toggle mode
  const handleToggleMode = async (autopilot: boolean) => {
    if (!businessId) return;
    setIsAutopilot(autopilot);
    await supabase.from('comment_settings').upsert({
      business_id: businessId,
      response_mode: autopilot ? 'autopilot' : 'review',
    }, { onConflict: 'business_id' });
    toast({
      title: autopilot ? 'Autopilot enabled' : 'Review mode enabled',
      description: autopilot
        ? 'AI will automatically respond to new comments.'
        : 'AI responses will be queued for your review.',
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {/* Header */}
          <DashboardHeader 
            title="Comment Responses"
            subtitle="AI-powered replies across all your platforms"
            icon={<MessageSquare className="w-6 h-6 text-primary" />}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                <Bot className="w-4 h-4 text-primary" />
                <Label htmlFor="mode-toggle" className="text-sm cursor-pointer">
                  {isAutopilot ? 'Autopilot' : 'Review'}
                </Label>
                <Switch
                  id="mode-toggle"
                  checked={isAutopilot}
                  onCheckedChange={handleToggleMode}
                />
              </div>
              <Button
                onClick={() => fetchCommentsMutation.mutate()}
                disabled={fetchCommentsMutation.isPending || !businessId}
                className="gap-2"
              >
                {fetchCommentsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Fetch Comments
              </Button>
            </div>
          </DashboardHeader>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 md:mb-6">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">X/Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comments List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !commentsData?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No comments yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Fetch Comments" to pull in comments from your connected platforms.
                </p>
                <Button
                  onClick={() => fetchCommentsMutation.mutate()}
                  disabled={fetchCommentsMutation.isPending || !businessId}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Fetch Comments
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {commentsData.map((response: any) => {
                  const comment = response.comments;
                  if (!comment) return null;
                  const Icon = platformIcons[comment.platform] || MessageSquare;

                  return (
                    <motion.div
                      key={response.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Platform icon */}
                            <div className={`p-2 rounded-lg ${platformColors[comment.platform] || ''}`}>
                              <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Comment header */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {comment.author_name || comment.author_username}
                                </span>
                                {comment.author_username && (
                                  <span className="text-xs text-muted-foreground">
                                    @{comment.author_username}
                                  </span>
                                )}
                                <Badge className={statusColors[response.status] || ''} variant="secondary">
                                  {response.status.replace('_', ' ')}
                                </Badge>
                              </div>

                              {/* Original comment */}
                              <p className="text-sm text-muted-foreground mb-3">
                                "{comment.content}"
                              </p>

                              {/* AI Response */}
                              <div className="pl-4 border-l-2 border-primary/30">
                                <div className="flex items-center gap-1 mb-1">
                                  <Bot className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-medium text-primary">AI Response</span>
                                </div>

                                {editingId === response.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editedText}
                                      onChange={(e) => setEditedText(e.target.value)}
                                      className="min-h-[80px] text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => handleSaveEdit(response.id)} className="gap-1">
                                        <Check className="w-3 h-3" />
                                        Save
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm">
                                    {response.edited_response || response.ai_response}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              {response.status === 'pending_review' && editingId !== response.id && (
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    onClick={() => approveMutation.mutate(response.id)}
                                    disabled={approveMutation.isPending}
                                    className="gap-1"
                                  >
                                    <Send className="w-3 h-3" />
                                    Approve & Post
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingId(response.id);
                                      setEditedText(response.edited_response || response.ai_response);
                                    }}
                                    className="gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => rejectMutation.mutate(response.id)}
                                    className="gap-1 text-destructive hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
