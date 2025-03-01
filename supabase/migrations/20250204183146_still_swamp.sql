/*
  # Update storage policies to allow public uploads

  1. Changes
    - Drop the authenticated-only upload policy
    - Add new policy allowing anyone to upload with folder structure requirements
*/

-- Drop the old authenticated-only upload policy
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- Allow anyone to upload files with folder structure requirements
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mark_images'
  AND (
    position('tour/' in name) = 1
    OR position('portfolio/' in name) = 1
    OR position('timeline/' in name) = 1
  )
);