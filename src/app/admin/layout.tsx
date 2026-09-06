import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <>{children}</>;
  }

  const { data: adminRecord } = await supabase
    .from("admin_users")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!adminRecord) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  return <AdminShell adminName={adminRecord.full_name}>{children}</AdminShell>;
}