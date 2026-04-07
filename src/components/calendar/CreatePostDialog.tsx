import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Loader2,
  Hash,
  X,
  Film,
  Image,
  CircleDot,
  Upload,
  Video
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateContent, type BusinessProfile } from '@/lib/api/business-intelligence';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
}

const TikTokIcon = () => <span className="text-xs font-bold">TT</span>;

const platforms = [
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-400' },
  { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'text-blue-400' },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'text-sky-400' },
  { id: 'twitter', icon: Twitter, label: 'X/Twitter', color: 'text-slate-300' },
  { id: 'tiktok', icon: TikTokIcon, label: 'TikTok', color: 'text-purple-400' },
];

const MAX_VIDEO_SIZE_MB = 100;
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg'];

export function CreatePostDialog({ open, onOpenChange, selectedDate }: CreatePostDialogProps) {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [contentType, setContentType] = useState<'feed' | 'story' | 'reel'>('feed');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(selectedDate || undefined);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [generateWithImage, setGenerateWithImage] = useState(true);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isInstagram = selectedPlatform === 'instagram';
  const isTikTok = selectedPlatform === 'tiktok';
  const needsVideo = (isInstagram && contentType === 'reel') || isTikTok;

  const contentTypes = [
    { id: 'feed' as const, icon: Image, label: 'Feed Post' },
    { id: 'story' as const, icon: CircleDot, label: 'Story' },
    { id: 'reel' as const, icon: Film, label: 'Reel' },
  ];
  const handleAddHashtag = () => {
    if (hashtagInput && !hashtags.includes(hashtagInput)) {
      setHashtags([...hashtags, hashtagInput.replace('#', '')]);
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an MP4, MOV, WebM, or MPEG video.',
        variant: 'destructive',
      });
      return;
    }

    // Validate size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_SIZE_MB) {
      toast({
        title: 'File too large',
        description: `Maximum video size is ${MAX_VIDEO_SIZE_MB}MB. Your file is ${sizeMB.toFixed(1)}MB.`,
        variant: 'destructive',
      });
      return;
    }

    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    
    // Upload immediately
    await uploadVideo(file);
  };

  const uploadVideo = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Please log in', variant: 'destructive' });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      // Simulate progress since supabase upload doesn't provide progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('post-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('post-videos')
        .getPublicUrl(data.path);

      setVideoUrl(urlData.publicUrl);
      setUploadProgress(100);

      toast({
        title: 'Video uploaded!',
        description: `${(file.size / (1024 * 1024)).toFixed(1)}MB uploaded successfully.`,
      });
    } catch (error) {
      console.error('Video upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setVideoFile(null);
      setVideoPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoUrl(null);
    setVideoPreviewUrl(null);
    setUploadProgress(0);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Mock business profile for demo - in real app, fetch from database
      const mockBusinessProfile: BusinessProfile = {
        industry: 'Technology',
        products: ['SaaS Platform', 'AI Tools'],
        targetAudience: 'Small business owners and marketers',
        brandVoice: {
          tone: 'professional',
          keywords: ['innovation', 'growth', 'efficiency', 'AI-powered'],
          uniqueSellingPoints: ['Save time with AI', 'Boost engagement']
        },
        contentThemes: ['productivity tips', 'industry insights', 'product updates', 'customer success'],
        competitors: [],
        summary: 'A SaaS platform that helps businesses automate their social media marketing with AI.'
      };

      const result = await generateContent({
        businessProfile: mockBusinessProfile,
        platform: selectedPlatform,
        topic: topic || undefined,
        generateWithImage
      });

      if (result.success && result.data) {
        setContent(result.data.content);
        setHashtags(result.data.hashtags || []);
        if (result.data.imageUrl) {
          setGeneratedImageUrl(result.data.imageUrl);
        }
        toast({
          title: 'Content generated!',
          description: result.data.imageUrl 
            ? 'AI has created content and an image based on your brand profile.'
            : 'AI has created content based on your brand profile.',
        });
      } else {
        throw new Error(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    setGeneratedImageUrl(null);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter or generate some content.',
        variant: 'destructive',
      });
      return;
    }

    if (needsVideo && !videoUrl) {
      toast({
        title: 'Video required',
        description: `${contentType === 'reel' ? 'Instagram Reels' : 'TikTok posts'} require a video. Please upload one.`,
        variant: 'destructive',
      });
      return;
    }

    // TODO: Save to database with video_url
    toast({
      title: 'Post created!',
      description: scheduledDate 
        ? `Your post is scheduled for ${format(scheduledDate, 'MMM d, yyyy h:mm a')}`
        : 'Your post has been saved as a draft.',
    });
    
    onOpenChange(false);
    setContent('');
    setHashtags([]);
    setTopic('');
    setGeneratedImageUrl(null);
    handleRemoveVideo();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create New Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platform Selection */}
          <div>
            <Label className="mb-3 block">Platform</Label>
            <Tabs value={selectedPlatform} onValueChange={(v) => { setSelectedPlatform(v); if (v !== 'instagram') setContentType('feed'); }}>
              <TabsList className="w-full bg-secondary">
                {platforms.map((platform) => (
                  <TabsTrigger 
                    key={platform.id} 
                    value={platform.id}
                    className="flex-1 gap-2"
                  >
                    <platform.icon className={cn("w-4 h-4", platform.color)} />
                    <span className="hidden sm:inline">{platform.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content Type (Instagram only) */}
          {isInstagram && (
            <div>
              <Label className="mb-3 block">Content Type</Label>
              <div className="flex gap-2">
                {contentTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={contentType === type.id ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setContentType(type.id)}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </Button>
                ))}
              </div>
              {contentType === 'story' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Stories disappear after 24 hours. Image or video required.
                </p>
              )}
              {contentType === 'reel' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Reels require video content (MP4, MOV). Max 90 seconds recommended.
                </p>
              )}
            </div>
          )}

          {/* Video Upload (for Reels and TikTok) */}
          {(needsVideo || (isInstagram && contentType === 'story')) && (
            <div>
              <Label className="mb-3 block flex items-center gap-2">
                <Video className="w-4 h-4" />
                {needsVideo ? 'Video (Required)' : 'Video (Optional)'}
              </Label>

              {videoPreviewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
                  <video 
                    src={videoPreviewUrl} 
                    className="w-full h-48 object-cover" 
                    controls 
                    muted
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleRemoveVideo}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {isUploading && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <Progress value={uploadProgress} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                      </div>
                    </div>
                  )}
                  {!isUploading && videoUrl && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Film className="w-3 h-3" />
                        {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)}MB` : 'Uploaded'}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload video</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, MOV, WebM • Max {MAX_VIDEO_SIZE_MB}MB
                  </p>
                </div>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/mpeg"
                className="hidden"
                onChange={handleVideoSelect}
              />
            </div>
          )}

          {/* AI Generation */}
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">AI Content Generator</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="gen-image" className="text-xs text-muted-foreground cursor-pointer">
                  With image
                </Label>
                <Switch
                  id="gen-image"
                  checked={generateWithImage}
                  onCheckedChange={setGenerateWithImage}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter a topic or leave blank for suggestions..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating && generateWithImage ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="relative">
              <Label className="mb-2 block">Generated Image</Label>
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img 
                  src={generatedImageUrl} 
                  alt="AI generated" 
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            <Label htmlFor="content" className="mb-2 block">Content</Label>
            <Textarea
              id="content"
              placeholder="What would you like to share?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-muted-foreground">
                {content.length} / {selectedPlatform === 'twitter' ? 280 : 2200}
              </span>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <Label className="mb-2 block">Hashtags</Label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Add a hashtag"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHashtag())}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={handleAddHashtag}>Add</Button>
            </div>
            <AnimatePresence>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => handleRemoveHashtag(tag)}
                    >
                      #{tag} ×
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">Schedule</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleSubmit}>
              Save as Draft
            </Button>
            <Button onClick={handleSubmit} disabled={isUploading} className="gap-2">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
              Schedule Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
