import { useMemo } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { useState } from 'react';
import { DroppableDay } from './DroppableDay';
import { DraggablePostCard } from './DraggablePostCard';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

interface DragDropCalendarGridProps {
  currentDate: Date;
  selectedPlatform: string;
  posts: Post[];
  onDateClick: (date: Date) => void;
  onPostReschedule: (postId: string, newDate: Date) => Promise<boolean>;
}

export function DragDropCalendarGrid({ 
  currentDate, 
  selectedPlatform, 
  posts,
  onDateClick,
  onPostReschedule,
}: DragDropCalendarGridProps) {
  const [activePost, setActivePost] = useState<Post | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
    
    return posts.filter(post => {
      if (!post.scheduled_at) return false;
      
      const postDate = new Date(post.scheduled_at);
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

  const handleDragStart = (event: any) => {
    const post = event.active.data.current?.post;
    if (post) {
      setActivePost(post);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActivePost(null);
    
    const { active, over } = event;
    
    if (!over) return;
    
    const postId = active.id as string;
    const newDate = new Date(over.id as string);
    
    // Don't allow scheduling in the past
    if (newDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      return;
    }
    
    await onPostReschedule(postId, newDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day) => (
              <div 
                key={day} 
                className="p-2 md:p-3 text-center text-xs md:text-sm font-medium text-muted-foreground bg-muted/30"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[120px] p-1 md:p-2 border-b border-r border-border bg-muted/10" />
            ))}
          
          {/* Actual days */}
          {days.map((day) => {
            const dayPosts = getPostsForDay(day);
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            
            return (
              <DroppableDay
                key={day}
                day={day}
                date={date}
                posts={dayPosts}
                isToday={isToday(day)}
                isPast={isPast(day)}
                onDateClick={onDateClick}
              />
            );
          })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activePost && <DraggablePostCard post={activePost} />}
      </DragOverlay>
    </DndContext>
  );
}
