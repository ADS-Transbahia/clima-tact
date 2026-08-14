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
  require_read_confirmation: boolean;
  publish_at: string | null;
  created_at: string;
  author: { name: string } | null;
};

const LIST_COLUMNS =
  "id, type, title, body, cover_image_url, priority, status, require_read_confirmation, publish_at, created_at, author:author_id (name)";

export async function listPublishedCommunications(
  supabase: SupabaseClient,
): Promise<Communication[]> {
  const { data, error } = await supabase
    .from("communications")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("publish_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data as unknown as Communication[];
}

export async function listAllCommunications(
  supabase: SupabaseClient,
): Promise<Communication[]> {
  const { data, error } = await supabase
    .from("communications")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as Communication[];
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
  return data as unknown as Communication | null;
}

export type CommunicationInput = {
  title: string;
  body: string;
  type: CommunicationType;
  priority: CommunicationPriority;
  requireReadConfirmation: boolean;
  coverImageUrl?: string;
};

export async function createCommunication(
  supabase: SupabaseClient,
  companyId: string,
  authorId: string,
  input: CommunicationInput,
  publishNow: boolean,
): Promise<string> {
  const { data, error } = await supabase
    .from("communications")
    .insert({
      company_id: companyId,
      author_id: authorId,
      title: input.title,
      body: input.body,
      type: input.type,
      priority: input.priority,
      require_read_confirmation: input.requireReadConfirmation,
      cover_image_url: input.coverImageUrl || null,
      status: publishNow ? "published" : "draft",
      publish_at: publishNow ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
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
      require_read_confirmation: input.requireReadConfirmation,
      cover_image_url: input.coverImageUrl || null,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function setCommunicationStatus(
  supabase: SupabaseClient,
  id: string,
  status: CommunicationStatus,
) {
  const { data, error } = await supabase
    .from("communications")
    .update({
      status,
      publish_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("company_id, title")
    .single();

  if (error) throw error;
  return data as { company_id: string; title: string };
}

export type ReadStatus = {
  viewed_at: string | null;
  confirmed_at: string | null;
};

export async function getCommunicationReadStatus(
  supabase: SupabaseClient,
  communicationId: string,
  userId: string,
): Promise<ReadStatus | null> {
  const { data, error } = await supabase
    .from("communication_reads")
    .select("viewed_at, confirmed_at")
    .eq("communication_id", communicationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function markCommunicationViewed(
  supabase: SupabaseClient,
  communicationId: string,
  userId: string,
) {
  const { error } = await supabase.from("communication_reads").upsert(
    { communication_id: communicationId, user_id: userId, viewed_at: new Date().toISOString() },
    { onConflict: "communication_id,user_id" },
  );
  if (error) throw error;
}

export async function confirmCommunicationRead(
  supabase: SupabaseClient,
  communicationId: string,
  userId: string,
) {
  const { error } = await supabase.from("communication_reads").upsert(
    { communication_id: communicationId, user_id: userId, confirmed_at: new Date().toISOString() },
    { onConflict: "communication_id,user_id" },
  );
  if (error) throw error;
}
