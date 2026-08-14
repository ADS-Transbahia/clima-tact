import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, ROLE_LABEL } from "@/server/services/profile";
import { listPublishedCommunications } from "@/server/services/communications";
import { countUnreadNotifications } from "@/server/services/notifications";
import { getPendingPrioritySurvey } from "@/server/services/surveys";
import { signOut } from "./login/actions";
import { PrioritySurveyBanner } from "./PrioritySurveyBanner";

const ADMIN_ROLES = new Set(["hr_admin", "sms_admin", "company_admin"]);

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
          Seu cadastro está pendente de aprovação do RH/TI. Assim que for aprovado,
          você já poderá acessar a plataforma normalmente.
        </p>
        <form action={signOut}>
          <button type="submit" className="text-sm text-neutral-500 underline">
            Sair
          </button>
        </form>
      </main>
    );
  }

  const [communications, unreadCount, pendingSurvey] = await Promise.all([
    listPublishedCommunications(supabase),
    countUnreadNotifications(supabase),
    getPendingPrioritySurvey(supabase),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-white px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{profile.company?.name}</p>
          <h1 className="text-lg font-semibold text-neutral-900">
            Olá, {profile.name.split(" ")[0]}
          </h1>
          <p className="text-xs text-neutral-400">{ROLE_LABEL[profile.role]}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="text-sm text-neutral-500 underline">
            Notificações{unreadCount > 0 && ` (${unreadCount})`}
          </Link>
          <Link href="/profile" className="text-sm text-neutral-500 underline">
            Meu perfil
          </Link>
          {ADMIN_ROLES.has(profile.role) && (
            <Link
              href="/admin/communications"
              className="text-sm text-neutral-500 underline"
            >
              Administração
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="text-sm text-neutral-500 underline">
              Sair
            </button>
          </form>
        </div>
      </header>

      {pendingSurvey && (
        <PrioritySurveyBanner surveyId={pendingSurvey.id} title={pendingSurvey.title} />
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Notícias</h2>
          <Link href="/surveys" className="text-sm text-neutral-500 underline">
            Pesquisas
          </Link>
        </div>
        {communications.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
            Nenhuma comunicação publicada ainda.
          </p>
        ) : (
          communications.map((item) => (
            <Link
              key={item.id}
              href={`/communications/${item.id}`}
              className="flex gap-3 rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
            >
              {item.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.cover_image_url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded object-cover"
                />
              )}
              <div>
                {item.priority === "high" && (
                  <span className="mb-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Prioritário
                  </span>
                )}
                <h3 className="font-medium text-neutral-900">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{item.body}</p>
              </div>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
