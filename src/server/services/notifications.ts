import type { SupabaseClient } from "@supabase/supabase-js";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(
  supabase: SupabaseClient,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function countUnreadNotifications(
  supabase: SupabaseClient,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllNotificationsRead(supabase: SupabaseClient) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) throw error;
}

export async function notifyCompanyOfCommunication(
  supabase: SupabaseClient,
  companyId: string,
  title: string,
) {
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (usersError) throw usersError;
  if (!users || users.length === 0) return;

  const rows = users.map((u) => ({
    company_id: companyId,
    user_id: u.id,
    type: "communication",
    title: `Nova comunicação: ${title}`,
    link: "/",
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) throw error;
}
