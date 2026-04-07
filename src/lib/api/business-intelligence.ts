import { supabase } from '@/integrations/supabase/client';

export interface BusinessProfile {
  industry: string;
  products: string[];
  targetAudience: string;
  brandVoice: {
    tone: 'professional' | 'friendly' | 'luxury' | 'playful' | 'bold' | 'minimal';
    keywords: string[];
    uniqueSellingPoints: string[];
  };
  contentThemes: string[];
  competitors: string[];
  summary: string;
  branding?: {
    colors?: Record<string, string>;
    logo?: string;
  };
}

export interface GeneratedPost {
  content: string;
  hashtags: string[];
  imagePrompt?: string;
  imageUrl?: string;
  bestTimeToPost?: string;
  platform: string;
  generatedAt: string;
}

export async function analyzeWebsite(websiteUrl: string): Promise<{ 
  success: boolean; 
  data?: BusinessProfile; 
  error?: string;
  metadata?: { title?: string; description?: string; sourceUrl?: string };
}> {
  const { data, error } = await supabase.functions.invoke('analyze-website', {
    body: { websiteUrl }
  });

  if (error) {
    console.error('Error calling analyze-website:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function generateContent({
  businessProfile,
  platform,
  contentType,
  topic,
  generateWithImage = false,
  businessId
}: {
  businessProfile: BusinessProfile;
  platform: string;
  contentType?: string;
  topic?: string;
  generateWithImage?: boolean;
  businessId?: string;
}): Promise<{
  success: boolean;
  data?: GeneratedPost;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: { businessProfile, platform, contentType, topic, generateWithImage, businessId }
  });

  if (error) {
    console.error('Error calling generate-content:', error);
    return { success: false, error: error.message };
  }

  return data;
}
