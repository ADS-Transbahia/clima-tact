import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCommunication } from "@/server/services/communications";
import { CommunicationForm } from "../CommunicationForm";
import { updateCommunicationAction, changeCommunicationStatus } from "../actions";

export default async function EditCommunicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const communication = await getCommunication(supabase, id);

  if (!communication) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Editar comunicação</h2>
        <div className="flex gap-3">
          {communication.status !== "published" && (
            <form action={changeCommunicationStatus.bind(null, id, "published")}>
              <button type="submit" className="text-sm text-green-700 underline">
                Publicar
              </button>
            </form>
          )}
          {communication.status !== "archived" && (
            <form action={changeCommunicationStatus.bind(null, id, "archived")}>
              <button type="submit" className="text-sm text-neutral-500 underline">
                Arquivar
              </button>
            </form>
          )}
        </div>
      </div>
      <CommunicationForm action={updateCommunicationAction} initial={communication} />
    </div>
  );
}
