import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Comment {
  platform_comment_id: string;
  platform_post_id: string;
  author_name: string;
  author_username: string;
  content: string;
  commented_at: string;
}

// Fetch comments from Instagram/Facebook via Graph API
async function fetchInstagramComments(accessToken: string, accountId: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  try {
    // Get recent media
    const mediaRes = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media?fields=id,comments{id,text,timestamp,from{id,username}}&limit=10&access_token=${accessToken}`
    );
    if (!mediaRes.ok) return comments;
    const mediaData = await mediaRes.json();

    for (const media of mediaData.data || []) {
      for (const comment of media.comments?.data || []) {
        comments.push({
          platform_comment_id: comment.id,
          platform_post_id: media.id,
          author_name: comment.from?.username || 'Unknown',
          author_username: comment.from?.username || '',
          content: comment.text,
          commented_at: comment.timestamp,
        });
      }
    }
  } catch (e) {
    console.error('Error fetching Instagram comments:', e);
  }
  return comments;
}

// Fetch comments from Facebook pages
async function fetchFacebookComments(accessToken: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  try {
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    if (!pagesRes.ok) return comments;
    const pagesData = await pagesRes.json();

    for (const page of pagesData.data || []) {
      const postsRes = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}/posts?fields=id,comments{id,message,created_time,from{id,name}}&limit=5&access_token=${page.access_token}`
      );
      if (!postsRes.ok) continue;
      const postsData = await postsRes.json();

      for (const post of postsData.data || []) {
        for (const comment of post.comments?.data || []) {
          comments.push({
            platform_comment_id: comment.id,
            platform_post_id: post.id,
            author_name: comment.from?.name || 'Unknown',
            author_username: comment.from?.id || '',
            content: comment.message,
            commented_at: comment.created_time,
          });
        }
      }
    }
  } catch (e) {
    console.error('Error fetching Facebook comments:', e);
  }
  return comments;
}

// Fetch mentions/replies from Twitter
async function fetchTwitterComments(accessToken: string, accountId: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  try {
    const res = await fetch(
      `https://api.x.com/2/users/${accountId}/mentions?tweet.fields=created_at,author_id&expansions=author_id&user.fields=name,username&max_results=20`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!res.ok) return comments;
    const data = await res.json();
    const users = new Map((data.includes?.users || []).map((u: any) => [u.id, u]));

    for (const tweet of data.data || []) {
      const user = users.get(tweet.author_id);
      comments.push({
        platform_comment_id: tweet.id,
        platform_post_id: '',
        author_name: user?.name || 'Unknown',
        author_username: user?.username || '',
        content: tweet.text,
        commented_at: tweet.created_at,
      });
    }
  } catch (e) {
    console.error('Error fetching Twitter mentions:', e);
  }
  return comments;
}

// Fetch LinkedIn comments
async function fetchLinkedInComments(accessToken: string, accountId: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  try {
    const urn = `urn:li:person:${accountId}`;
    const res = await fetch(
      `https://api.linkedin.com/v2/socialActions/${urn}/comments?count=20`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    if (!res.ok) return comments;
    const data = await res.json();

    for (const comment of data.elements || []) {
      comments.push({
        platform_comment_id: comment['$URN'] || comment.id || `li-${Date.now()}`,
        platform_post_id: '',
        author_name: comment.actor?.name || 'LinkedIn User',
        author_username: '',
        content: comment.message?.text || '',
        commented_at: new Date(comment.created?.time || Date.now()).toISOString(),
      });
    }
  } catch (e) {
    console.error('Error fetching LinkedIn comments:', e);
  }
  return comments;
}

// Fetch TikTok comments
async function fetchTikTokComments(accessToken: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  try {
    // Get user's videos first
    const videosRes = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: 10 }),
      }
    );
    if (!videosRes.ok) return comments;
    const videosData = await videosRes.json();

    for (const video of videosData.data?.videos || []) {
      // Fetch comments for each video
      const commentsRes = await fetch(
        `https://open.tiktokapis.com/v2/comment/list/?fields=id,text,create_time,user_display_name,user_id&video_id=${video.id}&max_count=20`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!commentsRes.ok) continue;
      const commentsData = await commentsRes.json();

      for (const comment of commentsData.data?.comments || []) {
        comments.push({
          platform_comment_id: comment.id,
          platform_post_id: video.id,
          author_name: comment.user_display_name || 'TikTok User',
          author_username: comment.user_id || '',
          content: comment.text,
          commented_at: new Date((comment.create_time || 0) * 1000).toISOString(),
        });
      }
    }
  } catch (e) {
    console.error('Error fetching TikTok comments:', e);
  }
  return comments;
}

