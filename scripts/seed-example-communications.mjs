// Popula duas comunicações de exemplo (RH e SMS) para demonstrar os
// tipos de conteúdo do módulo. Conteúdo fictício, só para exemplo.
// Uso: node --env-file=.env.local scripts/seed-example-communications.mjs
import { createClient } from "@supabase/supabase-js";

const COMPANY_SLUG = "transbahia";
const ADMIN_EMAIL = "kaiogreend@gmail.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: company, error: companyError } = await supabase
  .from("companies")
  .select("id")
  .eq("slug", COMPANY_SLUG)
  .single();
if (companyError || !company) {
  console.error("Empresa não encontrada:", companyError?.message ?? COMPANY_SLUG);
  process.exit(1);
}

const { data: admin, error: adminError } = await supabase
  .from("users")
  .select("id")
  .eq("email", ADMIN_EMAIL)
  .single();
if (adminError || !admin) {
  console.error("Admin não encontrado:", adminError?.message ?? ADMIN_EMAIL);
  process.exit(1);
}

const now = new Date().toISOString();

const items = [
  {
    type: "news",
    title: "Mês dos Pais 💙",
    body: "Agosto é o mês em que celebramos os pais da nossa equipe! Ao longo do mês, o RH vai promover ações especiais para homenagear os papais da Transbahia — fique de olho nos próximos comunicados. Um agradecimento carinhoso a todos os pais que fazem parte da nossa família.",
    priority: "normal",
  },
  {
    type: "announcement",
    title: "Lembrete de Segurança: uso correto de EPIs",
    body: "A SMS reforça a importância do uso correto dos Equipamentos de Proteção Individual (EPIs) em todas as atividades operacionais. Em caso de dúvidas sobre qual EPI é adequado para sua função, procure a equipe de Segurança e Medicina do Trabalho.",
    priority: "high",
  },
];

for (const item of items) {
  const { error } = await supabase.from("communications").insert({
    company_id: company.id,
    author_id: admin.id,
    type: item.type,
    title: item.title,
    body: item.body,
    priority: item.priority,
    status: "published",
    publish_at: now,
  });
  if (error) {
    console.error("Erro ao criar comunicação:", item.title, error.message);
    process.exit(1);
  }
  console.log("Criada:", item.title);
}
