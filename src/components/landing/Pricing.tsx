import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Loader2, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  features: any;
  trial_days: number;
}

export const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('id, name, description, price_monthly, features, trial_days')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setPlans((data as any) || []);
        setLoading(false);
      });
  }, []);

  return (
    <section id="pricing" className="py-16 sm:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-primary font-medium mb-2 block text-sm sm:text-base">Pricing</span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
            Choose the plan that fits your business. All plans include a 7-day free trial.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 sm:gap-8 max-w-7xl mx-auto ${
            plans.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {plans.map((plan, index) => {
              const features = Array.isArray(plan.features) ? plan.features : [];
              const isPro = plan.name.toLowerCase() === 'pro';
              const isEnterprise = plan.name.toLowerCase() === 'enterprise';

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative p-6 sm:p-8 rounded-2xl border ${
                    isPro
                      ? "border-primary bg-gradient-to-b from-primary/10 to-transparent glow"
                      : isEnterprise
                      ? "border-accent bg-gradient-to-b from-accent/10 to-transparent"
                      : "border-border card-gradient"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium">
                        <Zap className="w-4 h-4" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  {isEnterprise && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent to-primary text-primary-foreground text-sm font-medium">
                        <Crown className="w-4 h-4" />
                        Custom
                      </div>
                    </div>
                  )}

                  <div className="mb-4 sm:mb-6">
                    <h3 className="font-display text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-muted-foreground text-xs sm:text-sm">{plan.description}</p>
                    )}
                  </div>

                  <div className="mb-4 sm:mb-6">
                    {isEnterprise ? (
                      <span className="font-display text-3xl sm:text-4xl font-bold">Custom</span>
                    ) : (
                      <>
                        <span className="font-display text-4xl sm:text-5xl font-bold">${plan.price_monthly}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                    {features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-center gap-2.5 sm:gap-3">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isEnterprise ? (
                    <a
                      href="https://wa.me/2347030553134?text=Hi%2C%20I%27m%20interested%20in%20the%20SocialGenie%20Enterprise%20plan.%20I%27d%20like%20to%20discuss%20custom%20pricing."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full" size="lg">
                        Contact Us
                      </Button>
                    </a>
                  ) : (
                    <Link to="/signup" className="block">
                      <Button
                        variant={isPro ? "hero" : "outline"}
                        className="w-full"
                        size="lg"
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
