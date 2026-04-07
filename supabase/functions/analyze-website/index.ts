import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl } = await req.json();
    
    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Website URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!firecrawlKey || !lovableKey) {
      console.error('Missing API keys');
      return new Response(
        JSON.stringify({ success: false, error: 'API configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping website:', formattedUrl);

    // Step 1: Crawl website with Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'branding'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape website' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || '';
    const branding = scrapeData.data?.branding || {};
    const metadata = scrapeData.data?.metadata || {};

    console.log('Website scraped, analyzing with AI...');

    // Step 2: Analyze with AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a business intelligence analyst. Analyze the website content and extract key business information. Return a JSON object with the following structure:
{
  "industry": "string - the primary industry/sector",
  "products": ["array of main products or services offered"],
  "targetAudience": "string - who the business targets",
  "brandVoice": {
    "tone": "professional | friendly | luxury | playful | bold | minimal",
    "keywords": ["array of 5-10 brand-related keywords"],
    "uniqueSellingPoints": ["array of 2-3 key differentiators"]
  },
  "contentThemes": ["array of 5-7 content themes for social media"],
  "competitors": ["array of likely competitor types or industries"],
  "summary": "1-2 sentence business summary"
}`
          },
          {
            role: 'user',
            content: `Analyze this website content and extract business intelligence:\n\nWebsite: ${formattedUrl}\nTitle: ${metadata.title || 'Unknown'}\nDescription: ${metadata.description || 'None'}\n\nContent:\n${markdown.substring(0, 8000)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_business_profile',
              description: 'Extract structured business profile from website analysis',
              parameters: {
                type: 'object',
                properties: {
                  industry: { type: 'string' },
                  products: { type: 'array', items: { type: 'string' } },
                  targetAudience: { type: 'string' },
                  brandVoice: {
                    type: 'object',
                    properties: {
                      tone: { type: 'string', enum: ['professional', 'friendly', 'luxury', 'playful', 'bold', 'minimal'] },
                      keywords: { type: 'array', items: { type: 'string' } },
                      uniqueSellingPoints: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['tone', 'keywords', 'uniqueSellingPoints']
                  },
                  contentThemes: { type: 'array', items: { type: 'string' } },
                  competitors: { type: 'array', items: { type: 'string' } },
                  summary: { type: 'string' }
                },
                required: ['industry', 'products', 'targetAudience', 'brandVoice', 'contentThemes', 'summary']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_business_profile' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let businessProfile;
    if (toolCall?.function?.arguments) {
      businessProfile = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback if tool call didn't work
      businessProfile = {
        industry: 'Unknown',
        products: [],
        targetAudience: 'General audience',
        brandVoice: {
          tone: 'professional',
          keywords: [],
          uniqueSellingPoints: []
        },
        contentThemes: [],
        competitors: [],
        summary: 'Unable to analyze website content'
      };
    }

    // Add branding colors if available
    businessProfile.branding = branding;

    console.log('Analysis complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: businessProfile,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          sourceUrl: formattedUrl
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing website:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
