import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    let userId: string | null = null;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
    };
    init();

    const saveNotification = async (title: string, message: string, icon: string) => {
      if (!userId) return;
      await supabase.from('notifications').insert({ user_id: userId, title, message, icon } as any);
    };

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const post = payload.new as any;
          if (post.status === 'published') {
            const title = '📢 New Post Published';
            const msg = `A new ${post.platform} post has been published.`;
            toast({ title, description: msg });
            saveNotification(title, msg, '📢');
          } else if (post.status === 'scheduled') {
            const title = '🕐 Post Scheduled';
            const msg = `A ${post.platform} post has been scheduled.`;
            toast({ title, description: msg });
            saveNotification(title, msg, '🕐');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const comment = payload.new as any;
          const title = '💬 New Comment';
          const msg = `${comment.author_name || 'Someone'} commented on your ${comment.platform} post.`;
          toast({ title, description: msg });
          saveNotification(title, msg, '💬');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comment_responses' },
        (payload) => {
          const response = payload.new as any;
          if (response.status === 'pending_review') {
            const title = '🤖 AI Response Ready';
            const msg = 'A new AI-generated reply is waiting for your review.';
            toast({ title, description: msg });
            saveNotification(title, msg, '🤖');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
}
