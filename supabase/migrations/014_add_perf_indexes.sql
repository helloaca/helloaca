-- Performance indexes for common query patterns

-- Enable pg_trgm for fast ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Messages: filter by contract_id and order by created_at
CREATE INDEX IF NOT EXISTS idx_messages_contract_created_at
  ON public.messages (contract_id, created_at);

-- Messages: accelerate ILIKE on content
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm
  ON public.messages USING GIN (content gin_trgm_ops);

-- Contracts: typical filters and sorts
CREATE INDEX IF NOT EXISTS idx_contracts_user_created_at
  ON public.contracts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_upload_date
  ON public.contracts (upload_date DESC);

-- Reports: typical filters
CREATE INDEX IF NOT EXISTS idx_reports_user_created_at
  ON public.reports (user_id, created_at DESC);

-- Team members: list by owner and sort by creation time
CREATE INDEX IF NOT EXISTS idx_team_members_owner_created_at
  ON public.team_members (owner_id, created_at DESC);
