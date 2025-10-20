-- Fix reports table schema - add missing contract_id field
-- This migration adds the contract_id field that was referenced in RLS policies but missing from the table

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_contract_id ON reports(contract_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Update RLS policies to ensure they work correctly with the new field
-- (The policies were already correct, just the field was missing)