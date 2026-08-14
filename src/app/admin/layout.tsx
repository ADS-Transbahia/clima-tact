import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/services/profile";

const ADMIN_ROLES = new Set(["hr_admin", "sms_admin", "company_admin"]);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getCurrentProfile(supabase);

  if (!profile || !ADMIN_ROLES.has(profile.role)) {
    redirect("/");
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white px-4 py-8">
      <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <Link href="/" className="text-sm text-neutral-500 underline">
            &larr; Voltar ao feed
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Administração</h1>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/communications" className="text-neutral-500 hover:underline">
            Comunicações
          </Link>
          <Link href="/admin/surveys" className="text-neutral-500 hover:underline">
            Pesquisas
          </Link>
          {(profile.role === "hr_admin" || profile.role === "company_admin") && (
            <Link href="/admin/access-requests" className="text-neutral-500 hover:underline">
              Acessos
            </Link>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
