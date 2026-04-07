import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BusinessSetupStep } from "@/components/onboarding/BusinessSetupStep";
import { SocialConnectionsStep } from "@/components/onboarding/SocialConnectionsStep";
import { AgentModeStep } from "@/components/onboarding/AgentModeStep";

export type OnboardingData = {
  businessName: string;
  websiteUrl: string;
  brandTone: string;
  brandKeywords: string[];
  connectedPlatforms: string[];
  agentMode: "autopilot" | "review";
  postsPerDay: number;
  needsWebsite?: boolean;
  businessDescription?: string;
  businessPhone?: string;
};

const steps = [
  { id: 1, name: "Business Setup", description: "Tell us about your business" },
  { id: 2, name: "Connect Platforms", description: "Link your social accounts" },
  { id: 3, name: "Agent Mode", description: "Choose how your AI operates" },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    websiteUrl: "",
    brandTone: "professional",
    brandKeywords: [],
    connectedPlatforms: [],
    agentMode: "review",
    postsPerDay: 1,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/signup");
      }
    };
    checkAuth();
  }, [navigate]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleBusinessSetup = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: business, error } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: data.businessName,
          website_url: data.websiteUrl,
          brand_tone: data.brandTone as any,
          brand_keywords: data.brandKeywords,
        })
        .select()
        .single();

      if (error) throw error;
      
      setBusinessId(business.id);
      setCurrentStep(2);
      
      toast({
        title: "Business profile created!",
        description: "Now let's connect your social accounts.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save business info",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialConnections = () => {
    setCurrentStep(3);
  };

  const handleComplete = async () => {
    if (!businessId) return;
    
    setIsLoading(true);
    try {
      // Create AI agent
      const { error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          business_id: businessId,
          mode: data.agentMode as any,
          status: "learning",
        });

      if (agentError) throw agentError;

      toast({
        title: "🚀 AI Agent Activated!",
        description: "Your agent is now learning about your business.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to activate agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <span className="font-display text-xl font-bold">SocialGenie</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep > step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "bg-gradient-to-br from-primary to-accent text-foreground glow"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block h-0.5 w-24 lg:w-32 mx-4 ${
                      currentStep > step.id ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <BusinessSetupStep
                data={data}
                updateData={updateData}
                onNext={handleBusinessSetup}
                isLoading={isLoading}
              />
            )}
            {currentStep === 2 && businessId && (
              <SocialConnectionsStep
                data={data}
                updateData={updateData}
                businessId={businessId}
                onNext={handleSocialConnections}
                onBack={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 3 && (
              <AgentModeStep
                data={data}
                updateData={updateData}
                onComplete={handleComplete}
                onBack={() => setCurrentStep(2)}
                isLoading={isLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
