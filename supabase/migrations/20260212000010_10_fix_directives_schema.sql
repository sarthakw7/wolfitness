-- Add missing column to track completion timing
ALTER TABLE directives ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
