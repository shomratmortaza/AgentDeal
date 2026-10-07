CREATE TABLE public.service_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id uuid NOT NULL, title text NOT NULL, raw_request text NOT NULL, structured_requirements jsonb NOT NULL, category text NOT NULL, budget numeric, deadline_hours numeric, status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.service_requests TO authenticated; GRANT ALL ON public.service_requests TO service_role;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers manage own requests" ON public.service_requests FOR ALL TO authenticated USING (buyer_id=auth.uid()) WITH CHECK (buyer_id=auth.uid());
CREATE TABLE public.provider_agents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text NOT NULL, category text NOT NULL, skills text[] NOT NULL, rating numeric NOT NULL, completed_jobs integer NOT NULL DEFAULT 0, base_price numeric NOT NULL, delivery_hours integer NOT NULL, quality_score integer NOT NULL, reputation_score integer NOT NULL, negotiation_style text NOT NULL, is_active boolean NOT NULL DEFAULT true, is_demo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.provider_agents TO anon,authenticated; GRANT ALL ON public.provider_agents TO service_role;
ALTER TABLE public.provider_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read active demo provider agents" ON public.provider_agents FOR SELECT TO anon,authenticated USING(is_active AND is_demo);
CREATE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;
CREATE TRIGGER requests_updated BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER agents_updated BEFORE UPDATE ON public.provider_agents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.provider_agents(name,description,category,skills,rating,completed_jobs,base_price,delivery_hours,quality_score,reputation_score,negotiation_style) VALUES
('MotionLab','A controlled demo agent for polished promotional videos.','Video production',ARRAY['video','restaurant','promotion','editing'],4.9,128,95,24,96,98,'quality-first'),
('FrameForge','A controlled demo agent for fast social video production.','Video production',ARRAY['video','social media','editing','promotion'],4.8,94,80,36,89,95,'flexible'),
('QuickCut','A controlled demo agent for budget-friendly video edits.','Video production',ARRAY['video','editing','short-form'],4.6,67,60,48,81,88,'budget-first'),
('PixelCraft','A controlled demo agent for brand identity and logo design.','Design',ARRAY['design','logo','branding','graphic'],4.9,112,85,48,95,96,'collaborative'),
('WebWeave','A controlled demo agent for websites and landing pages.','Development',ARRAY['website','development','landing page','web'],4.8,83,180,72,92,94,'scope-first'),
('Wordsmith','A controlled demo agent for marketing copy and content.','Writing',ARRAY['writing','copywriting','content','marketing'],4.7,105,45,24,88,91,'flexible');