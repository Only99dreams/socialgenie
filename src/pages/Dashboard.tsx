import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

type Business = {
  id: string;
  name: string;
  website_url: string;
  brand_tone: string;
};

type Agent = {
  id: string;
  mode: string;
  status: string;
  business_profile: any;
};

const Dashboard = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ postsThisWeek: 0, totalReach: 0, engagementRate: 0 });
  const [upcomingPosts, setUpcomingPosts] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  useRealtimeNotifications();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data: businesses } = await supabase.from("businesses").select("*").limit(1);
      if (businesses && businesses.length > 0) {
        const biz = businesses[0];
        setBusiness(biz);

        const { data: agents } = await supabase.from("ai_agents").select("*").eq("business_id", biz.id).limit(1);
        if (agents && agents.length > 0) setAgent(agents[0]);

        // Fetch real stats
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: postsCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("business_id", biz.id)
          .gte("created_at", oneWeekAgo.toISOString());

        const { data: analyticsData } = await supabase
          .from("post_analytics")
          .select("reach, engagement_rate")
          .eq("business_id", biz.id);

        const totalReach = analyticsData?.reduce((sum, a) => sum + (a.reach || 0), 0) || 0;
        const avgEngagement = analyticsData && analyticsData.length > 0
          ? analyticsData.reduce((sum, a) => sum + (Number(a.engagement_rate) || 0), 0) / analyticsData.length
          : 0;

        setStats({
          postsThisWeek: postsCount || 0,
          totalReach,
          engagementRate: Math.round(avgEngagement * 10) / 10,
        });

        // Fetch upcoming scheduled posts
        const { data: scheduled } = await supabase
          .from("posts")
          .select("id, content, platform, scheduled_at")
          .eq("business_id", biz.id)
          .eq("status", "scheduled")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(3);

        setUpcomingPosts(scheduled || []);
      } else {
        navigate("/onboarding"); return;
      }
      setIsLoading(false);
    };
    fetchData();
  }, [navigate]);

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  const toggleAgentStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("ai_agents").update({ status: newStatus }).eq("id", agent.id);
    if (error) { toast({ title: "Error", description: "Failed to update agent status", variant: "destructive" }); return; }
    setAgent({ ...agent, status: newStatus });
    toast({ title: newStatus === "active" ? "Agent Activated" : "Agent Paused", description: newStatus === "active" ? "Your AI agent is now running" : "Your AI agent has been paused" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    paused: "bg-yellow-500",
    learning: "bg-blue-500",
    inactive: "bg-gray-500",
  };

  const platformEmoji: Record<string, string> = {
    instagram: "📸",
    facebook: "💼",
    twitter: "🐦",
    linkedin: "💼",
    tiktok: "🎵",
  };

  const formatReach = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header */}
            <DashboardHeader 
              title={`Welcome back, ${business?.name}`}
              subtitle="Here's how your AI agent is performing"
            />

            {/* Agent Status Card */}
              <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6 md:mb-8">
              <div className="col-span-full lg:col-span-2 p-4 md:p-6 rounded-2xl card-gradient border border-border">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-1">AI Agent Status</h2>
                    <p className="text-sm text-muted-foreground">Mode: {agent?.mode === "autopilot" ? "Full Autopilot" : "Review Before Posting"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${statusColors[agent?.status || "inactive"]} animate-pulse`} />
                    <span className="text-sm font-medium capitalize">{agent?.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="p-4 rounded-xl bg-secondary/50"><p className="text-2xl font-bold">{stats.postsThisWeek}</p><p className="text-sm text-muted-foreground">Posts This Week</p></div>
                  <div className="p-4 rounded-xl bg-secondary/50"><p className="text-2xl font-bold">{formatReach(stats.totalReach)}</p><p className="text-sm text-muted-foreground">Total Reach</p></div>
                  <div className="p-4 rounded-xl bg-secondary/50"><p className="text-2xl font-bold">{stats.engagementRate}%</p><p className="text-sm text-muted-foreground">Engagement Rate</p></div>
                </div>
                <Button onClick={toggleAgentStatus} variant={agent?.status === "active" ? "outline" : "default"} className="w-full">
                  {agent?.status === "active" ? <><Pause className="w-4 h-4" /> Pause Agent</> : <><Play className="w-4 h-4" /> Activate Agent</>}
                </Button>
              </div>

              <div className="p-6 rounded-2xl card-gradient border border-border">
                <h2 className="font-display text-xl font-semibold mb-4">Upcoming Posts</h2>
                <div className="space-y-3">
                  {upcomingPosts.length > 0 ? upcomingPosts.map((post) => (
                    <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg">{platformEmoji[post.platform] || "📝"}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{post.content.slice(0, 40)}...</p><p className="text-xs text-muted-foreground">{new Date(post.scheduled_at).toLocaleString()}</p></div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming posts</p>
                  )}
                </div>
                <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/calendar')}>View Calendar</Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 rounded-2xl card-gradient border border-border">
              <h2 className="font-display text-xl font-semibold mb-4">Agent Activity</h2>
              <div className="space-y-4">
                {[
                  { icon: "🧠", action: "Analyzed trending topics in your industry", time: "2 min ago" },
                  { icon: "✍️", action: "Generated 3 new post drafts", time: "15 min ago" },
                  { icon: "📊", action: "Updated performance metrics", time: "1 hour ago" },
                  { icon: "📅", action: "Scheduled posts for next week", time: "3 hours ago" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span className="text-2xl">{activity.icon}</span>
                    <div className="flex-1"><p className="text-sm">{activity.action}</p><p className="text-xs text-muted-foreground">{activity.time}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
