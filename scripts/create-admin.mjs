// Provisiona o primeiro company_admin de uma empresa (bootstrap — não há
// auto-cadastro no produto). Uso:
//   node --env-file=.env.local scripts/create-admin.mjs <company_slug> "<nome>" <email>
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const [, , companySlug, name, email] = process.argv;

if (!companySlug || !name || !email) {
  console.error(
    'Uso: node --env-file=.env.local scripts/create-admin.mjs <company_slug> "<nome>" <email>',
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: company, error: companyError } = await supabase
  .from("companies")
  .select("id")
  .eq("slug", companySlug)
  .single();

if (companyError || !company) {
  console.error("Empresa não encontrada:", companyError?.message ?? companySlug);
  process.exit(1);
}

const password = randomBytes(9).toString("base64url");

const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (authError) {
  console.error("Erro ao criar usuário de autenticação:", authError.message);
  process.exit(1);
}

const { error: profileError } = await supabase.from("users").insert({
  id: authUser.user.id,
  company_id: company.id,
  name,
  email,
  role: "company_admin",
});

if (profileError) {
  console.error("Erro ao criar perfil:", profileError.message);
  process.exit(1);
}

console.log("Usuário criado com sucesso.");
console.log("Email:", email);
console.log("Senha temporária:", password);
