import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, icon, children }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mb-4 md:mb-6 flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="md:hidden shrink-0" />
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2 truncate">
            {icon}
            {title}
          </h1>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {children}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 md:h-9 md:w-9">
          {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
        </Button>
        <NotificationCenter />
      </div>
    </div>
  );
}
