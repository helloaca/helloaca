-- Enhance messages table with metadata column and improved indexing
-- This migration adds metadata support and optimizes performance

-- Add metadata column if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add system role support to existing role check constraint
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_role_check;

ALTER TABLE messages 
ADD CONSTRAINT messages_role_check 
CHECK (role IN ('user', 'assistant', 'system'));

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_contract_id_created_at 
ON messages(contract_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_user_id_created_at 
ON messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_role 
ON messages(role);

-- Create GIN index for metadata JSONB column for efficient querying
CREATE INDEX IF NOT EXISTS idx_messages_metadata 
ON messages USING GIN (metadata);

-- Create text search index for content searching
CREATE INDEX IF NOT EXISTS idx_messages_content_search 
ON messages USING GIN (to_tsvector('english', content));

-- Add helpful comment
COMMENT ON COLUMN messages.metadata IS 'JSONB column for storing additional message metadata like tokens used, model version, etc.';
COMMENT ON INDEX idx_messages_content_search IS 'Full-text search index for message content';
COMMENT ON INDEX idx_messages_metadata IS 'GIN index for efficient JSONB metadata queries';