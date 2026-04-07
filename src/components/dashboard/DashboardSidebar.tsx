import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Sparkles, 
  BarChart3, 
  Settings, 
  Users, 
  FolderOpen,
  Clock,
  Bot,
  LogOut,
  Shield,
  UserCog,
  MessageSquare,
  CreditCard
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: Sparkles, label: 'AI Generator', path: '/generator' },
  { icon: Clock, label: 'Scheduled Posts', path: '/scheduled' },
  { icon: MessageSquare, label: 'Comments', path: '/comments' },
  { icon: FolderOpen, label: 'Content Library', path: '/library' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

const settingsNavItems = [
  { icon: Bot, label: 'AI Agent', path: '/agent' },
  { icon: Users, label: 'Accounts', path: '/accounts' },
  { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isModerator, isAdminOrModerator } = useRoles();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending review count
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();

      if (!business) return;

      const { count } = await supabase
        .from('comment_responses')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('status', 'pending_review' as any);

      setPendingCount(count || 0);
    };

    fetchPendingCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('comment-responses-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comment_responses',
      }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">SocialGenie</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.path === '/comments' && pendingCount > 0 && (
                    <SidebarMenuBadge className="bg-primary text-primary-foreground text-xs">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin/Moderator Section - Only visible to users with roles */}
        {isAdminOrModerator && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isModerator && !isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === '/moderator'}
                    >
                      <Link to="/moderator" className="flex items-center gap-3">
                        <UserCog className="w-5 h-5 text-amber-400" />
                        <span>Moderator Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === '/moderator'}
                      >
                        <Link to="/moderator" className="flex items-center gap-3">
                          <UserCog className="w-5 h-5 text-amber-400" />
                          <span>Moderator Panel</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === '/admin'}
                      >
                        <Link to="/admin" className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-red-400" />
                          <span>Admin Panel</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
