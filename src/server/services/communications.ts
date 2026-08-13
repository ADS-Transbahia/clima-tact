import type { SupabaseClient } from "@supabase/supabase-js";

export type CommunicationType = "news" | "announcement";
export type CommunicationStatus = "draft" | "scheduled" | "published" | "archived";
export type CommunicationPriority = "normal" | "high";

export type Communication = {
  id: string;
  type: CommunicationType;
  title: string;
  body: string;
  cover_image_url: string | null;
  priority: CommunicationPriority;
  status: CommunicationStatus;
  publish_at: string | null;
  created_at: string;
};

const LIST_COLUMNS =
  "id, type, title, body, cover_image_url, priority, status, publish_at, created_at";

export async function listPublishedCommunications(
  supabase: SupabaseClient,
): Promise<Communication[]> {
  const { data, error } = await supabase
    .from("communications")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("publish_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function listAllCommunications(
  supabase: SupabaseClient,
): Promise<Communication[]> {
  const { data, error } = await supabase
    .from("communications")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCommunication(
  supabase: SupabaseClient,
  id: string,
): Promise<Communication | null> {
  const { data, error } = await supabase
    .from("communications")
    .select(LIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type CommunicationInput = {
  title: string;
  body: string;
  type: CommunicationType;
  priority: CommunicationPriority;
};

export async function createCommunication(
  supabase: SupabaseClient,
  companyId: string,
  authorId: string,
  input: CommunicationInput,
  publishNow: boolean,
) {
  const { error } = await supabase.from("communications").insert({
    company_id: companyId,
    author_id: authorId,
    title: input.title,
    body: input.body,
    type: input.type,
    priority: input.priority,
    status: publishNow ? "published" : "draft",
    publish_at: publishNow ? new Date().toISOString() : null,
  });

  if (error) throw error;
}

export async function updateCommunication(
  supabase: SupabaseClient,
  id: string,
  input: CommunicationInput,
) {
  const { error } = await supabase
    .from("communications")
    .update({
      title: input.title,
      body: input.body,
      type: input.type,
      priority: input.priority,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function setCommunicationStatus(
  supabase: SupabaseClient,
  id: string,
  status: CommunicationStatus,
) {
  const { error } = await supabase
    .from("communications")
    .update({
      status,
      publish_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw error;
}
