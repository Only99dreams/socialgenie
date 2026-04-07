import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Post {
  id: string;
  business_id: string;
  platform: string;
  content: string;
  hashtags: string[] | null;
  image_url: string | null;
  scheduled_at: string;
  content_type: string;
}

interface SocialConnection {
  id: string;
  platform: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  account_id: string | null;
}

// Post to Twitter/X
async function postToTwitter(connection: SocialConnection, content: string, imageUrl: string | null): Promise<{ success: boolean; error?: string }> {
  console.log('Posting to Twitter...');
  
  try {
    const tweetPayload: Record<string, unknown> = { text: content };

    // If there's an image, we need to upload it first
    if (imageUrl) {
      console.log('Image posting to Twitter requires media upload API - skipping image');
      // Twitter media upload requires separate handling with chunked upload
      // For now, just post the text
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error:', errorText);
      return { success: false, error: `Twitter API error: ${response.status}` };
    }

    const result = await response.json();
    console.log('Tweet posted successfully:', result.data?.id);
    return { success: true };
  } catch (error: unknown) {
    console.error('Twitter posting error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Post to LinkedIn
async function postToLinkedIn(connection: SocialConnection, content: string, imageUrl: string | null): Promise<{ success: boolean; error?: string }> {
  console.log('Posting to LinkedIn...');
  
  try {
    const authorUrn = `urn:li:person:${connection.account_id}`;
    
    const postPayload: Record<string, unknown> = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LinkedIn API error:', errorText);
      return { success: false, error: `LinkedIn API error: ${response.status}` };
    }

    console.log('LinkedIn post created successfully');
    return { success: true };
  } catch (error: unknown) {
    console.error('LinkedIn posting error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Post to Facebook
async function postToFacebook(connection: SocialConnection, content: string, imageUrl: string | null): Promise<{ success: boolean; error?: string }> {
  console.log('Posting to Facebook...');
  
  try {
    // First, get the pages the user manages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${connection.access_token}`
    );
    
    if (!pagesResponse.ok) {
      return { success: false, error: 'Failed to get Facebook pages' };
    }

    const pagesData = await pagesResponse.json();
    if (!pagesData.data || pagesData.data.length === 0) {
      return { success: false, error: 'No Facebook pages found' };
    }

    // Use the first page
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    let postUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    const postParams = new URLSearchParams({
      message: content,
      access_token: pageAccessToken,
    });

    if (imageUrl) {
      postUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      postParams.set('url', imageUrl);
    }

    const response = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: postParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook API error:', errorText);
      return { success: false, error: `Facebook API error: ${response.status}` };
    }

    console.log('Facebook post created successfully');
    return { success: true };
  } catch (error: unknown) {
    console.error('Facebook posting error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Post to Instagram (via Facebook Graph API)
async function postToInstagram(connection: SocialConnection, content: string, imageUrl: string | null, contentType: string = 'feed'): Promise<{ success: boolean; error?: string }> {
  console.log(`Posting to Instagram (${contentType})...`);
  
  if (!imageUrl && contentType !== 'story') {
    return { success: false, error: 'Instagram feed posts and reels require media' };
  }

  try {
    // Get Instagram Business Account ID
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=${connection.access_token}`
    );
    
    if (!accountsResponse.ok) {
      return { success: false, error: 'Failed to get Instagram account' };
    }

    const accountsData = await accountsResponse.json();
    const page = accountsData.data?.find((p: Record<string, unknown>) => p.instagram_business_account);
    
    if (!page?.instagram_business_account?.id) {
      return { success: false, error: 'No Instagram business account linked' };
    }

    const igAccountId = page.instagram_business_account.id;

    // Build media container params based on content type
    const containerParams = new URLSearchParams({
      access_token: connection.access_token,
    });

    if (contentType === 'story') {
      // Instagram Stories
      if (imageUrl) {
        containerParams.set('image_url', imageUrl);
        containerParams.set('media_type', 'STORIES');
      } else {
        return { success: false, error: 'Instagram stories require an image or video' };
      }
    } else if (contentType === 'reel') {
      // Instagram Reels - requires video URL
      if (imageUrl) {
        // For image-based reels, Instagram requires a video
        // We'll use the image as a carousel-like post or inform the user
        containerParams.set('video_url', imageUrl);
        containerParams.set('media_type', 'REELS');
        containerParams.set('caption', content);
        containerParams.set('share_to_feed', 'true');
      } else {
        return { success: false, error: 'Instagram Reels require a video URL' };
      }
    } else {
      // Standard feed post
      if (imageUrl) {
        containerParams.set('image_url', imageUrl);
      }
      containerParams.set('caption', content);
    }

    // Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: containerParams.toString(),
      }
    );

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text();
      console.error(`Instagram ${contentType} container error:`, errorText);
      return { success: false, error: `Failed to create Instagram ${contentType} container` };
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    // Wait for processing (reels may need longer)
    const waitTime = contentType === 'reel' ? 15000 : 5000;
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // For reels, check status before publishing
    if (contentType === 'reel') {
      let statusChecks = 0;
      const maxChecks = 10;
      while (statusChecks < maxChecks) {
        const statusResponse = await fetch(
          `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${connection.access_token}`
        );
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.status_code === 'FINISHED') break;
          if (statusData.status_code === 'ERROR') {
            return { success: false, error: 'Reel processing failed' };
          }
        }
        statusChecks++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: connection.access_token,
        }).toString(),
      }
    );

    if (!publishResponse.ok) {
      const errText = await publishResponse.text();
      console.error(`Instagram ${contentType} publish error:`, errText);
      return { success: false, error: `Failed to publish Instagram ${contentType}` };
    }

    console.log(`Instagram ${contentType} published successfully`);
    return { success: true };
  } catch (error: unknown) {
    console.error(`Instagram ${contentType} posting error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Post to TikTok
async function postToTikTok(connection: SocialConnection, content: string, imageUrl: string | null): Promise<{ success: boolean; error?: string }> {
  console.log('Posting to TikTok...');
  
  // TikTok API requires video content, not images
  // This is a placeholder for the video posting flow
  return { 
    success: false, 
    error: 'TikTok posting requires video content. Image-only posts are not supported.' 
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Running post scheduler...');

    // Get all scheduled posts that are due
    const now = new Date().toISOString();
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      console.log('No scheduled posts due');
      return new Response(
        JSON.stringify({ success: true, message: 'No posts to publish', published: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${posts.length} posts to publish`);

    const results = [];

    for (const post of posts as Post[]) {
      console.log(`Processing post ${post.id} for ${post.platform}`);

      // Get the social connection for this post
      const { data: connection, error: connError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('business_id', post.business_id)
        .eq('platform', post.platform)
        .eq('is_connected', true)
        .single();

      if (connError || !connection) {
        console.error(`No connection found for ${post.platform}`);
        await supabase
          .from('posts')
          .update({ status: 'failed' })
          .eq('id', post.id);
        results.push({ postId: post.id, success: false, error: 'No connection' });
        continue;
      }

      // Check if token is expired
      if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
        console.log('Token expired, attempting refresh...');
        // Attempt to refresh - call the oauth-callback function
        const { error: refreshError } = await supabase.functions.invoke('oauth-callback', {
          body: { action: 'refresh', connectionId: connection.id },
        });

        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          await supabase
            .from('posts')
            .update({ status: 'failed' })
            .eq('id', post.id);
          results.push({ postId: post.id, success: false, error: 'Token refresh failed' });
          continue;
        }

        // Re-fetch the connection with new token
        const { data: refreshedConn } = await supabase
          .from('social_connections')
          .select('*')
          .eq('id', connection.id)
          .single();

        if (refreshedConn) {
          Object.assign(connection, refreshedConn);
        }
      }

      // Build content with hashtags
      let fullContent = post.content;
      if (post.hashtags && post.hashtags.length > 0) {
        fullContent += '\n\n' + post.hashtags.map(h => `#${h}`).join(' ');
      }

      // Post to the platform
      let result: { success: boolean; error?: string };

      switch (post.platform) {
        case 'twitter':
          result = await postToTwitter(connection as SocialConnection, fullContent, post.image_url);
          break;
        case 'linkedin':
          result = await postToLinkedIn(connection as SocialConnection, fullContent, post.image_url);
          break;
        case 'facebook':
          result = await postToFacebook(connection as SocialConnection, fullContent, post.image_url);
          break;
        case 'instagram':
          result = await postToInstagram(connection as SocialConnection, fullContent, post.image_url, post.content_type);
          break;
        case 'tiktok':
          result = await postToTikTok(connection as SocialConnection, fullContent, post.image_url);
          break;
        default:
          result = { success: false, error: `Unsupported platform: ${post.platform}` };
      }

      // Update post status
      const newStatus = result.success ? 'published' : 'failed';
      await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', post.id);

      // Create initial analytics record for published posts
      if (result.success) {
        await supabase.from('post_analytics').insert({
          post_id: post.id,
          business_id: post.business_id,
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          saves: 0,
          engagement_rate: 0,
        });
      }

      results.push({ postId: post.id, ...result });
      console.log(`Post ${post.id} ${result.success ? 'published' : 'failed'}`);
    }

    const published = results.filter(r => r.success).length;
    console.log(`Scheduler complete: ${published}/${posts.length} posts published`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Published ${published} of ${posts.length} posts`,
        published,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Scheduler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
