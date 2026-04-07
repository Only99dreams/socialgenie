-- Create enum for content types
CREATE TYPE public.content_type AS ENUM ('feed', 'story', 'reel');

-- Add content_type column to posts table
ALTER TABLE public.posts 
  ADD COLUMN content_type public.content_type NOT NULL DEFAULT 'feed';
