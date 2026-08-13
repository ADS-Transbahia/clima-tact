import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: "employee" | "hr_admin" | "sms_admin" | "company_admin";
  company: { id: string; name: string } | null;
};

export async function getCurrentProfile(
  supabase: SupabaseClient,
): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, companies:company_id (id, name)")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { companies, ...rest } = data as typeof data & {
    companies: { id: string; name: string } | null;
  };

  return { ...rest, company: companies };
}
