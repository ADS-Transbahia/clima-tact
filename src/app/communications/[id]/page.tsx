import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCommunication,
  getCommunicationReadStatus,
  markCommunicationViewed,
} from "@/server/services/communications";
import { listBlocks } from "@/server/services/communication-blocks";
import { confirmReadAction } from "../actions";

export default async function CommunicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const communication = await getCommunication(supabase, id);
  if (!communication) notFound();

  await markCommunicationViewed(supabase, id, user.id);

  const [blocks, readStatus] = await Promise.all([
    listBlocks(supabase, id),
    getCommunicationReadStatus(supabase, id, user.id),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-white px-4 py-8">
      <Link href="/" className="text-sm text-neutral-500 underline">
        &larr; Voltar ao feed
      </Link>

      <article className="flex flex-col gap-4">
        {communication.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={communication.cover_image_url}
            alt=""
            className="w-full rounded-md object-cover"
          />
        )}

        <div>
          {communication.priority === "high" && (
            <span className="mb-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Prioritário
            </span>
          )}
          <h1 className="text-xl font-semibold text-neutral-900">{communication.title}</h1>
          <p className="mt-1 text-xs text-neutral-400">
            {communication.author?.name && `${communication.author.name} · `}
            {communication.publish_at &&
              new Date(communication.publish_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
          </p>
        </div>

        <p className="whitespace-pre-wrap text-sm text-neutral-700">{communication.body}</p>

        {blocks.map((block) => (
          <div key={block.id}>
            {block.type === "text" && (
              <p className="whitespace-pre-wrap text-sm text-neutral-700">
                {block.config.text}
              </p>
            )}

            {block.type === "image" && (
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={String(block.config.url)}
                  alt={String(block.config.caption ?? "")}
                  className="w-full rounded-md object-cover"
                />
                {block.config.caption && (
                  <figcaption className="mt-1 text-xs text-neutral-400">
                    {block.config.caption}
                  </figcaption>
                )}
              </figure>
            )}

            {block.type === "file" && (
              <a
                href={String(block.config.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                📄 {block.config.label}
              </a>
            )}

            {block.type === "button" && (
              <a
                href={String(block.config.url)}
                className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              >
                {block.config.label}
              </a>
            )}

            {block.type === "checklist" && (
              <ul className="flex flex-col gap-2">
                {(block.config.items as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="mt-0.5">☐</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {communication.require_read_confirmation && (
          <div className="rounded-md border border-neutral-200 p-4">
            {readStatus?.confirmed_at ? (
              <p className="text-sm text-green-700">
                ✓ Leitura confirmada em{" "}
                {new Date(readStatus.confirmed_at).toLocaleString("pt-BR")}
              </p>
            ) : (
              <form action={confirmReadAction.bind(null, id)}>
                <p className="mb-2 text-sm text-neutral-600">
                  Esta comunicação exige confirmação de leitura.
                </p>
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Confirmar leitura
                </button>
              </form>
            )}
          </div>
        )}
      </article>
    </main>
  );
}
