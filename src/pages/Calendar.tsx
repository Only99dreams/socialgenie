import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DragDropCalendarGrid } from '@/components/calendar/DragDropCalendarGrid';
import { PostCard } from '@/components/calendar/PostCard';
import { CreatePostDialog } from '@/components/calendar/CreatePostDialog';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePostsRealtime } from '@/hooks/usePostsRealtime';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  x: Twitter,
  tiktok: () => <span className="text-xs font-bold">TT</span>
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { posts, isLoading, updatePostSchedule } = usePostsRealtime(businessId);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (business) {
        setBusinessId(business.id);
      }
    };

    checkAuth();
  }, [navigate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsCreateOpen(true);
  };

  const upcomingPosts = posts
    .filter(post => post.scheduled_at && new Date(post.scheduled_at) > new Date())
    .slice(0, 3);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {/* Header */}
          <DashboardHeader 
            title="Content Calendar"
            subtitle="Plan and schedule your social media posts"
          >
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <Sparkles className="w-4 h-4" />
                AI Generate
              </Button>
              <Button 
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="w-4 h-4" />
                New Post
              </Button>
            </div>
          </DashboardHeader>

          {/* Filters & Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 md:mb-6"
          >
            {/* Platform Filter */}
            <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="all" className="gap-2">
                  <Filter className="w-4 h-4" />
                  All
                </TabsTrigger>
                {Object.entries(platformIcons).map(([platform, Icon]) => (
                  <TabsTrigger key={platform} value={platform} className="gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline capitalize">{platform}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="min-w-[150px] text-center font-semibold">{monthName}</span>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Calendar Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px] bg-card border border-border rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <DragDropCalendarGrid 
                currentDate={currentDate}
                selectedPlatform={selectedPlatform}
                posts={posts}
                onDateClick={handleDateClick}
                onPostReschedule={updatePostSchedule}
              />
            )}
          </motion.div>

          {/* Upcoming Posts Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Upcoming Posts
              </h3>
              <div className="space-y-4">
                {upcomingPosts.length > 0 ? (
                  upcomingPosts.map(post => (
                    <PostCard 
                      key={post.id}
                      platform={post.platform}
                      content={post.content}
                      scheduledAt={post.scheduled_at ? new Date(post.scheduled_at) : undefined}
                      status={post.status as 'scheduled' | 'draft' | 'published'}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming posts scheduled. Create one to get started!
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Create Post Dialog */}
          <CreatePostDialog 
            open={isCreateOpen} 
            onOpenChange={setIsCreateOpen}
            selectedDate={selectedDate}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
