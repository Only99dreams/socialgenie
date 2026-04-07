import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsSummary {
  totalImpressions: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalClicks: number;
  totalSaves: number;
  avgEngagementRate: number;
  dailyMetrics: Array<{
    date: string;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  }>;
  platformBreakdown: Array<{
    platform: string;
    posts: number;
    totalEngagement: number;
  }>;
  topPosts: Array<{
    id: string;
    platform: string;
    content: string;
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: number;
  }>;
  aiMetrics: {
    postsGenerated: number;
    postsPublished: number;
    avgEngagement: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    // Get business for this user
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return new Response(JSON.stringify({ error: 'No business found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch analytics data
    const { data: analytics } = await supabase
      .from('post_analytics')
      .select('*, posts!inner(platform, content, ai_generated)')
      .eq('business_id', business.id)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true });

    // Fetch post counts
    const { data: allPosts } = await supabase
      .from('posts')
      .select('id, platform, status, ai_generated, content')
      .eq('business_id', business.id);

    const postsGenerated = allPosts?.filter(p => p.ai_generated).length || 0;
    const postsPublished = allPosts?.filter(p => p.status === 'published').length || 0;

    // Aggregate daily metrics
    const dailyMap = new Map<string, { likes: number; comments: number; shares: number; reach: number }>();
    const platformMap = new Map<string, { posts: number; totalEngagement: number }>();

    let totalImpressions = 0, totalReach = 0, totalLikes = 0, totalComments = 0;
    let totalShares = 0, totalClicks = 0, totalSaves = 0;
    let engagementSum = 0;

    for (const a of analytics || []) {
      const day = a.recorded_at.split('T')[0];
      const existing = dailyMap.get(day) || { likes: 0, comments: 0, shares: 0, reach: 0 };
      existing.likes += a.likes;
      existing.comments += a.comments;
      existing.shares += a.shares;
      existing.reach += a.reach;
      dailyMap.set(day, existing);

      const platform = (a as any).posts?.platform || 'unknown';
      const platData = platformMap.get(platform) || { posts: 0, totalEngagement: 0 };
      platData.posts += 1;
      platData.totalEngagement += a.likes + a.comments + a.shares;
      platformMap.set(platform, platData);

      totalImpressions += a.impressions;
      totalReach += a.reach;
      totalLikes += a.likes;
      totalComments += a.comments;
      totalShares += a.shares;
      totalClicks += a.clicks;
      totalSaves += a.saves;
      engagementSum += Number(a.engagement_rate || 0);
    }

    const avgEngagementRate = analytics?.length ? engagementSum / analytics.length : 0;

    // Top posts by engagement
    const topPosts = (analytics || [])
      .map(a => ({
        id: a.post_id,
        platform: (a as any).posts?.platform || 'unknown',
        content: (a as any).posts?.content || '',
        likes: a.likes,
        comments: a.comments,
        shares: a.shares,
        engagement_rate: Number(a.engagement_rate || 0),
      }))
      .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
      .slice(0, 5);

    const summary: AnalyticsSummary = {
      totalImpressions,
      totalReach,
      totalLikes,
      totalComments,
      totalShares,
      totalClicks,
      totalSaves,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      dailyMetrics: Array.from(dailyMap.entries()).map(([date, m]) => ({ date, ...m })),
      platformBreakdown: Array.from(platformMap.entries()).map(([platform, d]) => ({ platform, ...d })),
      topPosts,
      aiMetrics: {
        postsGenerated,
        postsPublished,
        avgEngagement: Math.round(avgEngagementRate * 100) / 100,
      },
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Analytics error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
