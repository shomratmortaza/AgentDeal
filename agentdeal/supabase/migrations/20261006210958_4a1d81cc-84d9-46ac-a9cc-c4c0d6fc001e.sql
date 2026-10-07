CREATE TABLE public.direct_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.provider_agents(id) ON DELETE CASCADE,
  seller_id uuid,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, agent_id)
);
GRANT SELECT ON public.direct_threads TO authenticated;
GRANT ALL ON public.direct_threads TO service_role;
ALTER TABLE public.direct_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read threads" ON public.direct_threads FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER direct_threads_updated BEFORE UPDATE ON public.direct_threads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.in_thread(_thread uuid, _uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ select exists (select 1 from public.direct_threads where id=_thread and (buyer_id=_uid or seller_id=_uid)) $$;
REVOKE EXECUTE ON FUNCTION public.in_thread(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.in_thread(uuid, uuid) TO authenticated;

CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.direct_threads(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_kind text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read direct messages" ON public.direct_messages FOR SELECT TO authenticated
  USING (public.in_thread(thread_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants send direct messages" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND sender_kind IN ('buyer','seller') AND public.in_thread(thread_id, auth.uid())
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.blocked));

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;