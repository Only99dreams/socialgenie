import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  Loader2,
  Search,
  Filter,
  MessageSquare,
  UserCog,
  Instagram,
  Facebook,
  Linkedin,
  Twitter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  x: Twitter,
};

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  linkedin: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  x: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
  tiktok: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const statusColors: Record<string, string> = {
  draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  published: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ModeratorDashboard() {
  const { isAdminOrModerator, isLoading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (!rolesLoading && !isAdminOrModerator) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the moderator dashboard.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isAdminOrModerator, rolesLoading, navigate, toast]);

  useEffect(() => {
    if (isAdminOrModerator) {
      fetchPosts();
    }
  }, [isAdminOrModerator]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts for review',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (post: Post) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'scheduled' })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: 'Post Approved',
        description: 'The post has been approved and scheduled.',
      });

      fetchPosts();
    } catch (error) {
      console.error('Error approving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve post',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'draft' })
        .eq('id', selectedPost.id);

      if (error) throw error;

      toast({
        title: 'Post Rejected',
        description: 'The post has been sent back to drafts.',
      });

      setIsReviewDialogOpen(false);
      setSelectedPost(null);
      setReviewNote('');
      fetchPosts();
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject post',
        variant: 'destructive',
      });
    }
  };

  const openRejectDialog = (post: Post) => {
    setSelectedPost(post);
    setIsReviewDialogOpen(true);
  };

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdminOrModerator) {
    return null;
  }

  const filteredPosts = posts.filter(p => 
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingPosts = filteredPosts.filter(p => p.status === 'draft' && p.ai_generated);
  const scheduledPosts = filteredPosts.filter(p => p.status === 'scheduled');
  const allPosts = filteredPosts;

  const stats = {
    pending: pendingPosts.length,
    scheduled: scheduledPosts.length,
    total: posts.length,
    aiGenerated: posts.filter(p => p.ai_generated).length,
  };

  const PostCard = ({ post }: { post: Post }) => {
    const Icon = platformIcons[post.platform] || Instagram;
    
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className={platformColors[post.platform] || platformColors.instagram}>
                <Icon className="w-3 h-3 mr-1" />
                {post.platform}
              </Badge>
              <Badge className={statusColors[post.status]}>
                {post.status}
              </Badge>
              {post.ai_generated && (
                <Badge variant="outline" className="text-primary border-primary/30">
                  AI Generated
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-sm mb-3 line-clamp-3">{post.content}</p>
          
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.hashtags.slice(0, 5).map((tag, i) => (
                <span key={i} className="text-xs text-primary">#{tag}</span>
              ))}
            </div>
          )}
          
          {post.scheduled_at && (
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Scheduled: {new Date(post.scheduled_at).toLocaleString()}
            </p>
          )}
          
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => openRejectDialog(post)}
            >
              <Eye className="w-4 h-4" />
              Review
            </Button>
            {post.status === 'draft' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-green-400 border-green-500/30 hover:bg-green-500/10"
                  onClick={() => handleApprove(post)}
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => openRejectDialog(post)}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <UserCog className="w-8 h-8 text-amber-400" />
                Moderator Dashboard
              </h1>
              <p className="text-muted-foreground">Review and approve content before publishing</p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="text-2xl font-bold mt-1">{stats.scheduled}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">AI Generated</p>
                    <p className="text-2xl font-bold mt-1">{stats.aiGenerated}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Filter className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search & Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-card border border-border">
                  <TabsTrigger value="pending" className="gap-2">
                    <Clock className="w-4 h-4" />
                    Pending ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="scheduled" className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Scheduled ({stats.scheduled})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="gap-2">
                    <Filter className="w-4 h-4" />
                    All Posts
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Posts Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === 'pending' && pendingPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
                {activeTab === 'scheduled' && scheduledPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
                {activeTab === 'all' && allPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                {((activeTab === 'pending' && pendingPosts.length === 0) ||
                  (activeTab === 'scheduled' && scheduledPosts.length === 0) ||
                  (activeTab === 'all' && allPosts.length === 0)) && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No posts found
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Review Dialog */}
          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Review Post</DialogTitle>
              </DialogHeader>
              
              {selectedPost && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={platformColors[selectedPost.platform]}>
                        {selectedPost.platform}
                      </Badge>
                      {selectedPost.ai_generated && (
                        <Badge variant="outline" className="text-primary border-primary/30">
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{selectedPost.content}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Review Notes (optional)
                    </label>
                    <Textarea
                      placeholder="Add notes for why this post was rejected..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                  onClick={() => {
                    if (selectedPost) handleApprove(selectedPost);
                    setIsReviewDialogOpen(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={handleReject}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
