// Popula a Pesquisa de Clima Organizacional real da Transbahia (extraída
// de "35. PESQUISA DE CLIMA ORGANIZACIONAL Rev. 05.xlsx"). Cria a pesquisa
// como rascunho — o admin revisa e ativa manualmente pelo painel.
// Uso: node --env-file=.env.local scripts/seed-climate-survey.mjs
import { createClient } from "@supabase/supabase-js";

const COMPANY_SLUG = "transbahia";
const ADMIN_EMAIL = "kaiogreend@gmail.com";

const SCALE_5 = ["Sempre", "Quase sempre", "Raramente", "Nunca", "Não tenho opinião"];
const SCALE_3_QUALIDADE = ["Adequadamente", "Razoavelmente", "Inadequadamente"];
const SIM_NAO_MAIS = ["Sim", "Não", "Mais ou menos"];

const SECTIONS = [
  ["Identificação", [{ text: "Setor", type: "text", required: true }]],
  ["Autonomia", [
    { text: "Você tem liberdade para fazer o seu trabalho da forma como considera melhor?", type: "single_choice", options: SCALE_5 },
    { text: "A Transbahia exige um procedimento rígido para execução das atividades pertinentes as suas funções?", type: "single_choice", options: SCALE_5 },
    { text: "Você que organiza sua rotina de trabalho para melhor aproveitamento de suas atividades?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Responsabilidade", [
    { text: "Até que ponto você cumpre as responsabilidades que são destinadas à sua função?", type: "single_choice", options: SCALE_5 },
    { text: "Você percebe sua contribuição para o sucesso da Transbahia?", type: "yes_no" },
    { text: "Você desempenha seu trabalho buscando obter resultados melhores do que aqueles esperados pela Transbahia?", type: "single_choice", options: SCALE_5 },
    { text: "Você se considera comprometido com suas atividades?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Realização profissional", [
    { text: "Você está satisfeito com o seu cargo?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "O seu trabalho lhe dá um sentimento de realização profissional?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Quantidade e qualidade de trabalho", [
    { text: "Você se sente satisfeito em relação ao volume de trabalho que realiza?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "A qualidade do trabalho é considerada mais importante do que a sua quantidade?", type: "single_choice", options: SCALE_5 },
    { text: "Você acha que o seu trabalho realizado atualmente poderia ser melhorado?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Comunicação", [
    { text: "Com que frequência a direção da empresa se comunica com seus funcionários?", type: "single_choice", options: SCALE_5 },
    { text: "Os funcionários sentem-se seguros em dizer o que pensam?", type: "single_choice", options: SCALE_5 },
    { text: "A Transbahia é aberta a receber e reconhecer as críticas, opiniões e contribuições de seus funcionários?", type: "single_choice", options: SCALE_5 },
    { text: "As orientações que você recebe sobre o seu trabalho são claras e objetivas?", type: "single_choice", options: SCALE_5 },
    { text: "Como seu superior se comunica com você?", type: "single_choice", options: SCALE_3_QUALIDADE },
  ]],
  ["Remuneração", [
    { text: "Você está satisfeito com o seu salário atual?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "Você considera a sua remuneração adequada ao trabalho que você faz?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "Você acha que a Transbahia remunera adequadamente os funcionários?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Carreira", [
    { text: "Você acredita na oportunidade de crescimento em sua carreira?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "Você se sente apto para assumir maiores ou mais responsabilidades?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "Você gostaria de trabalhar em outro setor da empresa?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "A Transbahia oferece oportunidades para o seu desenvolvimento e crescimento profissional?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Relacionamento com a chefia", [
    { text: "Você se sente respeitado pelo seu superior?", type: "single_choice", options: SCALE_5 },
    { text: "Você respeita seu superior?", type: "single_choice", options: SCALE_5 },
    { text: "Você considera seu superior direto um bom profissional?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "O seu chefe/gestor/gerente é receptivo às sugestões de mudança?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Relacionamento interpessoal", [
    { text: "Existe um relacionamento de cooperação entre os setores da empresa?", type: "yes_no" },
    { text: "Como você considera o relacionamento entre os funcionários da Transbahia?", type: "single_choice", options: SCALE_3_QUALIDADE },
  ]],
  ["Valorização profissional", [
    { text: "Você se sente valorizado pela Transbahia?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "Você considera que o seu potencial de realização profissional tem sido adequadamente aproveitado?", type: "single_choice", options: SCALE_5 },
    { text: "A Transbahia reconhece os bons funcionários?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Treinamento e desenvolvimento", [
    { text: "Você recebeu o devido treinamento para a execução de seu cargo?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "A Transbahia investe em treinamentos necessários para o desenvolvimento profissional e pessoal de seus funcionários?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "O treinamento que você recebe o capacita a fazer bem o seu trabalho?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "A Transbahia investe em treinamento/desenvolvimento para que você tenha um aprendizado contínuo?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Estabilidade no emprego", [
    { text: "Você se sente seguro em relação à estabilidade de seu emprego?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "Os funcionários da Transbahia sentem-se seguros quanto à estabilidade no emprego?", type: "single_choice", options: SIM_NAO_MAIS },
  ]],
  ["Condições físicas de trabalho", [
    { text: "As condições ambientais do seu local de trabalho são satisfatórias? — Temperatura", type: "yes_no" },
    { text: "As condições ambientais do seu local de trabalho são satisfatórias? — Espaço", type: "yes_no" },
    { text: "As condições ambientais do seu local de trabalho são satisfatórias? — Mobiliário", type: "yes_no" },
    { text: "As condições ambientais do seu local de trabalho são satisfatórias? — Higiene", type: "yes_no" },
    { text: "As condições ambientais do seu local de trabalho são satisfatórias? — Instalações sanitárias", type: "yes_no" },
  ]],
  ["Imagem da empresa", [
    { text: "Considera a Transbahia um bom lugar para trabalhar?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "Você indicaria um amigo para trabalhar na sua empresa?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "Você considera a Transbahia ética com seus funcionários/clientes/parceiros?", type: "single_choice", options: SCALE_5 },
    { text: "Os gestores da Transbahia dão bons exemplos aos seus funcionários?", type: "single_choice", options: SCALE_5 },
  ]],
  ["Trabalho em equipe", [
    { text: "Os assuntos importantes são debatidos em equipe?", type: "single_choice", options: SIM_NAO_MAIS },
    { text: "A Transbahia estimula o trabalho em equipe?", type: "single_choice", options: SIM_NAO_MAIS },
  ]],
  ["Sugestões", [
    { text: "Que sugestões você daria para tornar a Transbahia um lugar melhor para se trabalhar?", type: "text", required: false },
  ]],
];

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

const { data: survey, error: surveyError } = await supabase
  .from("surveys")
  .insert({
    company_id: company.id,
    created_by: admin.id,
    title: "Pesquisa de Clima Organizacional",
    description:
      "Até que ponto você concorda com as afirmações abaixo? Sua opinião é muito importante para melhorarmos o ambiente de trabalho.",
    type: "climate",
    is_anonymous: true,
    is_priority: true,
    min_responses_to_show_results: 5,
    status: "draft",
  })
  .select("id")
  .single();
if (surveyError) {
  console.error("Erro ao criar pesquisa:", surveyError.message);
  process.exit(1);
}

let order = 0;
for (const [section, questions] of SECTIONS) {
  for (const q of questions) {
    const { data: question, error: qError } = await supabase
      .from("survey_questions")
      .insert({
        survey_id: survey.id,
        section,
        order: order++,
        text: q.text,
        type: q.type,
        required: q.required ?? true,
      })
      .select("id")
      .single();
    if (qError) {
      console.error("Erro ao criar pergunta:", q.text, qError.message);
      process.exit(1);
    }

    if (q.options?.length) {
      const rows = q.options.map((label, i) => ({ question_id: question.id, label, order: i }));
      const { error: optError } = await supabase.from("survey_question_options").insert(rows);
      if (optError) {
        console.error("Erro ao criar opções:", q.text, optError.message);
        process.exit(1);
      }
    }
  }
}

console.log(`Pesquisa criada (id ${survey.id}) com ${order} perguntas em ${SECTIONS.length} seções.`);
console.log("Status: draft — revise em /admin/surveys e ative quando estiver pronta.");
