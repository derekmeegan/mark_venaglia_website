/*
  # Create timeline table for portfolio items

  1. New Tables
    - `portfolio_timeline`
      - `id` (uuid, primary key)
      - `portfolio_id` (uuid, references portfolio.id)
      - `title` (text)
      - `date` (text)
      - `description` (text)
      - `image` (text)
      - `created_at` (timestamp)
      - `order` (integer)

  2. Security
    - Enable RLS on timeline table
    - Add policies for:
      - Anyone can view timeline entries
      - Only portfolio item owners can manage timeline entries
    - Add foreign key constraint with CASCADE on delete

  3. Changes
    - Add index on portfolio_id for better performance
    - Add index on order for sorting
*/

-- Create timeline table
CREATE TABLE IF NOT EXISTS portfolio_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES portfolio(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  date text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  created_at timestamptz DEFAULT now(),
  "order" integer NOT NULL,
  CONSTRAINT unique_portfolio_order UNIQUE (portfolio_id, "order")
);

-- Enable RLS
ALTER TABLE portfolio_timeline ENABLE ROW LEVEL SECURITY;

-- Timeline policies
CREATE POLICY "Anyone can view timeline entries"
  ON portfolio_timeline
  FOR SELECT
  USING (true);

-- Allow timeline management based on portfolio ownership
CREATE POLICY "Users can manage timeline entries for their portfolio items"
  ON portfolio_timeline
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolio
      WHERE portfolio.id = portfolio_timeline.portfolio_id
      AND portfolio.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio
      WHERE portfolio.id = portfolio_timeline.portfolio_id
      AND portfolio.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS portfolio_timeline_portfolio_id_idx ON portfolio_timeline(portfolio_id);
CREATE INDEX IF NOT EXISTS portfolio_timeline_order_idx ON portfolio_timeline("order");