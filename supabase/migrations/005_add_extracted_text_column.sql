-- Add extracted_text column to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN contracts.extracted_text IS 'Stores the extracted text content from uploaded contract files for AI analysis';

-- Create an index on extracted_text for better search performance (optional)
-- CREATE INDEX IF NOT EXISTS idx_contracts_extracted_text ON contracts USING gin(to_tsvector('english', extracted_text));