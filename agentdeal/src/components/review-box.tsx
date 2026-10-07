import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { submitReview } from "@/lib/support.functions";
import { StarPicker, Stars } from "@/components/rating";

/** Shown on a completed deal: the buyer rates the seller once; everyone else sees the review. */
export function ReviewBox({ conversationId, isBuyer, sellerName }: { conversationId: string; isBuyer: boolean; sellerName: string }) {
  const qc = useQueryClient(); const send = useServerFn(submitReview);
  const { data: review, isLoading } = useQuery({ queryKey: ["review", conversationId], queryFn: async () => (await supabase.from("reviews").select("rating, comment, created_at").eq("conversation_id", conversationId).maybeSingle()).data });
  const [rating, setRating] = useState(0); const [comment, setComment] = useState(""); const [busy, setBusy] = useState(false);
  if (isLoading) return null;
  if (review) return <div className="mt-4 rounded-xl border p-4"><p className="text-xs text-muted-foreground">{isBuyer ? "Your review" : "Buyer's review"}</p><div className="mt-1.5"><Stars value={review.rating} /></div>{review.comment && <p className="mt-2 text-sm">{review.comment}</p>}</div>;
  if (!isBuyer) return <p className="mt-3 text-xs text-muted-foreground">The buyer hasn't left a review yet.</p>;
  const submit = async () => {
    if (!rating) { toast.error("Pick a star rating first."); return; }
    setBusy(true);
    try { await send({ data: { conversationId, rating, comment } }); await qc.invalidateQueries({ queryKey: ["review", conversationId] }); toast.success("Thanks — your review is public on the seller's profile."); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  return <div className="mt-4 space-y-3 rounded-xl border p-4">
    <p className="text-sm font-medium">How was working with {sellerName}?</p>
    <StarPicker value={rating} onChange={setRating} />
    <textarea rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share what went well or what could be better (optional)" aria-label="Review comment" className="w-full rounded-md border bg-background p-3 text-sm" />
    <Button className="w-full" disabled={busy} onClick={submit}>{busy && <Loader2 className="animate-spin" />}Publish review</Button>
    <p className="text-[11px] text-muted-foreground">Reviews are public and can't be edited after publishing.</p>
  </div>;
}
