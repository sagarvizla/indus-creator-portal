/*
  # Create video submissions table

  1. New Tables
    - `video_submissions`
      - `id` (uuid, primary key)
      - `user_email` (text, user's email from auth)
      - `channel_title` (text, YouTube channel name)
      - `video_url` (text, YouTube video URL)
      - `video_title` (text, video title)
      - `video_format` (text, VIDEO/SHORTS/LIVE)
      - `submission_month` (text, month name)
      - `published_at` (timestamptz, when video was published)
      - `created_at` (timestamptz, when submission was made)

  2. Security
    - Enable RLS on `video_submissions` table
    - Add policy for users to read their own submissions
    - Add policy for users to insert their own submissions
*/

CREATE TABLE IF NOT EXISTS video_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  channel_title text NOT NULL,
  video_url text NOT NULL,
  video_title text NOT NULL,
  video_format text NOT NULL CHECK (video_format IN ('VIDEO', 'SHORTS', 'LIVE')),
  submission_month text NOT NULL,
  published_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE video_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own submissions"
  ON video_submissions
  FOR SELECT
  TO authenticated
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert own submissions"
  ON video_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE INDEX IF NOT EXISTS idx_video_submissions_user_email ON video_submissions(user_email);
CREATE INDEX IF NOT EXISTS idx_video_submissions_month ON video_submissions(submission_month);