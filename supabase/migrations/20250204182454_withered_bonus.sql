/*
  # Add storage policies for mark_images bucket

  1. Storage Policies
    - Enable authenticated users to upload images
    - Allow public read access to all images
    - Organize images in subdirectories (tour/, portfolio/, timeline/)

  2. Changes
    - Add storage bucket if not exists
    - Add policies for CRUD operations
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('mark_images', 'mark_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to all files in the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'mark_images');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mark_images'
  AND (
    position('tour/' in name) = 1
    OR position('portfolio/' in name) = 1
    OR position('timeline/' in name) = 1
  )
);

-- Allow users to update their own files
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mark_images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'mark_images' AND auth.uid() = owner);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mark_images' AND auth.uid() = owner);