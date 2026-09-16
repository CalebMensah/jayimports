import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("store_settings").select("id").limit(1);

  if (error) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
    }
