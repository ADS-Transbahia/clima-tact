import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-neutral-900">🧭 Clima Tact</h1>
        <p className="text-sm text-neutral-500">Transbahia · Plataforma do Colaborador</p>
      </div>
      <LoginForm />
    </main>
  );
}
