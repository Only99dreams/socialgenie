import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  selectedPlatform: string;
  onDateClick: (date: Date) => void;
}

interface MockPost {
  id: string;
  platform: string;
  date: Date;
  status: 'scheduled' | 'draft' | 'published';
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
};

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  linkedin: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  twitter: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
  tiktok: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

// Mock data - replace with real data from Supabase
const mockPosts: MockPost[] = [
  { id: '1', platform: 'instagram', date: new Date(2026, 0, 12), status: 'scheduled' },
  { id: '2', platform: 'linkedin', date: new Date(2026, 0, 12), status: 'scheduled' },
  { id: '3', platform: 'facebook', date: new Date(2026, 0, 14), status: 'draft' },
  { id: '4', platform: 'twitter', date: new Date(2026, 0, 15), status: 'scheduled' },
  { id: '5', platform: 'instagram', date: new Date(2026, 0, 18), status: 'scheduled' },
  { id: '6', platform: 'linkedin', date: new Date(2026, 0, 20), status: 'draft' },
];

export function CalendarGrid({ currentDate, selectedPlatform, onDateClick }: CalendarGridProps) {
  const { days, startDay } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    
    return {
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      startDay
    };
  }, [currentDate]);

  const getPostsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return mockPosts.filter(post => {
      const postDate = new Date(post.date);
      const matchesDate = postDate.getDate() === day && 
                          postDate.getMonth() === month && 
                          postDate.getFullYear() === year;
      const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform;
      
      return matchesDate && matchesPlatform;
    });
  };

  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const isPast = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/30"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[120px] p-2 border-b border-r border-border bg-muted/10" />
        ))}
        
        {/* Actual days */}
        {days.map((day) => {
          const posts = getPostsForDay(day);
          const dateForClick = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          
          return (
            <motion.div
              key={day}
              whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
              onClick={() => onDateClick(dateForClick)}
              className={cn(
                "min-h-[120px] p-2 border-b border-r border-border cursor-pointer transition-colors",
                isPast(day) && "opacity-50",
                isToday(day) && "bg-primary/5"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full text-sm mb-2",
                isToday(day) && "bg-primary text-primary-foreground font-bold"
              )}>
                {day}
              </div>
              
              <div className="space-y-1">
                {posts.slice(0, 3).map((post) => {
                  const Icon = platformIcons[post.platform];
                  return (
                    <div 
                      key={post.id}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-xs border",
                        platformColors[post.platform]
                      )}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      <span className="truncate capitalize">{post.platform}</span>
                    </div>
                  );
                })}
                {posts.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2">
                    +{posts.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
