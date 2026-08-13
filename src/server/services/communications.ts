import type { SupabaseClient } from "@supabase/supabase-js";

export type Communication = {
  id: string;
  type: "news" | "announcement";
  title: string;
  body: string;
  cover_image_url: string | null;
  priority: "normal" | "high";
  publish_at: string | null;
  created_at: string;
};

export async function listPublishedCommunications(
  supabase: SupabaseClient,
): Promise<Communication[]> {
  const { data, error } = await supabase
    .from("communications")
    .select("id, type, title, body, cover_image_url, priority, publish_at, created_at")
    .eq("status", "published")
    .order("publish_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}
