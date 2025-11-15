-- Migration: Create normalized_data table for entity extraction storage
-- Purpose: Store extracted clinical entities that will be used for generating SOAP notes, discharge summaries, etc.
-- Date: 2025-01-14

-- Create normalized_data table
CREATE TABLE IF NOT EXISTS normalized_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Extracted entities (JSON blob with patient, clinical, confidence)
  entities JSONB NOT NULL,

  -- Original input preserved for reference
  original_input TEXT NOT NULL,

  -- Hint about what type of input this was
  input_type TEXT DEFAULT 'other',

  -- Overall confidence score (0-1)
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_normalized_data_case_id ON normalized_data(case_id);
CREATE INDEX IF NOT EXISTS idx_normalized_data_user_id ON normalized_data(user_id);
CREATE INDEX IF NOT EXISTS idx_normalized_data_created_at ON normalized_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_normalized_data_confidence ON normalized_data(confidence_score);

-- Create GIN index for JSONB queries on entities
CREATE INDEX IF NOT EXISTS idx_normalized_data_entities_gin ON normalized_data USING GIN (entities);

-- Enable Row Level Security
ALTER TABLE normalized_data ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own normalized data
CREATE POLICY "Users can view their own normalized data"
  ON normalized_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own normalized data
CREATE POLICY "Users can insert their own normalized data"
  ON normalized_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own normalized data
CREATE POLICY "Users can update their own normalized data"
  ON normalized_data
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own normalized data
CREATE POLICY "Users can delete their own normalized data"
  ON normalized_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_normalized_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER set_normalized_data_updated_at
  BEFORE UPDATE ON normalized_data
  FOR EACH ROW
  EXECUTE FUNCTION update_normalized_data_updated_at();

-- Add comment to table for documentation
COMMENT ON TABLE normalized_data IS 'Stores extracted clinical entities from veterinary visit transcripts, SOAP notes, etc. Used as source data for generating SOAP notes, discharge summaries, and other documents.';

COMMENT ON COLUMN normalized_data.entities IS 'JSON blob containing extracted patient info, clinical details, diagnoses, medications, etc.';

COMMENT ON COLUMN normalized_data.original_input IS 'Original transcript/SOAP note/clinical text that was normalized';

COMMENT ON COLUMN normalized_data.input_type IS 'Type of input: transcript, soap_note, visit_notes, discharge_summary, other';

COMMENT ON COLUMN normalized_data.confidence_score IS 'Overall AI confidence score for the extracted entities (0.0 to 1.0)';
