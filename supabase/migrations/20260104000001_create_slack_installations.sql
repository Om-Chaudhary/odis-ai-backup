-- Create slack_installations table
-- Stores Slack workspace credentials for sending notifications

CREATE TABLE IF NOT EXISTS slack_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text UNIQUE NOT NULL,
  team_name text,
  bot_token text NOT NULL,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on team_id for fast lookups
CREATE INDEX idx_slack_installations_team_id
  ON slack_installations(team_id);

-- Enable RLS
ALTER TABLE slack_installations ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
-- Only users with admin role can view/manage Slack installations
CREATE POLICY "Admin only access"
  ON slack_installations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Update trigger for updated_at
CREATE TRIGGER update_slack_installations_updated_at
  BEFORE UPDATE ON slack_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE slack_installations IS
  'Stores Slack workspace credentials for sending appointment notifications and other bot messages';
