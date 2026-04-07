import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DraggablePostCard } from './DraggablePostCard';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

interface DroppableDayProps {
  day: number;
  date: Date;
  posts: Post[];
  isToday: boolean;
  isPast: boolean;
  onDateClick: (date: Date) => void;
}

export function DroppableDay({ 
  day, 
  date, 
  posts, 
  isToday, 
  isPast, 
  onDateClick 
}: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  });

  return (
    <motion.div
      ref={setNodeRef}
      whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
      onClick={() => onDateClick(date)}
      className={cn(
        "min-h-[120px] p-2 border-b border-r border-border cursor-pointer transition-all",
        isPast && "opacity-50",
        isToday && "bg-primary/5",
        isOver && "bg-primary/20 ring-2 ring-primary ring-inset"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-7 h-7 rounded-full text-sm mb-2",
        isToday && "bg-primary text-primary-foreground font-bold"
      )}>
        {day}
      </div>
      
      <div className="space-y-1">
        {posts.slice(0, 3).map((post) => (
          <DraggablePostCard key={post.id} post={post} />
        ))}
        {posts.length > 3 && (
          <div className="text-xs text-muted-foreground px-2">
            +{posts.length - 3} more
          </div>
        )}
      </div>
    </motion.div>
  );
}
