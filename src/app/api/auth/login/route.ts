import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimitKey = `login:${ip}:${email}`;

  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((retryAfterMs ?? 0) / 60000)} minutes.` },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}