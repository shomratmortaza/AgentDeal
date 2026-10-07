ALTER TABLE public.provider_agents DROP CONSTRAINT IF EXISTS provider_agents_owner_id_key;
CREATE INDEX IF NOT EXISTS provider_agents_owner_id_idx ON public.provider_agents (owner_id);