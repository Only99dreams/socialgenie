import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  Shield,
  ArrowLeft
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Building2, label: 'Businesses', path: '/admin?tab=businesses' },
  { icon: Users, label: 'User Roles', path: '/admin?tab=roles' },
  { icon: Settings, label: 'Settings', path: '/admin?tab=settings' },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Admin Panel</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={
                      item.path.includes('?')
                        ? location.pathname + location.search === item.path
                        : location.pathname === item.path && !location.search
                    }
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
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" asChild className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
          <Link to="/dashboard">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to App</span>
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
