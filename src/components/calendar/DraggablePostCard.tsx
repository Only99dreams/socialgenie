import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Instagram, Facebook, Linkedin, Twitter, GripVertical } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  x: Twitter,
  tiktok: () => <span className="text-xs font-bold">TT</span>,
};

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  linkedin: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  x: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
  tiktok: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

interface DraggablePostCardProps {
  post: Post;
}

export function DraggablePostCard({ post }: DraggablePostCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const Icon = platformIcons[post.platform] || Instagram;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-grab active:cursor-grabbing transition-all",
        platformColors[post.platform] || platformColors.instagram,
        isDragging && "opacity-50 shadow-lg scale-105 z-50"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-3 h-3 opacity-50" />
      <Icon className="w-3 h-3" />
      <span className="truncate max-w-[80px]">{post.content.slice(0, 20)}...</span>
    </div>
  );
}
