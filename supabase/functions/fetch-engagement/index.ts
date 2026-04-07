import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostWithConnection {
  post_id: string;
  business_id: string;
  platform: string;
  access_token: string;
  account_id: string | null;
  published_post_id?: string;
}

// Fetch Twitter/X engagement metrics
async function fetchTwitterMetrics(accessToken: string, tweetId: string): Promise<{ impressions: number; likes: number; comments: number; shares: number; clicks: number }> {
  try {
    const response = await fetch(
      `https://api.x.com/2/tweets/${tweetId}?tweet.fields=public_metrics,organic_metrics`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Twitter metrics error [${response.status}]:`, errText);
      return { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
    }

    const data = await response.json();
    const metrics = data.data?.public_metrics || {};

    return {
      impressions: metrics.impression_count || 0,
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count + (metrics.quote_count || 0),
      clicks: 0, // Not available in basic public metrics
    };
  } catch (e) {
    console.error('Twitter metrics fetch failed:', e);
    return { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
  }
}

// Fetch Facebook engagement metrics
async function fetchFacebookMetrics(accessToken: string, postId: string): Promise<{ impressions: number; reach: number; likes: number; comments: number; shares: number; clicks: number }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?fields=insights.metric(post_impressions,post_impressions_unique,post_clicks,post_reactions_by_type_total),comments.summary(true),shares&access_token=${accessToken}`
    );

    if (!response.ok) {
      // Fallback to basic metrics
      const basicResponse = await fetch(
        `https://graph.facebook.com/v18.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`
      );

      if (!basicResponse.ok) {
        const errText = await basicResponse.text();
        console.error(`Facebook basic metrics error [${basicResponse.status}]:`, errText);
        return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
      }

      const basicData = await basicResponse.json();
      return {
        impressions: 0,
        reach: 0,
        likes: basicData.likes?.summary?.total_count || 0,
        comments: basicData.comments?.summary?.total_count || 0,
        shares: basicData.shares?.count || 0,
        clicks: 0,
      };
    }

    const data = await response.json();
    const insights = data.insights?.data || [];

    const getInsightValue = (name: string) => {
      const insight = insights.find((i: { name: string }) => i.name === name);
      return insight?.values?.[0]?.value || 0;
    };

    return {
      impressions: getInsightValue('post_impressions'),
      reach: getInsightValue('post_impressions_unique'),
      likes: Object.values(getInsightValue('post_reactions_by_type_total') || {}).reduce((a: number, b) => a + (b as number), 0) as number,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      clicks: getInsightValue('post_clicks'),
    };
  } catch (e) {
    console.error('Facebook metrics fetch failed:', e);
    return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
  }
}

// Fetch Instagram engagement metrics
async function fetchInstagramMetrics(accessToken: string, mediaId: string): Promise<{ impressions: number; reach: number; likes: number; comments: number; saves: number }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=impressions,reach,saved&access_token=${accessToken}`
    );

    const basicResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}?fields=like_count,comments_count&access_token=${accessToken}`
    );

    let impressions = 0, reach = 0, saves = 0, likes = 0, comments = 0;

    if (response.ok) {
      const data = await response.json();
      const insightsData = data.data || [];
      for (const insight of insightsData) {
        if (insight.name === 'impressions') impressions = insight.values?.[0]?.value || 0;
        if (insight.name === 'reach') reach = insight.values?.[0]?.value || 0;
        if (insight.name === 'saved') saves = insight.values?.[0]?.value || 0;
      }
    } else {
      const errText = await response.text();
      console.error(`Instagram insights error [${response.status}]:`, errText);
    }

    if (basicResponse.ok) {
      const basicData = await basicResponse.json();
      likes = basicData.like_count || 0;
      comments = basicData.comments_count || 0;
    } else {
      const errText = await basicResponse.text();
      console.error(`Instagram basic metrics error [${basicResponse.status}]:`, errText);
    }

    return { impressions, reach, likes, comments, saves };
  } catch (e) {
    console.error('Instagram metrics fetch failed:', e);
    return { impressions: 0, reach: 0, likes: 0, comments: 0, saves: 0 };
  }
}

