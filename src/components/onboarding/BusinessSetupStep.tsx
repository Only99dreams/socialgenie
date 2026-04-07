import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Globe, 
  Building2, 
  Sparkles, 
  X, 
  Loader2,
  ArrowRight,
  FileText
} from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";

const tones = [
  { value: "professional", label: "Professional", emoji: "💼", description: "Corporate, trustworthy" },
  { value: "friendly", label: "Friendly", emoji: "😊", description: "Warm, approachable" },
  { value: "luxury", label: "Luxury", emoji: "✨", description: "Premium, exclusive" },
  { value: "playful", label: "Playful", emoji: "🎉", description: "Fun, energetic" },
  { value: "bold", label: "Bold", emoji: "🔥", description: "Confident, impactful" },
  { value: "minimal", label: "Minimal", emoji: "🎯", description: "Clean, focused" },
];

type Props = {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  isLoading: boolean;
};

export const BusinessSetupStep = ({ data, updateData, onNext, isLoading }: Props) => {
  const [keyword, setKeyword] = useState("");
  const [noWebsite, setNoWebsite] = useState(false);
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");

  const addKeyword = () => {
    if (keyword.trim() && !data.brandKeywords.includes(keyword.trim())) {
      updateData({ brandKeywords: [...data.brandKeywords, keyword.trim()] });
      setKeyword("");
    }
  };

  const removeKeyword = (k: string) => {
    updateData({ brandKeywords: data.brandKeywords.filter((kw) => kw !== k) });
  };

  const isValid = data.businessName.trim().length > 0 && (
    noWebsite
      ? businessDescription.trim().length > 0
      : data.websiteUrl.trim().length > 0
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Tell us about your business</h1>
        <p className="text-muted-foreground">
          Your AI agent will learn everything from your website to create perfect content.
        </p>
      </div>

      <div className="space-y-6 card-gradient rounded-2xl p-6 border border-border">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName" className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Business Name
          </Label>
          <Input
            id="businessName"
            placeholder="e.g. Acme Corp"
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
            className="h-12"
            maxLength={100}
          />
        </div>

        {/* Website URL or No Website Form */}
        {!noWebsite ? (
          <div className="space-y-2">
            <Label htmlFor="websiteUrl" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Website URL
            </Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://yourwebsite.com"
              value={data.websiteUrl}
              onChange={(e) => updateData({ websiteUrl: e.target.value })}
              className="h-12"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Your AI will crawl this to understand your business, products, and brand voice.
            </p>
            <a
              href="https://wa.me/2347030553134?text=Hi%2C%20I%20need%20a%20website%20for%20my%20business.%20Can%20you%20help%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              I don't have a website — help me build one
            </a>
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Tell us about your business
              </Label>
              <button
                type="button"
                onClick={() => setNoWebsite(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                I have a website
              </button>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              We'll use this info to build a website for you and train your AI agent.
            </p>
            <Textarea
              placeholder="Describe what your business does, who your customers are, and what products/services you offer..."
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              className="min-h-[100px]"
              maxLength={1000}
            />
            <div className="space-y-2">
              <Label htmlFor="businessPhone" className="text-xs">
                Phone / WhatsApp (optional)
              </Label>
              <Input
                id="businessPhone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="h-10"
                maxLength={20}
              />
            </div>
          </div>
        )}

        {/* Brand Tone */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Brand Tone
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tones.map((tone) => (
              <button
                key={tone.value}
                onClick={() => updateData({ brandTone: tone.value })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  data.brandTone === tone.value
                    ? "border-primary bg-primary/10 glow"
                    : "border-border hover:border-primary/50 bg-secondary/50"
                }`}
              >
                <span className="text-2xl mb-2 block">{tone.emoji}</span>
                <span className="font-medium block">{tone.label}</span>
                <span className="text-xs text-muted-foreground">{tone.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Brand Keywords */}
        <div className="space-y-3">
          <Label htmlFor="keywords">Brand Keywords (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="keywords"
              placeholder="e.g. innovative, eco-friendly"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              className="h-12"
              maxLength={50}
            />
            <Button type="button" onClick={addKeyword} variant="secondary" className="h-12 px-6">
              Add
            </Button>
          </div>
          {data.brandKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.brandKeywords.map((k) => (
                <Badge key={k} variant="secondary" className="px-3 py-1">
                  {k}
                  <button onClick={() => removeKeyword(k)} className="ml-2 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={onNext}
          variant="hero"
          size="lg"
          disabled={!isValid || isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