// Post reply to TikTok comment
async function postReplyToTikTok(accessToken: string, commentId: string, videoId: string, message: string): Promise<boolean> {
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/comment/reply/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_id: videoId,
        comment_id: commentId,
        text: message,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('Error replying to TikTok comment:', e);
    return false;
  }
}

// Generate AI response using Lovable AI
async function generateAIResponse(
  commentText: string,
  platform: string,
  brandVoice: string,
  brandKeywords: string[]
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are a social media community manager. Generate a brief, authentic reply to a comment on ${platform}. 
Brand voice: ${brandVoice}. Key themes: ${brandKeywords.join(', ')}.
Rules:
- Keep it concise (1-3 sentences max)
- Be warm, professional, and on-brand
- Don't use excessive emojis
- Don't be generic — reference something specific from the comment
- Match the platform's tone (casual for Instagram/TikTok, professional for LinkedIn)
- Never include hashtags in replies`,
        },
        {
          role: 'user',
          content: `Comment: "${commentText}"\n\nGenerate a reply:`,
        },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Rate limit exceeded');
    if (response.status === 402) throw new Error('Payment required');
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Thank you for your comment!';
}

// Post reply to a platform
async function postReplyToInstagram(accessToken: string, commentId: string, message: string): Promise<boolean> {
  const res = await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ message, access_token: accessToken }).toString(),
  });
  return res.ok;
}

async function postReplyToFacebook(accessToken: string, commentId: string, message: string): Promise<boolean> {
  const res = await fetch(`https://graph.facebook.com/v18.0/${commentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ message, access_token: accessToken }).toString(),
  });
  return res.ok;
}

