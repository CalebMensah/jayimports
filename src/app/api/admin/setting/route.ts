import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const settingsSchema = z.object({
  business_name: z.string().trim().min(2).max(150),
  momo_number: z.string().trim().regex(/^0\d{9}$/, "Enter a valid 10-digit number"),
  momo_network: z.enum(["MTN", "Vodafone", "AirtelTigo"]),
  contact_phone: z.string().trim().regex(/^0\d{9}$/, "Enter a valid 10-digit number"),
  contact_email: z.string().email(),
  pickup_address: z.string().trim().max(300),
  delivery_fee_default: z.coerce.number().min(0),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("store_settings").select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ settings: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: existing } = await supabase.from("store_settings").select("id").single();

  const { data, error } = await supabase
    .from("store_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", existing?.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ settings: data });
}