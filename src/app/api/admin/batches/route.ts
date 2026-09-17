import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: batches, error } = await supabase
    .from("preorder_batches")
    .select("*, orders(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count: waitingCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .is("batch_id", null);

  return NextResponse.json({ batches, waitingCount: waitingCount ?? 0 });
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  target_closes_at: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: existingOpen } = await supabase
    .from("preorder_batches")
    .select("id")
    .eq("status", "open")
    .maybeSingle();

  if (existingOpen) {
    return NextResponse.json({ error: "A batch is already open. Close it before starting a new one." }, { status: 400 });
  }

  const { data: batch, error } = await supabase
    .from("preorder_batches")
    .insert({
      name: parsed.data.name,
      status: "open",
      target_closes_at: parsed.data.target_closes_at || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-assign every order that was waiting for the next batch
  await supabase.from("orders").update({ batch_id: batch.id }).is("batch_id", null);

  return NextResponse.json({ batch }, { status: 201 });
}
