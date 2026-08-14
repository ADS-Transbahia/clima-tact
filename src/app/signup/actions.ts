"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { submitAccessRequest } from "@/server/services/access-requests";
import { isValidCpf } from "@/lib/cpf";

const COMPANY_SLUG = "transbahia";

export async function signupAction(_prevState: string | null, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const department = String(formData.get("department") ?? "").trim();

  if (!fullName || !cpf || !email || !password || !department) {
    return "Preencha todos os campos.";
  }
  if (!isValidCpf(cpf)) return "CPF inválido.";
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (password !== confirmPassword) return "As senhas não conferem.";

  const admin = createAdminClient();

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id")
    .eq("slug", COMPANY_SLUG)
    .single();
  if (companyError || !company) return "Empresa não encontrada.";

  try {
    await submitAccessRequest(admin, company.id, {
      fullName,
      cpf,
      email,
      password,
      department,
    });
  } catch (error) {
    return error instanceof Error ? error.message : "Erro ao enviar solicitação.";
  }

  return "success";
}