async function postReplyToTwitter(accessToken: string, tweetId: string, message: string): Promise<boolean> {
  const res = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: message, reply: { in_reply_to_tweet_id: tweetId } }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, businessId, commentResponseId } = await req.json();

    // ACTION: fetch - Fetch new comments from all connected platforms
    if (action === 'fetch') {
      if (!businessId) throw new Error('businessId required');

      const { data: connections } = await supabase
        .from('social_connections')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_connected', true);

      if (!connections?.length) {
        return new Response(
          JSON.stringify({ success: true, message: 'No connected platforms', fetched: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get business profile for AI generation
      const { data: business } = await supabase
        .from('businesses')
        .select('brand_tone, brand_keywords')
        .eq('id', businessId)
        .single();

      const brandVoice = business?.brand_tone || 'professional';
      const brandKeywords = business?.brand_keywords || [];

      // Get comment settings
      const { data: settings } = await supabase
        .from('comment_settings')
        .select('response_mode')
        .eq('business_id', businessId)
        .single();

      const responseMode = settings?.response_mode || 'review';

      let totalFetched = 0;

      for (const conn of connections) {
        let platformComments: Comment[] = [];

        switch (conn.platform) {
          case 'instagram': {
            // Get IG account ID
            const acctRes = await fetch(
              `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=${conn.access_token}`
            );
            if (acctRes.ok) {
              const acctData = await acctRes.json();
              const igAcct = acctData.data?.find((p: any) => p.instagram_business_account);
              if (igAcct?.instagram_business_account?.id) {
                platformComments = await fetchInstagramComments(conn.access_token!, igAcct.instagram_business_account.id);
              }
            }
            break;
          }
          case 'facebook':
            platformComments = await fetchFacebookComments(conn.access_token!);
            break;
          case 'twitter':
            platformComments = await fetchTwitterComments(conn.access_token!, conn.account_id || '');
            break;
          case 'linkedin':
            platformComments = await fetchLinkedInComments(conn.access_token!, conn.account_id || '');
            break;
          case 'tiktok':
            platformComments = await fetchTikTokComments(conn.access_token!);
            break;
        }

        // Store comments and generate responses
        for (const comment of platformComments) {
          // Upsert comment
          const { data: inserted, error: insertErr } = await supabase
            .from('comments')
            .upsert({
              business_id: businessId,
              platform: conn.platform,
              platform_comment_id: comment.platform_comment_id,
              platform_post_id: comment.platform_post_id,
              author_name: comment.author_name,
              author_username: comment.author_username,
              content: comment.content,
              commented_at: comment.commented_at,
            }, { onConflict: 'platform,platform_comment_id', ignoreDuplicates: true })
            .select()
            .single();

          if (insertErr || !inserted) continue;

          // Check if already has a response
          const { data: existingResp } = await supabase
            .from('comment_responses')
            .select('id')
            .eq('comment_id', inserted.id)
            .limit(1);

          if (existingResp && existingResp.length > 0) continue;

          // Generate AI response
          try {
            const aiResponse = await generateAIResponse(
              comment.content,
              conn.platform,
              brandVoice,
              brandKeywords
            );

            const status = responseMode === 'autopilot' ? 'approved' : 'pending_review';

            await supabase.from('comment_responses').insert({
              comment_id: inserted.id,
              business_id: businessId,
              ai_response: aiResponse,
              status,
            });

            // If autopilot, post immediately
            if (responseMode === 'autopilot') {
              let posted = false;
              switch (conn.platform) {
                case 'instagram':
                  posted = await postReplyToInstagram(conn.access_token!, comment.platform_comment_id, aiResponse);
                  break;
                case 'facebook':
                  posted = await postReplyToFacebook(conn.access_token!, comment.platform_comment_id, aiResponse);
                  break;
                case 'twitter':
                  posted = await postReplyToTwitter(conn.access_token!, comment.platform_comment_id, aiResponse);
                  break;
                case 'tiktok':
                  posted = await postReplyToTikTok(conn.access_token!, comment.platform_comment_id, comment.platform_post_id, aiResponse);
                  break;
              }
              if (posted) {
                await supabase.from('comment_responses')
                  .update({ status: 'posted', posted_at: new Date().toISOString() })
                  .eq('comment_id', inserted.id);
              }
            }

            totalFetched++;
          } catch (aiErr) {
            console.error('AI generation error for comment:', aiErr);
          }
        }
      }

      // Update last_fetched_at
      await supabase
        .from('comment_settings')
        .upsert({ business_id: businessId, last_fetched_at: new Date().toISOString() }, { onConflict: 'business_id' });

      return new Response(
        JSON.stringify({ success: true, fetched: totalFetched }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: approve - Approve and post a response
    if (action === 'approve') {
      if (!commentResponseId) throw new Error('commentResponseId required');

      const { data: resp } = await supabase
        .from('comment_responses')
        .select('*, comments(*)')
        .eq('id', commentResponseId)
        .single();

      if (!resp) throw new Error('Response not found');

      const comment = resp.comments as any;
      const replyText = resp.edited_response || resp.ai_response;

      // Get connection
      const { data: conn } = await supabase
        .from('social_connections')
        .select('*')
        .eq('business_id', resp.business_id)
        .eq('platform', comment.platform)
        .eq('is_connected', true)
        .single();

      if (!conn) throw new Error('No connection for platform');

      let posted = false;
      switch (comment.platform) {
        case 'instagram':
          posted = await postReplyToInstagram(conn.access_token!, comment.platform_comment_id, replyText);
          break;
        case 'facebook':
          posted = await postReplyToFacebook(conn.access_token!, comment.platform_comment_id, replyText);
          break;
        case 'twitter':
          posted = await postReplyToTwitter(conn.access_token!, comment.platform_comment_id, replyText);
          break;
        case 'tiktok':
          posted = await postReplyToTikTok(conn.access_token!, comment.platform_comment_id, comment.platform_post_id || '', replyText);
          break;
      }

      await supabase.from('comment_responses').update({
        status: posted ? 'posted' : 'failed',
        posted_at: posted ? new Date().toISOString() : null,
      }).eq('id', commentResponseId);

      return new Response(
        JSON.stringify({ success: posted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: reject - Reject a response
    if (action === 'reject') {
      await supabase.from('comment_responses')
        .update({ status: 'rejected' })
        .eq('id', commentResponseId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: cron-fetch - Automated polling for all businesses with auto_fetch_enabled
    if (action === 'cron-fetch') {
      const { data: allSettings } = await supabase
        .from('comment_settings')
        .select('business_id, fetch_interval_minutes, last_fetched_at')
        .eq('auto_fetch_enabled', true);

      if (!allSettings?.length) {
        return new Response(
          JSON.stringify({ success: true, message: 'No businesses with auto-fetch enabled', processed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let processed = 0;
      const now = new Date();

      for (const setting of allSettings) {
        // Check if enough time has passed since last fetch
        if (setting.last_fetched_at) {
          const lastFetch = new Date(setting.last_fetched_at);
          const minutesSince = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
          if (minutesSince < (setting.fetch_interval_minutes || 15)) continue;
        }

        // Re-invoke this function with fetch action for each business
        try {
          const fetchRes = await fetch(`${supabaseUrl}/functions/v1/comment-responder`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'fetch', businessId: setting.business_id }),
          });

          if (fetchRes.ok) processed++;
        } catch (e) {
          console.error(`Error fetching for business ${setting.business_id}:`, e);
        }
      }

      return new Response(
        JSON.stringify({ success: true, processed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error: unknown) {
    console.error('Comment responder error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
