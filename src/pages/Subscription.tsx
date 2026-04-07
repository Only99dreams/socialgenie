import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Clock, Loader2, AlertTriangle, Zap, ShieldAlert } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: any;
  trial_days: number;
  is_active: boolean;
}

interface UserSub {
  id: string;
  plan_id: string | null;
  status: string;
  starts_at: string;
  ends_at: string | null;
  plan?: Plan | null;
}

export default function Subscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<UserSub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payingForPlan, setPayingForPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectedExpired = searchParams.get('reason') === 'expired';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login'); return; }

    const [plansRes, subRes] = await Promise.all([
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('user_subscriptions').select('*, plan:subscription_plans(*)').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    setPlans((plansRes.data as any) || []);
    setSubscription(subRes.data as any);
    setIsLoading(false);
  };

  const handleSubscribe = async (plan: Plan) => {
    setPayingForPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('flutterwave-payment', {
        body: { action: 'initialize', plan_id: plan.id },
      });

      if (error) throw error;

      // Load Flutterwave inline
      const flutterwavePublicKey = (window as any).__FLUTTERWAVE_PUBLIC_KEY;
      if (!flutterwavePublicKey && !(window as any).FlutterwaveCheckout) {
        // Fallback: load script dynamically
        await loadFlutterwaveScript();
      }

      const pubKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
      if (!pubKey) {
        toast({ title: 'Configuration Error', description: 'Flutterwave public key not configured. Contact support.', variant: 'destructive' });
        setPayingForPlan(null);
        return;
      }

      (window as any).FlutterwaveCheckout({
        public_key: pubKey,
        tx_ref: data.tx_ref,
        amount: data.amount,
        currency: data.currency || 'USD',
        payment_options: 'card',
        customer: {
          email: data.customer_email,
        },
        customizations: {
          title: 'SocialGenie Subscription',
          description: `Subscribe to ${data.plan_name}`,
        },
        callback: async (response: any) => {
          // Verify payment
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('flutterwave-payment', {
              body: { action: 'verify', transaction_id: response.transaction_id, plan_id: plan.id },
            });
            if (verifyError) throw verifyError;
            toast({ title: 'Payment Successful!', description: `You now have a ${plan.trial_days}-day trial for ${plan.name}. Billing starts after trial.` });
            fetchData();
          } catch (err: any) {
            toast({ title: 'Verification Failed', description: err.message, variant: 'destructive' });
          }
          setPayingForPlan(null);
        },
        onclose: () => {
          setPayingForPlan(null);
        },
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setPayingForPlan(null);
    }
  };

  const isTrialExpired = subscription?.status === 'trial' && subscription.ends_at && new Date(subscription.ends_at) < new Date();
  const isActive = subscription?.status === 'active' || (subscription?.status === 'trial' && !isTrialExpired);
  const daysLeft = subscription?.ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <DashboardHeader
            title="Subscription"
            subtitle="Choose a plan to power your AI social media agent"
            icon={<CreditCard className="w-6 h-6 text-primary" />}
          />

          {/* Redirect Banner */}
          {(redirectedExpired || isTrialExpired) && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Your trial has expired</AlertTitle>
                <AlertDescription>
                  Your free trial period has ended. Choose a plan below to continue using SocialGenie's AI-powered features.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Current Subscription Status */}
          {subscription && !isTrialExpired && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card className={isTrialExpired ? 'border-destructive' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Current Plan
                    <Badge className={
                      isTrialExpired ? 'bg-red-500/20 text-red-400' :
                      subscription.status === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                      subscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      'bg-muted text-muted-foreground'
                    }>
                      {isTrialExpired ? 'Trial Expired' : subscription.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-lg">{(subscription.plan as any)?.name || 'Unknown Plan'}</p>
                  {isTrialExpired ? (
                    <div className="flex items-center gap-2 mt-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <p className="text-sm">Your trial has expired. Please renew to continue.</p>
                    </div>
                  ) : daysLeft !== null && subscription.status === 'trial' ? (
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <p className="text-sm">{daysLeft} days remaining in trial</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Plans */}
          <div className={`grid gap-6 md:grid-cols-2 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} mb-8`}>
            {plans.map((plan, index) => {
              const features = Array.isArray(plan.features) ? plan.features : [];
              const isCurrentPlan = subscription?.plan_id === plan.id && isActive;
              const isPro = plan.name.toLowerCase() === 'pro';
              const isEnterprise = plan.name.toLowerCase() === 'enterprise';

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative h-full flex flex-col ${isPro ? 'border-primary ring-1 ring-primary/20' : ''} ${isEnterprise ? 'border-accent/50 ring-1 ring-accent/20' : ''} ${isCurrentPlan ? 'border-green-500' : ''}`}>
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground gap-1">
                          <Zap className="w-3 h-3" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pt-6">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {plan.description && <CardDescription>{plan.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="mb-4">
                        {isEnterprise ? (
                          <>
                            <span className="text-4xl font-bold">Custom</span>
                            <span className="text-muted-foreground block text-sm mt-1">Tailored to your needs</span>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl font-bold">${plan.price_monthly}</span>
                            <span className="text-muted-foreground">/month</span>
                          </>
                        )}
                      </div>
                      {!isEnterprise && plan.trial_days > 0 && (
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30 mb-4 w-fit">
                          {plan.trial_days}-day free trial
                        </Badge>
                      )}
                      {features.length > 0 && (
                        <ul className="space-y-2 mb-6 flex-1">
                          {features.map((f: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-400 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      {isCurrentPlan ? (
                        <Button disabled className="w-full mt-auto">Current Plan</Button>
                      ) : isEnterprise ? (
                        <Button
                          variant="heroOutline"
                          className="w-full mt-auto"
                          onClick={() => window.open('https://wa.me/+1234567890?text=Hi%2C%20I%27m%20interested%20in%20the%20SocialGenie%20Enterprise%20plan', '_blank')}
                        >
                          Contact Us
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSubscribe(plan)}
                          disabled={payingForPlan === plan.id}
                          variant={isPro ? 'default' : 'outline'}
                          className="w-full mt-auto"
                        >
                          {payingForPlan === plan.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Subscribe Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {plans.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-8">No plans available yet.</p>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).FlutterwaveCheckout) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave'));
    document.head.appendChild(script);
  });
}
