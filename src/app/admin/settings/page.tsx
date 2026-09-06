import { PageHeader } from "@/components/admin/PageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("store_settings").select("*").single();

  if (!settings) {
    return (
      <div>
        <PageHeader title="Settings" description="Manage your store configuration" />
        <p className="text-sm text-red-600">
          No store settings found. Run the seed SQL from the database setup step.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your store configuration" />
      <SettingsForm settings={settings} />
    </div>
  );
}