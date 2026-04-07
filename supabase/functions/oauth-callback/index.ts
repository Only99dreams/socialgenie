import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}

const platformConfigs: Record<string, OAuthConfig> = {
  instagram: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    clientIdEnv: 'TWITTER_CLIENT_ID',
    clientSecretEnv: 'TWITTER_CLIENT_SECRET',
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['openid', 'profile', 'w_member_social'],
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: ['user.info.basic', 'video.publish'],
    clientIdEnv: 'TIKTOK_CLIENT_KEY',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    let action = url.searchParams.get('action');

    // If action not in query params, parse from body
    let parsedBody: any = null;
    if (!action && req.method === 'POST') {
      parsedBody = await req.json();
      action = parsedBody.action || null;
    }

    // Generate authorization URL
    if (action === 'authorize') {
      const body = parsedBody || await req.json();
      const { platform, businessId, redirectUri } = body;

      console.log(`Generating OAuth URL for platform: ${platform}, businessId: ${businessId}`);

      const config = platformConfigs[platform];
      if (!config) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const clientId = Deno.env.get(config.clientIdEnv);
      if (!clientId) {
        throw new Error(`OAuth not configured for ${platform}. Missing ${config.clientIdEnv} secret.`);
      }

      // Generate state with business ID for callback verification
      const state = btoa(JSON.stringify({ businessId, platform, timestamp: Date.now() }));

      // Build authorization URL
      const authParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: config.scopes.join(' '),
        response_type: 'code',
        state,
      });

      // Platform-specific additions
      if (platform === 'twitter') {
        authParams.set('code_challenge', 'challenge'); // Simplified, should use PKCE
        authParams.set('code_challenge_method', 'plain');
      }

      const authUrl = `${config.authUrl}?${authParams.toString()}`;

      console.log(`Generated auth URL for ${platform}`);

      return new Response(
        JSON.stringify({ success: true, authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle OAuth callback (token exchange)
    if (action === 'callback') {
      const body = parsedBody || await req.json();
      const { code, state, redirectUri } = body;

      console.log('Processing OAuth callback');

      // Decode state
      let stateData;
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        throw new Error('Invalid state parameter');
      }

      const { businessId, platform } = stateData;
      const config = platformConfigs[platform];

      if (!config) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const clientId = Deno.env.get(config.clientIdEnv);
      const clientSecret = Deno.env.get(config.clientSecretEnv);

      if (!clientId || !clientSecret) {
        throw new Error(`OAuth not configured for ${platform}`);
      }

      // Exchange code for tokens
      const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      // Twitter uses different token exchange format
      let tokenResponse;
      if (platform === 'twitter') {
        tokenParams.set('code_verifier', 'challenge');
        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        tokenResponse = await fetch(config.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`,
          },
          body: tokenParams.toString(),
        });
      } else {
        tokenResponse = await fetch(config.tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenParams.toString(),
        });
      }

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(`Token exchange failed: ${errorText}`);
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokens = await tokenResponse.json();
      console.log(`Token exchange successful for ${platform}`);

      // Calculate token expiration
      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      // Get account info (platform-specific)
      let accountName = null;
      let accountId = null;

      if (platform === 'twitter') {
        try {
          const userResponse = await fetch('https://api.twitter.com/2/users/me', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            accountName = `@${userData.data.username}`;
            accountId = userData.data.id;
          }
        } catch (e) {
          console.error('Failed to fetch Twitter user info:', e);
        }
      } else if (platform === 'linkedin') {
        try {
          const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            accountName = userData.name;
            accountId = userData.sub;
          }
        } catch (e) {
          console.error('Failed to fetch LinkedIn user info:', e);
        }
      }

      // Update or insert social connection
      const { error: upsertError } = await supabase
        .from('social_connections')
        .upsert({
          business_id: businessId,
          platform,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: expiresAt,
          account_name: accountName,
          account_id: accountId,
          is_connected: true,
        }, {
          onConflict: 'business_id,platform',
        });

      if (upsertError) {
        console.error('Failed to save connection:', upsertError);
        throw new Error('Failed to save connection');
      }

      console.log(`Successfully connected ${platform} for business ${businessId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          platform,
          accountName,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh token
    if (action === 'refresh') {
      const body = parsedBody || await req.json();
      const { connectionId } = body;

      // Get the connection
      const { data: connection, error: fetchError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (fetchError || !connection) {
        throw new Error('Connection not found');
      }

      if (!connection.refresh_token) {
        throw new Error('No refresh token available');
      }

      const config = platformConfigs[connection.platform];
      const clientId = Deno.env.get(config.clientIdEnv);
      const clientSecret = Deno.env.get(config.clientSecretEnv);

      if (!clientId || !clientSecret) {
        throw new Error(`OAuth not configured for ${connection.platform}`);
      }

      // Refresh the token
      const refreshParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      });

      const refreshResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: refreshParams.toString(),
      });

      if (!refreshResponse.ok) {
        throw new Error('Token refresh failed');
      }

      const newTokens = await refreshResponse.json();

      const expiresAt = newTokens.expires_in
        ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        : null;

      // Update the connection
      await supabase
        .from('social_connections')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token || connection.refresh_token,
          token_expires_at: expiresAt,
        })
        .eq('id', connectionId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
