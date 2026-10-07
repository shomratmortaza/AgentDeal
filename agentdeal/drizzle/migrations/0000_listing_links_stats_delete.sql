ALTER TABLE public.provider_agents
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS github text,
  ADD COLUMN IF NOT EXISTS behance text,
  ADD COLUMN IF NOT EXISTS dribbble text,
  ADD COLUMN IF NOT EXISTS portfolio_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE public.listing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.provider_agents(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('view','contact','link')),
  visitor text NOT NULL,
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listing_events_agent_idx ON public.listing_events(agent_id, created_at);
GRANT SELECT ON public.listing_events TO authenticated;
GRANT ALL ON public.listing_events TO service_role;
ALTER TABLE public.listing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own listing events" ON public.listing_events FOR SELECT TO authenticated
  USING (public.owns_agent(agent_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));