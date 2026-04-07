import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { OnboardingData } from "@/pages/Onboarding";

const platforms = [
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    color: "from-pink-500 to-purple-500",
    description: "Visual storytelling",
    requiresCredentials: ["META_APP_ID", "META_APP_SECRET"],
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "👥",
    color: "from-blue-600 to-blue-400",
    description: "Community building",
    requiresCredentials: ["META_APP_ID", "META_APP_SECRET"],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: "🐦",
    color: "from-gray-800 to-gray-600",
    description: "Real-time engagement",
    requiresCredentials: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "from-blue-700 to-blue-500",
    description: "Professional networking",
    requiresCredentials: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    color: "from-pink-600 via-purple-500 to-cyan-400",
    description: "Short-form video",
    requiresCredentials: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  },
];

type Props = {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  businessId: string;
  onNext: () => void;
  onBack: () => void;
};

export const SocialConnectionsStep = ({ data, updateData, businessId, onNext, onBack }: Props) => {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [platformErrors, setPlatformErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    setPlatformErrors((prev) => ({ ...prev, [platformId]: "" }));

    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;

      // Call the OAuth edge function to get the authorization URL
      const { data: authData, error } = await supabase.functions.invoke("oauth-callback", {
        body: {
          action: "authorize",
          platform: platformId,
          businessId,
          redirectUri,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!authData?.success) {
        // Check if it's a configuration error
        if (authData?.error?.includes("not configured") || authData?.error?.includes("Missing")) {
          const platform = platforms.find((p) => p.id === platformId);
          setPlatformErrors((prev) => ({
            ...prev,
            [platformId]: `OAuth not configured. Required: ${platform?.requiresCredentials?.join(", ")}`,
          }));
          throw new Error(authData.error);
        }
        throw new Error(authData?.error || "Failed to get authorization URL");
      }

      // Redirect to the OAuth authorization page
      window.location.href = authData.authUrl;
    } catch (error: unknown) {
      console.error("OAuth error:", error);
      const errorMessage = error instanceof Error ? error.message : "Connection failed";
      
      // Don't show toast if we already set a platform-specific error
      if (!platformErrors[platformId]) {
        toast({
          title: "Connection failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleSimulatedConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);

    // Fallback to simulated connection when OAuth isn't configured
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { error } = await supabase.from("social_connections").insert({
        business_id: businessId,
        platform: platformId as "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok",
        is_connected: true,
        account_name: `@${data.businessName.toLowerCase().replace(/\s+/g, "")}`,
      });

      if (error) throw error;

      updateData({ connectedPlatforms: [...data.connectedPlatforms, platformId] });

      toast({
        title: `${platforms.find((p) => p.id === platformId)?.name} connected!`,
        description: "Your account has been successfully linked (demo mode).",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again";
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const isConnected = (platformId: string) => data.connectedPlatforms.includes(platformId);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center text-3xl">
          🔗
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Connect your platforms</h1>
        <p className="text-muted-foreground">
          Link your social media accounts so your AI agent can publish content automatically.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`p-4 rounded-2xl border transition-all ${
              isConnected(platform.id)
                ? "border-primary bg-primary/5"
                : "border-border card-gradient"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl`}
                >
                  {platform.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                  {platformErrors[platform.id] && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                      <AlertCircle className="w-3 h-3" />
                      <span>{platformErrors[platform.id]}</span>
                    </div>
                  )}
                </div>
              </div>

              {isConnected(platform.id) ? (
                <div className="flex items-center gap-2 text-primary">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  {platformErrors[platform.id] ? (
                    <Button
                      onClick={() => handleSimulatedConnect(platform.id)}
                      variant="secondary"
                      disabled={connectingPlatform !== null}
                      size="sm"
                    >
                      Demo Connect
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => handleConnect(platform.id)}
                    variant="outline"
                    disabled={connectingPlatform !== null}
                    className="min-w-[120px]"
                  >
                    {connectingPlatform === platform.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-muted/50 border border-border mb-8">
        <p className="text-sm text-muted-foreground text-center">
          <strong>Note:</strong> Real OAuth requires platform developer credentials. 
          Contact your admin to configure META_APP_ID, TWITTER_CLIENT_ID, etc. 
          Demo mode is available for testing.
        </p>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="ghost" size="lg">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          variant="hero"
          size="lg"
          className="min-w-[200px]"
        >
          {data.connectedPlatforms.length === 0 ? "Skip for now" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
