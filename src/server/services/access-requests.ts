import type { SupabaseClient } from "@supabase/supabase-js";

export type AccessRequestStatus = "pending" | "approved" | "rejected";

export type AccessRequest = {
  id: string;
  full_name: string;
  cpf: string;
  email: string;
  department: string | null;
  status: AccessRequestStatus;
  requested_at: string;
  reviewed_at: string | null;
};

export async function listAccessRequests(
  supabase: SupabaseClient,
): Promise<AccessRequest[]> {
  const { data, error } = await supabase
    .from("access_requests")
    .select("id, full_name, cpf, email, department, status, requested_at, reviewed_at")
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return data;
}

export type SignupInput = {
  fullName: string;
  cpf: string;
  email: string;
  password: string;
  department: string;
};

// Roda inteiramente no client admin: quem está preenchendo esse formulario
// ainda não tem sessão/perfil, então não existe RLS de usuário aplicavel.
export async function submitAccessRequest(
  admin: SupabaseClient,
  companyId: string,
  input: SignupInput,
) {
  const cpfDigits = input.cpf.replace(/\D/g, "");

  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("email", input.email)
    .eq("company_id", companyId)
    .maybeSingle();
  if (existingUser) throw new Error("Já existe uma conta ativa com esse e-mail.");

  const { data: existingRequest } = await admin
    .from("access_requests")
    .select("id")
    .or(`email.eq.${input.email},cpf.eq.${cpfDigits}`)
    .in("status", ["pending", "approved"])
    .maybeSingle();
  if (existingRequest) {
    throw new Error("Já existe uma solicitação em andamento com esse e-mail ou CPF.");
  }

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message);

  const { error } = await admin.from("access_requests").insert({
    company_id: companyId,
    auth_user_id: authUser.user.id,
    full_name: input.fullName,
    cpf: cpfDigits,
    email: input.email,
    department: input.department || null,
  });

  if (error) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw error;
  }
}

export async function approveAccessRequest(
  admin: SupabaseClient,
  requestId: string,
  reviewerId: string,
) {
  const { data: request, error } = await admin
    .from("access_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (error) throw error;
  if (request.status !== "pending") throw new Error("Solicitação já foi analisada.");
  if (!request.auth_user_id) throw new Error("Solicitação sem usuário de autenticação associado.");

  const { error: userError } = await admin.from("users").insert({
    id: request.auth_user_id,
    company_id: request.company_id,
    name: request.full_name,
    email: request.email,
    role: "employee",
  });
  if (userError) throw userError;

  const { error: updateError } = await admin
    .from("access_requests")
    .update({ status: "approved", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (updateError) throw updateError;
}

export async function rejectAccessRequest(
  admin: SupabaseClient,
  requestId: string,
  reviewerId: string,
) {
  const { data: request, error } = await admin
    .from("access_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (error) throw error;
  if (request.status !== "pending") throw new Error("Solicitação já foi analisada.");

  if (request.auth_user_id) {
    await admin.auth.admin.deleteUser(request.auth_user_id);
  }

  const { error: updateError } = await admin
    .from("access_requests")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      auth_user_id: null,
    })
    .eq("id", requestId);
  if (updateError) throw updateError;
}
