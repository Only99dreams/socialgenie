-- Create storage bucket for post videos
INSERT INTO storage.buckets (id, name, public) VALUES ('post-videos', 'post-videos', true);

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-videos');

-- Allow public read access to videos
CREATE POLICY "Anyone can view post videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-videos');

-- Allow authenticated users to delete their videos
CREATE POLICY "Authenticated users can delete their videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-videos');

-- Add video_url column to posts table
ALTER TABLE public.posts ADD COLUMN video_url TEXT DEFAULT NULL;
