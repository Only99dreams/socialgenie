import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type GateStatus = 'loading' | 'active' | 'expired' | 'none';

export function useSubscriptionGate() {
  const [status, setStatus] = useState<GateStatus>('loading');

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus('none'); return; }

      // Admins and moderators bypass the gate
      const { data: roles } = await supabase.rpc('get_my_roles');
      if (roles && (roles.includes('admin') || roles.includes('moderator'))) {
        setStatus('active');
        return;
      }

      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sub) { setStatus('none'); return; }

      const isTrialExpired = sub.status === 'trial' && sub.ends_at && new Date(sub.ends_at) < new Date();
      const isSubExpired = sub.status === 'expired';

      if (isTrialExpired || isSubExpired) {
        setStatus('expired');
      } else if (sub.status === 'active' || sub.status === 'trial') {
        setStatus('active');
      } else {
        setStatus('expired');
      }
    };

    check();
  }, []);

  return status;
}
