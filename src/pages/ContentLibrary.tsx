import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Search, Filter, Image, Video, FileText, Loader2, Plus } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function ContentLibrary() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();

      if (!business) { navigate('/onboarding'); return; }
      setBusinessId(business.id);

      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      setPosts(data || []);
      setIsLoading(false);
    };
    fetchData();
  }, [navigate]);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = contentType === 'all' || post.content_type === contentType;
    return matchesSearch && matchesType;
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <DashboardHeader 
            title="Content Library"
            subtitle="Browse and manage all your created content"
            icon={<FolderOpen className="w-6 h-6 text-primary" />}
          >
            <Button className="gap-2" onClick={() => navigate('/generator')}>
              <Plus className="w-4 h-4" /> Create New
            </Button>
          </DashboardHeader>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={contentType} onValueChange={setContentType}>
              <TabsList className="bg-card border border-border">
                <TabsTrigger value="all"><Filter className="w-4 h-4 mr-1" /> All</TabsTrigger>
                <TabsTrigger value="feed"><Image className="w-4 h-4 mr-1" /> Feed</TabsTrigger>
                <TabsTrigger value="story"><Video className="w-4 h-4 mr-1" /> Story</TabsTrigger>
                <TabsTrigger value="reel"><FileText className="w-4 h-4 mr-1" /> Reel</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No content found</h3>
                <p className="text-sm text-muted-foreground mb-4">Start creating content to build your library.</p>
                <Button onClick={() => navigate('/generator')}>Create Content</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="capitalize">{post.platform}</Badge>
                        <Badge variant="outline" className="capitalize">{post.content_type}</Badge>
                      </div>
                      <p className="text-sm line-clamp-3 mb-3">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{post.status}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
