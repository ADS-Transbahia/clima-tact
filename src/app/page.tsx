import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/services/profile";
import { listPublishedCommunications } from "@/server/services/communications";
import { signOut } from "./login/actions";

const roleLabel: Record<string, string> = {
  employee: "Colaborador",
  hr_admin: "RH",
  sms_admin: "SMS",
  company_admin: "Administrador",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
        <p className="text-neutral-700">
          Seu login funcionou, mas ainda não existe um perfil configurado para
          você. Fale com o administrador para liberar seu acesso.
        </p>
        <form action={signOut}>
          <button type="submit" className="text-sm text-neutral-500 underline">
            Sair
          </button>
        </form>
      </main>
    );
  }

  const communications = await listPublishedCommunications(supabase);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-white px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{profile.company?.name}</p>
          <h1 className="text-lg font-semibold text-neutral-900">
            Olá, {profile.name.split(" ")[0]}
          </h1>
          <p className="text-xs text-neutral-400">{roleLabel[profile.role]}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-neutral-500 underline">
            Sair
          </button>
        </form>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Notícias</h2>
        {communications.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
            Nenhuma comunicação publicada ainda.
          </p>
        ) : (
          communications.map((item) => (
            <article
              key={item.id}
              className="rounded-md border border-neutral-200 p-4"
            >
              {item.priority === "high" && (
                <span className="mb-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Prioritário
                </span>
              )}
              <h3 className="font-medium text-neutral-900">{item.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{item.body}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
