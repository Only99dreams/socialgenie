import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  Clock,
  Calendar,
  Bot,
  Zap,
  Target,
  BarChart3,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface AnalyticsData {
  totalImpressions: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalClicks: number;
  totalSaves: number;
  avgEngagementRate: number;
  dailyMetrics: Array<{ date: string; likes: number; comments: number; shares: number; reach: number }>;
  platformBreakdown: Array<{ platform: string; posts: number; totalEngagement: number }>;
  topPosts: Array<{ id: string; platform: string; content: string; likes: number; comments: number; shares: number; engagement_rate: number }>;
  aiMetrics: { postsGenerated: number; postsPublished: number; avgEngagement: number };
}

const platformColors: Record<string, string> = {
  instagram: 'hsl(340, 82%, 59%)',
  linkedin: 'hsl(201, 100%, 35%)',
  facebook: 'hsl(220, 46%, 48%)',
  twitter: 'hsl(203, 89%, 53%)',
  tiktok: 'hsl(340, 82%, 52%)',
};

const chartConfig = {
  likes: { label: 'Likes', color: 'hsl(199, 89%, 48%)' },
  comments: { label: 'Comments', color: 'hsl(280, 80%, 60%)' },
  shares: { label: 'Shares', color: 'hsl(142, 76%, 36%)' },
  reach: { label: 'Reach', color: 'hsl(38, 92%, 50%)' },
};

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card className="bg-card border-border">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: result, error } = await supabase.functions.invoke('fetch-analytics', {
        body: null,
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      // Use query params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-analytics?days=${timeRange}`,
        { headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );

      if (response.ok) {
        const analytics = await response.json();
        setData(analytics);
      }
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const dailyChartData = data?.dailyMetrics.map(d => ({
    day: format(new Date(d.date), 'MMM d'),
    likes: d.likes,
    comments: d.comments,
    shares: d.shares,
    reach: d.reach,
  })) || [];

  const pieData = data?.platformBreakdown.map(p => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    value: p.totalEngagement || p.posts,
    color: platformColors[p.platform] || 'hsl(0, 0%, 50%)',
  })) || [];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {/* Header */}
          <DashboardHeader 
            title="Analytics"
            subtitle="Track your social media performance and AI insights"
          >
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Tabs value={timeRange} onValueChange={setTimeRange}>
                <TabsList className="bg-card border border-border">
                  <TabsTrigger value="7">7 Days</TabsTrigger>
                  <TabsTrigger value="30">30 Days</TabsTrigger>
                  <TabsTrigger value="90">90 Days</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </DashboardHeader>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6"
              >
                <StatCard title="Total Reach" value={data?.totalReach || 0} icon={Eye} />
                <StatCard title="Engagement Rate" value={`${data?.avgEngagementRate || 0}%`} icon={Heart} />
                <StatCard title="Comments" value={data?.totalComments || 0} icon={MessageCircle} />
                <StatCard title="Shares" value={data?.totalShares || 0} icon={Share2} />
              </motion.div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                {/* Engagement Over Time */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Engagement Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dailyChartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[300px]">
                          <AreaChart data={dailyChartData}>
                            <defs>
                              <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area type="monotone" dataKey="likes" stroke="hsl(199, 89%, 48%)" fillOpacity={1} fill="url(#colorLikes)" />
                            <Area type="monotone" dataKey="comments" stroke="hsl(280, 80%, 60%)" fillOpacity={1} fill="url(#colorComments)" />
                          </AreaChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          <p>No engagement data yet. Publish posts to start tracking.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Top Posts */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Top Performing Posts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data?.topPosts && data.topPosts.length > 0 ? (
                        <div className="space-y-3">
                          {data.topPosts.map((post, i) => (
                            <div key={post.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs capitalize">{post.platform}</Badge>
                                <span className="text-xs text-muted-foreground">#{i + 1}</span>
                              </div>
                              <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments}</span>
                                <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          <p>No post data yet.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* AI Performance & Platform Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* AI Agent Performance */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary" />
                        AI Agent Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold">{data?.aiMetrics.postsGenerated || 0}</p>
                          <p className="text-xs text-muted-foreground">Posts Generated</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <Calendar className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{data?.aiMetrics.postsPublished || 0}</p>
                          <p className="text-xs text-muted-foreground">Posts Published</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <Heart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{data?.aiMetrics.avgEngagement || 0}%</p>
                          <p className="text-xs text-muted-foreground">Avg Engagement</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <Bot className="w-10 h-10 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold">AI Agent Insights</p>
                            <p className="text-sm text-muted-foreground">
                              {data?.aiMetrics.postsPublished 
                                ? `Your AI agent has generated ${data.aiMetrics.postsGenerated} posts and published ${data.aiMetrics.postsPublished}. Keep scheduling to improve performance insights.`
                                : 'Start publishing posts to receive AI-powered insights about your best performing content.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Platform Distribution */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Card className="bg-card border-border h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Platform Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pieData.length > 0 ? (
                        <>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2 mt-4">
                            {pieData.map(p => (
                              <div key={p.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-sm">{p.name}</span>
                                </div>
                                <span className="text-sm font-medium">{p.value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                          <p className="text-center">No platform data yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
