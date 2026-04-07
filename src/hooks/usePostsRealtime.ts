import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

export function usePostsRealtime(businessId: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    // Fetch initial posts
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('business_id', businessId)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load posts',
          variant: 'destructive',
        });
      } else {
        setPosts(data || []);
      }
      setIsLoading(false);
    };

    fetchPosts();

    // Set up realtime subscription
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPosts((prev) => [...prev, payload.new as Post]);
          } else if (payload.eventType === 'UPDATE') {
            setPosts((prev) =>
              prev.map((post) =>
                post.id === (payload.new as Post).id ? (payload.new as Post) : post
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPosts((prev) =>
              prev.filter((post) => post.id !== (payload.old as Post).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, toast]);

  const updatePostSchedule = async (postId: string, newDate: Date) => {
    const { error } = await supabase
      .from('posts')
      .update({ scheduled_at: newDate.toISOString() })
      .eq('id', postId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule post',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Post rescheduled',
      description: 'The post has been moved to the new date',
    });
    return true;
  };

  return { posts, isLoading, updatePostSchedule };
}
