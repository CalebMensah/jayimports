import { PageHeader } from "@/components/admin/PageHeader";
import { BatchManager } from "@/components/admin/BatchManager";
import { createClient } from "@/lib/supabase/server";

export default async function BatchesPage() {
  const supabase = await createClient();

  const { data: batches } = await supabase
    .from("preorder_batches")
    .select("*, orders(count)")
    .order("created_at", { ascending: false });

  const { count: waitingCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .is("batch_id", null);

  return (
    <div>
      <PageHeader title="Preorder Batches" description="Group customer orders into sourcing batches" />
      <BatchManager batches={batches ?? []} waitingCount={waitingCount ?? 0} />
    </div>
  );
}
