"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCommunication,
  updateCommunication,
  setCommunicationStatus,
  type CommunicationInput,
  type CommunicationStatus,
} from "@/server/services/communications";
import { notifyCompanyOfCommunication } from "@/server/services/notifications";
import {
  addBlock,
  deleteBlock,
  listBlocks,
  type BlockType,
} from "@/server/services/communication-blocks";

function parseInput(formData: FormData): CommunicationInput | null {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const type = String(formData.get("type") ?? "news");
  const priority = String(formData.get("priority") ?? "normal");
  const requireReadConfirmation = formData.get("requireReadConfirmation") === "on";
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim();

  if (!title || !body) return null;
  if (type !== "news" && type !== "announcement") return null;
  if (priority !== "normal" && priority !== "high") return null;

  return { title, body, type, priority, requireReadConfirmation, coverImageUrl };
}

export async function createCommunicationAction(
  _prevState: string | null,
  formData: FormData,
) {
  const input = parseInput(formData);
  if (!input) return "Preencha título e corpo da comunicação.";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile) return "Perfil não encontrado.";

  const publishNow = formData.get("publish") === "on";
  let id: string;

  try {
    id = await createCommunication(supabase, profile.company_id, user.id, input, publishNow);
    if (publishNow) {
      await notifyCompanyOfCommunication(supabase, profile.company_id, input.title);
    }
  } catch (error) {
    return error instanceof Error ? error.message : "Erro ao salvar.";
  }

  revalidatePath("/admin/communications");
  revalidatePath("/");
  redirect(`/admin/communications/${id}`);
}

export async function updateCommunicationAction(
  _prevState: string | null,
  formData: FormData,
) {
  const id = String(formData.get("id") ?? "");
  const input = parseInput(formData);
  if (!id || !input) return "Preencha título e corpo da comunicação.";

  const supabase = await createClient();

  try {
    await updateCommunication(supabase, id, input);
  } catch (error) {
    return error instanceof Error ? error.message : "Erro ao salvar.";
  }

  revalidatePath("/admin/communications");
  revalidatePath("/");
  redirect(`/admin/communications/${id}`);
}

export async function changeCommunicationStatus(id: string, status: CommunicationStatus) {
  const supabase = await createClient();
  const communication = await setCommunicationStatus(supabase, id, status);
  if (status === "published") {
    await notifyCompanyOfCommunication(supabase, communication.company_id, communication.title);
  }
  revalidatePath("/admin/communications");
  revalidatePath("/");
  revalidatePath("/notifications");
}

function parseBlockConfig(type: BlockType, formData: FormData): Record<string, string | string[]> | null {
  if (type === "text") {
    const text = String(formData.get("blockText") ?? "").trim();
    if (!text) return null;
    return { text };
  }
  if (type === "image") {
    const url = String(formData.get("blockUrl") ?? "").trim();
    const caption = String(formData.get("blockCaption") ?? "").trim();
    if (!url) return null;
    return { url, caption };
  }
  if (type === "file") {
    const url = String(formData.get("blockUrl") ?? "").trim();
    const label = String(formData.get("blockLabel") ?? "").trim() || "Baixar arquivo";
    if (!url) return null;
    return { url, label };
  }
  if (type === "button") {
    const url = String(formData.get("blockUrl") ?? "").trim();
    const label = String(formData.get("blockLabel") ?? "").trim();
    if (!url || !label) return null;
    return { url, label };
  }
  if (type === "checklist") {
    const items = String(formData.get("blockItems") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) return null;
    return { items };
  }
  return null;
}

export async function addBlockAction(
  communicationId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const type = String(formData.get("blockType") ?? "") as BlockType;
  const config = parseBlockConfig(type, formData);
  if (!config) return "Preencha os campos obrigatórios do bloco.";

  const supabase = await createClient();

  try {
    const existing = await listBlocks(supabase, communicationId);
    await addBlock(supabase, communicationId, existing.length, { type, config });
  } catch (error) {
    return error instanceof Error ? error.message : "Erro ao adicionar bloco.";
  }

  revalidatePath(`/admin/communications/${communicationId}`);
  revalidatePath(`/communications/${communicationId}`);
  return null;
}

export async function deleteBlockAction(communicationId: string, blockId: string) {
  const supabase = await createClient();
  await deleteBlock(supabase, blockId);
  revalidatePath(`/admin/communications/${communicationId}`);
  revalidatePath(`/communications/${communicationId}`);
}
