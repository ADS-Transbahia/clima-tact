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

function parseInput(formData: FormData): CommunicationInput | null {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const type = String(formData.get("type") ?? "news");
  const priority = String(formData.get("priority") ?? "normal");

  if (!title || !body) return null;
  if (type !== "news" && type !== "announcement") return null;
  if (priority !== "normal" && priority !== "high") return null;

  return { title, body, type, priority };
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

  try {
    await createCommunication(supabase, profile.company_id, user.id, input, publishNow);
    if (publishNow) {
      await notifyCompanyOfCommunication(supabase, profile.company_id, input.title);
    }
  } catch (error) {
    return error instanceof Error ? error.message : "Erro ao salvar.";
  }

  revalidatePath("/admin/communications");
  revalidatePath("/");
  redirect("/admin/communications");
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
  redirect("/admin/communications");
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
