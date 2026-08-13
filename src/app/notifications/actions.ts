"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/server/services/notifications";

export async function markReadAction(id: string) {
  const supabase = await createClient();
  await markNotificationRead(supabase, id);
  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function markAllReadAction() {
  const supabase = await createClient();
  await markAllNotificationsRead(supabase);
  revalidatePath("/notifications");
  revalidatePath("/");
}
