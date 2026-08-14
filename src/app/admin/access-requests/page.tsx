import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/services/profile";
import { listAccessRequests } from "@/server/services/access-requests";
import { formatCpf } from "@/lib/cpf";
import { approveAccessRequestAction, rejectAccessRequestAction } from "./actions";

const REVIEWER_ROLES = new Set(["hr_admin", "company_admin"]);

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function AccessRequestsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile || !REVIEWER_ROLES.has(profile.role)) {
    redirect("/admin/communications");
  }

  const requests = await listAccessRequests(supabase);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-neutral-500">Gerenciar Acessos</h2>

      {requests.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma solicitação de acesso ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColor[r.status]}`}
                  >
                    {statusLabel[r.status]}
                  </span>
                  <h3 className="mt-1 font-medium text-neutral-900">{r.full_name}</h3>
                  <p className="text-xs text-neutral-500">
                    CPF: {formatCpf(r.cpf)} · {r.email}
                  </p>
                  <p className="text-xs text-neutral-500">Setor: {r.department ?? "—"}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Solicitado em {new Date(r.requested_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                {r.status === "pending" && (
                  <div className="flex shrink-0 gap-3">
                    <form action={approveAccessRequestAction.bind(null, r.id)}>
                      <button type="submit" className="text-sm text-green-700 underline">
                        Aprovar acesso
                      </button>
                    </form>
                    <form action={rejectAccessRequestAction.bind(null, r.id)}>
                      <button type="submit" className="text-sm text-red-600 underline">
                        Recusar acesso
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
