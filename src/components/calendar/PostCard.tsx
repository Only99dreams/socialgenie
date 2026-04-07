import { format } from 'date-fns';
import { Instagram, Facebook, Linkedin, Twitter, Clock, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PostCardProps {
  platform: string;
  content: string;
  scheduledAt: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  imageUrl?: string;
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
};

const platformColors: Record<string, string> = {
  instagram: 'text-pink-400',
  facebook: 'text-blue-400',
  linkedin: 'text-sky-400',
  twitter: 'text-slate-300',
  tiktok: 'text-purple-400',
};

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-primary/20 text-primary',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-destructive/20 text-destructive',
};

export function PostCard({ platform, content, scheduledAt, status, imageUrl }: PostCardProps) {
  const Icon = platformIcons[platform];

  return (
    <Card className="p-4 bg-secondary/50 border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Platform Icon */}
          <div className={cn("mt-0.5", platformColors[platform])}>
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground line-clamp-2 mb-2">{content}</p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={statusStyles[status]}>
                {status}
              </Badge>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(scheduledAt, 'MMM d, h:mm a')}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="mt-3">
          <img 
            src={imageUrl} 
            alt="Post preview" 
            className="w-full h-24 object-cover rounded-lg"
          />
        </div>
      )}
    </Card>
  );
}
