import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, ROLE_LABEL } from "@/server/services/profile";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 bg-white px-4 py-8">
      <Link href="/" className="text-sm text-neutral-500 underline">
        &larr; Voltar ao feed
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Meu perfil</h1>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <dt className="text-neutral-500">Nome</dt>
            <dd className="text-neutral-900">{profile.name}</dd>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <dt className="text-neutral-500">E-mail</dt>
            <dd className="text-neutral-900">{profile.email}</dd>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <dt className="text-neutral-500">Papel</dt>
            <dd className="text-neutral-900">{ROLE_LABEL[profile.role]}</dd>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <dt className="text-neutral-500">Empresa</dt>
            <dd className="text-neutral-900">{profile.company?.name}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-500">Trocar senha</h2>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