// Fetch LinkedIn engagement metrics
async function fetchLinkedInMetrics(accessToken: string, postUrn: string): Promise<{ impressions: number; likes: number; comments: number; shares: number; clicks: number }> {
  try {
    const encodedUrn = encodeURIComponent(postUrn);
    const response = await fetch(
      `https://api.linkedin.com/v2/socialActions/${encodedUrn}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`LinkedIn metrics error [${response.status}]:`, errText);
      return { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
    }

    const data = await response.json();

    return {
      impressions: 0, // Requires organization analytics API
      likes: data.likesSummary?.totalLikes || 0,
      comments: data.commentsSummary?.totalFirstLevelComments || 0,
      shares: data.sharesSummary?.totalShares || 0,
      clicks: 0,
    };
  } catch (e) {
    console.error('LinkedIn metrics fetch failed:', e);
    return { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Fetching engagement metrics for published posts...');

    // Get all published posts that have analytics records
    const { data: analyticsRecords, error: fetchError } = await supabase
      .from('post_analytics')
      .select('id, post_id, business_id')
      .order('updated_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch analytics records: ${fetchError.message}`);
    }

    if (!analyticsRecords || analyticsRecords.length === 0) {
      console.log('No analytics records to update');
      return new Response(
        JSON.stringify({ success: true, message: 'No records to update', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique business IDs
    const businessIds = [...new Set(analyticsRecords.map(r => r.business_id))];

    // Fetch connections for all businesses
    const { data: connections } = await supabase
      .from('social_connections')
      .select('business_id, platform, access_token, account_id')
      .in('business_id', businessIds)
      .eq('is_connected', true);

    // Fetch post details
    const postIds = analyticsRecords.map(r => r.post_id);
    const { data: posts } = await supabase
      .from('posts')
      .select('id, platform, business_id, status')
      .in('id', postIds)
      .eq('status', 'published');

    if (!posts || posts.length === 0) {
      console.log('No published posts found');
      return new Response(
        JSON.stringify({ success: true, message: 'No published posts', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updated = 0;
    let failed = 0;

    for (const post of posts) {
      const connection = connections?.find(
        c => c.business_id === post.business_id && c.platform === post.platform
      );

      if (!connection || !connection.access_token) {
        console.log(`No connection for post ${post.id} on ${post.platform}`);
        continue;
      }

      const analyticsRecord = analyticsRecords.find(r => r.post_id === post.id);
      if (!analyticsRecord) continue;

      let metrics: {
        impressions?: number;
        reach?: number;
        likes?: number;
        comments?: number;
        shares?: number;
        clicks?: number;
        saves?: number;
      } = {};

      try {
        switch (post.platform) {
          case 'twitter':
            // For Twitter, we'd need the tweet ID stored somewhere
            // For now use the post ID as placeholder
            metrics = await fetchTwitterMetrics(connection.access_token, post.id);
            break;
          case 'facebook':
            metrics = await fetchFacebookMetrics(connection.access_token, post.id);
            break;
          case 'instagram':
            metrics = await fetchInstagramMetrics(connection.access_token, post.id);
            break;
          case 'linkedin':
            metrics = await fetchLinkedInMetrics(connection.access_token, post.id);
            break;
          default:
            console.log(`Unsupported platform for metrics: ${post.platform}`);
            continue;
        }

        // Calculate engagement rate
        const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
        const engagementRate = metrics.impressions && metrics.impressions > 0
          ? Math.round((totalEngagement / metrics.impressions) * 10000) / 100
          : 0;

        // Update analytics record
        const { error: updateError } = await supabase
          .from('post_analytics')
          .update({
            impressions: metrics.impressions || 0,
            reach: metrics.reach || 0,
            likes: metrics.likes || 0,
            comments: metrics.comments || 0,
            shares: metrics.shares || 0,
            clicks: metrics.clicks || 0,
            saves: metrics.saves || 0,
            engagement_rate: engagementRate,
          })
          .eq('id', analyticsRecord.id);

        if (updateError) {
          console.error(`Failed to update analytics for post ${post.id}:`, updateError);
          failed++;
        } else {
          updated++;
          console.log(`Updated metrics for post ${post.id}: ${JSON.stringify(metrics)}`);
        }
      } catch (e) {
        console.error(`Error fetching metrics for post ${post.id}:`, e);
        failed++;
      }
    }

    console.log(`Engagement fetch complete: ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, updated, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Engagement fetch error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
