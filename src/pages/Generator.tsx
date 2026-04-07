import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Globe,
  Loader2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Copy,
  RefreshCw,
  Check,
  Lightbulb,
  TrendingUp,
  Zap,
  ImageIcon,
  CalendarPlus,
  Send,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { analyzeWebsite, generateContent, type BusinessProfile, type GeneratedPost } from '@/lib/api/business-intelligence';
import { regenerateImage } from '@/lib/api/image-generation';
import { cn } from '@/lib/utils';

const platforms = [
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-400 bg-pink-500/10' },
  { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'text-blue-400 bg-blue-500/10' },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'text-sky-400 bg-sky-500/10' },
  { id: 'twitter', icon: Twitter, label: 'X/Twitter', color: 'text-slate-300 bg-slate-500/10' },
];

const contentTypes = [
  { id: 'promotional', label: 'Promotional', icon: TrendingUp },
  { id: 'educational', label: 'Educational', icon: Lightbulb },
  { id: 'engagement', label: 'Engagement', icon: Zap },
];

export default function Generator() {
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedContentType, setSelectedContentType] = useState('promotional');
  const [topic, setTopic] = useState('');
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generateWithImage, setGenerateWithImage] = useState(true);

  // Fetch business ID on mount
  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();
      if (data) setBusinessId(data.id);
    };
    fetchBusiness();
  }, []);

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: 'URL required',
        description: 'Please enter your website URL.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeWebsite(websiteUrl);
      
      if (result.success && result.data) {
        setBusinessProfile(result.data);
        toast({
          title: 'Website analyzed!',
          description: `Discovered ${result.data.products?.length || 0} products and identified your brand voice.`,
        });
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!businessProfile) {
      toast({
        title: 'Analyze first',
        description: 'Please analyze your website before generating content.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateContent({
        businessProfile,
        platform: selectedPlatform,
        contentType: selectedContentType,
        topic: topic || undefined,
        generateWithImage
      });

      if (result.success && result.data) {
        setGeneratedPosts([result.data, ...generatedPosts]);
        toast({
          title: 'Content generated!',
          description: 'Your AI-powered content is ready.',
        });
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: 'Copied to clipboard!' });
  };

  // Save post to database (schedule or post now)
  const handleSavePost = async (post: GeneratedPost, index: number, action: 'schedule' | 'post_now') => {
    if (!businessId) {
      toast({ title: 'No business found', variant: 'destructive' });
      return;
    }
    setSavingIndex(index);
    try {
      const scheduledAt = action === 'post_now' 
        ? new Date().toISOString()
        : new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

      const { error } = await supabase.from('posts').insert({
        business_id: businessId,
        platform: post.platform as any,
        content: post.content,
        hashtags: post.hashtags,
        image_url: post.imageUrl || null,
        status: action === 'post_now' ? 'scheduled' : 'scheduled',
        scheduled_at: scheduledAt,
        ai_generated: true,
        content_type: 'feed' as any,
      });

      if (error) throw error;

      toast({ 
        title: action === 'post_now' ? '🚀 Post queued!' : '📅 Post scheduled!',
        description: action === 'post_now' 
          ? `Your ${post.platform} post will be published shortly.`
          : `Scheduled for ${new Date(scheduledAt).toLocaleString()}.`
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save post', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSavingIndex(null);
    }
  };

  // Generate for ALL platforms at once
  const handleGenerateAll = async () => {
    if (!businessProfile) {
      toast({ title: 'Analyze first', description: 'Please analyze your website before generating.', variant: 'destructive' });
      return;
    }
    setIsGeneratingAll(true);
    const allPlatforms = ['instagram', 'facebook', 'linkedin', 'twitter'];
    const newPosts: GeneratedPost[] = [];

    for (const platform of allPlatforms) {
      try {
        const result = await generateContent({
          businessProfile,
          platform,
          contentType: selectedContentType,
          topic: topic || undefined,
          generateWithImage,
          businessId: businessId || undefined,
        });
        if (result.success && result.data) {
          newPosts.push(result.data);
        }
      } catch (error) {
        console.error(`Failed to generate for ${platform}:`, error);
      }
    }

    if (newPosts.length > 0) {
      setGeneratedPosts([...newPosts, ...generatedPosts]);
      toast({ title: `Generated ${newPosts.length} posts!`, description: 'Content created for all platforms.' });
    } else {
      toast({ title: 'Generation failed', description: 'Could not generate content.', variant: 'destructive' });
    }
    setIsGeneratingAll(false);
  };

  // Schedule ALL generated posts at once
  const handleScheduleAll = async () => {
    if (!businessId || generatedPosts.length === 0) return;
    setSavingIndex(-1); // special value for "all"
    let saved = 0;
    for (const post of generatedPosts) {
      try {
        const scheduledAt = new Date(Date.now() + (saved + 1) * 60 * 60 * 1000).toISOString();
        const { error } = await supabase.from('posts').insert({
          business_id: businessId,
          platform: post.platform as any,
          content: post.content,
          hashtags: post.hashtags,
          image_url: post.imageUrl || null,
          status: 'scheduled',
          scheduled_at: scheduledAt,
          ai_generated: true,
          content_type: 'feed' as any,
        });
        if (!error) saved++;
      } catch {}
    }
    toast({ title: `📅 ${saved} posts scheduled!`, description: 'Posts staggered over the next few hours.' });
    setSavingIndex(null);
  };
  const handleRegenerateImage = async (index: number, post: GeneratedPost) => {
    if (!post.imagePrompt) {
      toast({
        title: 'No image prompt',
        description: 'This post was generated without an image prompt.',
        variant: 'destructive',
      });
      return;
    }

    setRegeneratingIndex(index);
    try {
      const result = await regenerateImage({ imagePrompt: post.imagePrompt });
      
      if (result.success && result.imageUrl) {
        const updatedPosts = [...generatedPosts];
        updatedPosts[index] = { ...post, imageUrl: result.imageUrl };
        setGeneratedPosts(updatedPosts);
        toast({ title: 'Image regenerated!' });
      } else {
        throw new Error(result.error || 'Failed to regenerate image');
      }
    } catch (error) {
      console.error('Regenerate error:', error);
      toast({
        title: 'Regeneration failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRegeneratingIndex(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {/* Header */}
          <DashboardHeader 
            title="AI Content Generator"
            subtitle="Analyze your brand and generate on-brand social content in seconds"
            icon={<Sparkles className="w-8 h-8 text-primary" />}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-1 space-y-6">
              {/* Website Analysis */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="w-5 h-5 text-primary" />
                      Brand Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="website">Website URL</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="website"
                          placeholder="https://yourwebsite.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                        />
                        <Button 
                          onClick={handleAnalyzeWebsite}
                          disabled={isAnalyzing}
                          size="icon"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Business Profile Summary */}
                    {businessProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Profile Loaded</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Industry:</span>{' '}
                            <span className="text-foreground">{businessProfile.industry}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tone:</span>{' '}
                            <Badge variant="outline" className="ml-1 capitalize">
                              {businessProfile.brandVoice?.tone}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Products:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {businessProfile.products?.slice(0, 3).map((p, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {p}
                                </Badge>
                              ))}
                              {(businessProfile.products?.length || 0) > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{businessProfile.products!.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Generation Options */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Generation Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Platform Selection */}
                    <div>
                      <Label className="mb-2 block">Platform</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {platforms.map((platform) => (
                          <Button
                            key={platform.id}
                            variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedPlatform(platform.id)}
                            className={cn(
                              "justify-start gap-2",
                              selectedPlatform !== platform.id && platform.color
                            )}
                          >
                            <platform.icon className="w-4 h-4" />
                            {platform.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Content Type */}
                    <div>
                      <Label className="mb-2 block">Content Type</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {contentTypes.map((type) => (
                          <Button
                            key={type.id}
                            variant={selectedContentType === type.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedContentType(type.id)}
                            className="justify-start gap-2"
                          >
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Topic Input */}
                    <div>
                      <Label htmlFor="topic">Topic (optional)</Label>
                      <Textarea
                        id="topic"
                        placeholder="Enter a specific topic or leave blank for AI suggestions..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="mt-1.5 resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Generate with Image Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        <div>
                          <Label htmlFor="generate-image" className="cursor-pointer">
                            Generate with Image
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            AI will create an accompanying image
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="generate-image"
                        checked={generateWithImage}
                        onCheckedChange={setGenerateWithImage}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button 
                        onClick={handleGenerate}
                        disabled={isGenerating || isGeneratingAll || !businessProfile}
                        className="w-full gap-2"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {isGenerating && generateWithImage ? 'Generating Content & Image...' : 'Generate Content'}
                      </Button>

                      <Button 
                        onClick={handleGenerateAll}
                        disabled={isGenerating || isGeneratingAll || !businessProfile}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        {isGeneratingAll ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Layers className="w-4 h-4" />
                        )}
                        {isGeneratingAll ? 'Generating for all platforms...' : 'Generate for All Platforms'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Generated Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="bg-card border-border h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Generated Content</span>
                    <div className="flex items-center gap-2">
                      {generatedPosts.length > 0 && (
                        <>
                          <Badge variant="secondary">{generatedPosts.length} posts</Badge>
                          <Button 
                            size="sm" 
                            onClick={handleScheduleAll}
                            disabled={savingIndex !== null}
                            className="gap-1.5"
                          >
                            {savingIndex === -1 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />}
                            Schedule All
                          </Button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">No content yet</h3>
                      <p className="text-muted-foreground max-w-md">
                        Analyze your website and click "Generate Content" to create AI-powered posts tailored to your brand.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {generatedPosts.map((post, index) => {
                        const platform = platforms.find(p => p.id === post.platform);
                        const Icon = platform?.icon || Sparkles;
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-secondary/50 border border-border"
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <div className={cn("p-2 rounded-lg", platform?.color)}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-medium capitalize">{post.platform}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {new Date(post.generatedAt).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(post.content, index)}
                                >
                                  {copiedIndex === index ? (
                                    <Check className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                {post.imageUrl && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRegenerateImage(index, post)}
                                    disabled={regeneratingIndex === index}
                                    title="Regenerate image"
                                  >
                                    {regeneratingIndex === index ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <ImageIcon className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon">
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Generated Image */}
                            {post.imageUrl && (
                              <div className="mb-3 rounded-lg overflow-hidden border border-border">
                                <img 
                                  src={post.imageUrl} 
                                  alt="AI generated image" 
                                  className="w-full h-48 object-cover"
                                />
                              </div>
                            )}
                            
                            <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>
                            
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {post.hashtags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs text-primary">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {post.bestTimeToPost && (
                              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  💡 Best time to post: {post.bestTimeToPost}
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSavePost(post, index, 'schedule')}
                                    disabled={savingIndex !== null}
                                    className="gap-1.5 text-xs"
                                  >
                                    {savingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />}
                                    Schedule
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSavePost(post, index, 'post_now')}
                                    disabled={savingIndex !== null}
                                    className="gap-1.5 text-xs"
                                  >
                                    {savingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    Post Now
                                  </Button>
                                </div>
                              </div>
                            )}

                            {!post.bestTimeToPost && (
                              <div className="mt-3 pt-3 border-t border-border flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSavePost(post, index, 'schedule')}
                                  disabled={savingIndex !== null}
                                  className="gap-1.5 text-xs"
                                >
                                  {savingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />}
                                  Schedule
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSavePost(post, index, 'post_now')}
                                  disabled={savingIndex !== null}
                                  className="gap-1.5 text-xs"
                                >
                                  {savingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                  Post Now
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
