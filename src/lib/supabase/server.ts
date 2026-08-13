import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client autenticado como o usuário da requisição (respeita RLS).
// Uso em Server Components, Route Handlers e Server Actions.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrita de
            // cookies — ignorável se houver middleware renovando a sessão.
          }
        },
      },
    },
  );
}
