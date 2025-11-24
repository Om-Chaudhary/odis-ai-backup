-- Create scheduled_discharge_emails table for managing scheduled discharge email delivery
CREATE TABLE IF NOT EXISTS scheduled_discharge_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,

  -- Email details
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text,

  -- Scheduling
  scheduled_for timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),

  -- Execution tracking
  sent_at timestamp with time zone,
  resend_email_id text,  -- Resend's email ID for tracking

  -- Metadata and tracking
  metadata jsonb DEFAULT '{}'::jsonb,
  qstash_message_id text,  -- QStash message ID for tracking

  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_discharge_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_for ON scheduled_discharge_emails(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_discharge_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_case_id ON scheduled_discharge_emails(case_id);

-- Create RLS policies
ALTER TABLE scheduled_discharge_emails ENABLE ROW LEVEL SECURITY;

-- Users can only view their own scheduled emails
CREATE POLICY "Users can view own scheduled emails"
  ON scheduled_discharge_emails
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scheduled emails
CREATE POLICY "Users can create own scheduled emails"
  ON scheduled_discharge_emails
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scheduled emails (only specific fields)
CREATE POLICY "Users can update own scheduled emails"
  ON scheduled_discharge_emails
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scheduled emails
CREATE POLICY "Users can delete own scheduled emails"
  ON scheduled_discharge_emails
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_scheduled_discharge_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduled_discharge_emails_updated_at
  BEFORE UPDATE ON scheduled_discharge_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_discharge_emails_updated_at();
