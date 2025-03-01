/*
  # Update RLS policies for tours and portfolio tables

  1. Changes
    - Modify RLS policies to allow authenticated users to create entries
    - Remove user_id check from INSERT policies
    - Keep user_id check for UPDATE and DELETE policies
*/

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  duration text NOT NULL,
  price text NOT NULL,
  image text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid()
);

-- Enable RLS for tours
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Tours policies
CREATE POLICY "Anyone can view tours"
  ON tours
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tours"
  ON tours
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own tours"
  ON tours
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tours"
  ON tours
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  year text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid()
);

-- Enable RLS for portfolio
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Portfolio policies
CREATE POLICY "Anyone can view portfolio items"
  ON portfolio
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create portfolio items"
  ON portfolio
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own portfolio items"
  ON portfolio
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio items"
  ON portfolio
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS tours_user_id_idx ON tours(user_id);
CREATE INDEX IF NOT EXISTS portfolio_user_id_idx ON portfolio(user_id);