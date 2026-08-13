import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listNotifications } from "@/server/services/notifications";
import { markReadAction, markAllReadAction } from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const notifications = await listNotifications(supabase);
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-white px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-neutral-500 underline">
            &larr; Voltar ao feed
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Notificações</h1>
        </div>
        {hasUnread && (
          <form action={markAllReadAction}>
            <button type="submit" className="text-sm text-neutral-500 underline">
              Marcar todas como lidas
            </button>
          </form>
        )}
      </header>

      {notifications.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma notificação por enquanto.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-md border p-4 ${
                n.read_at ? "border-neutral-200" : "border-neutral-900 bg-neutral-50"
              }`}
            >
              <div>
                <p className="text-sm text-neutral-900">{n.title}</p>
                {n.body && <p className="mt-1 text-sm text-neutral-600">{n.body}</p>}
              </div>
              {!n.read_at && (
                <form action={markReadAction.bind(null, n.id)}>
                  <button type="submit" className="text-xs text-neutral-500 underline">
                    Marcar como lida
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
