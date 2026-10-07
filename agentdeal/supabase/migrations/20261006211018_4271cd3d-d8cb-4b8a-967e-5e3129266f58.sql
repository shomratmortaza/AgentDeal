DROP POLICY "Participants read direct messages" ON public.direct_messages;
DROP POLICY "Participants send direct messages" ON public.direct_messages;
CREATE POLICY "Participants read direct messages" ON public.direct_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.direct_threads t WHERE t.id = thread_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants send direct messages" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND sender_kind IN ('buyer','seller')
    AND EXISTS (SELECT 1 FROM public.direct_threads t WHERE t.id = thread_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid()))
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.blocked));
DROP FUNCTION public.in_thread(uuid, uuid);