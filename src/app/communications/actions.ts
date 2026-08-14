"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { confirmCommunicationRead } from "@/server/services/communications";

export async function confirmReadAction(communicationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await confirmCommunicationRead(supabase, communicationId, user.id);
  revalidatePath(`/communications/${communicationId}`);
}
