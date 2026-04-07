import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

export function useRoles() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator');
  const isAdminOrModerator = isAdmin || isModerator;

  useEffect(() => {
    const checkRoles = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setRoles([]);
          setIsLoading(false);
          return;
        }

        // Use the security definer function to get user's roles
        const { data, error } = await supabase.rpc('get_my_roles');

        if (error) {
          console.error('Error checking roles:', error);
          setRoles([]);
        } else {
          setRoles((data as AppRole[]) || []);
        }
      } catch (error) {
        console.error('Error in roles check:', error);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { roles, isAdmin, isModerator, isAdminOrModerator, isLoading };
}
