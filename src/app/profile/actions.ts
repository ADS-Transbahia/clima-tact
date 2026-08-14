"use server";

import { createClient } from "@/lib/supabase/server";

export async function changePasswordAction(_prevState: string | null, formData: FormData) {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (newPassword !== confirmPassword) return "As senhas não conferem.";

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return error.message;

  return "success";
}
