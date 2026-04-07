import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const status = useSubscriptionGate();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'none') navigate('/login');
    if (status === 'expired') navigate('/subscription?reason=expired');
  }, [status, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status !== 'active') return null;

  return <>{children}</>;
}
