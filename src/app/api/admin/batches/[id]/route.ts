import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.action === "close") {
    const { data: batch, error } = await supabase
      .from("preorder_batches")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "open")
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Could not close batch" }, { status: 500 });
    return NextResponse.json({ batch });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
