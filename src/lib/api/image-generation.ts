import { supabase } from '@/integrations/supabase/client';

export interface RegenerateImageParams {
  imagePrompt: string;
  businessId?: string;
}

export async function regenerateImage({
  imagePrompt,
  businessId,
}: RegenerateImageParams): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { imagePrompt, businessId },
    });

    if (error) {
      console.error('Error calling generate-image:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Regenerate image error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to regenerate image' 
    };
  }
}
