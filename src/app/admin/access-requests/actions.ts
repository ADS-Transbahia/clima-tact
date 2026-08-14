"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveAccessRequest, rejectAccessRequest } from "@/server/services/access-requests";

const REVIEWER_ROLES = new Set(["hr_admin", "company_admin"]);

async function requireReviewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !REVIEWER_ROLES.has(profile.role)) {
    throw new Error("Sem permissão para aprovar acessos.");
  }

  return user.id;
}

export async function approveAccessRequestAction(requestId: string) {
  const reviewerId = await requireReviewer();
  const admin = createAdminClient();
  await approveAccessRequest(admin, requestId, reviewerId);
  revalidatePath("/admin/access-requests");
}

export async function rejectAccessRequestAction(requestId: string) {
  const reviewerId = await requireReviewer();
  const admin = createAdminClient();
  await rejectAccessRequest(admin, requestId, reviewerId);
  revalidatePath("/admin/access-requests");
}
