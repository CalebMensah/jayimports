import type { SupabaseClient } from "@supabase/supabase-js";

export type CurrentBatch = {
  id: string;
  name: string;
  target_closes_at: string | null;
  opened_at: string;
} | null;

export async function getCurrentBatch(supabase: SupabaseClient): Promise<CurrentBatch> {
  const { data } = await supabase
    .from("preorder_batches")
    .select("id, name, target_closes_at, opened_at")
    .eq("status", "open")
    .maybeSingle();

  return data;
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
