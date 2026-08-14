# Plataforma de Experiência do Colaborador

Especificação completa em [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md).

Stack: Next.js (App Router) + TypeScript + Tailwind + Supabase (Postgres, Auth, Storage).

## Setup local

```bash
npm install
cp .env.example .env.local   # preencher com as chaves do projeto Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Ver `.env.example`. `SUPABASE_SECRET_KEY` é server-only — nunca prefixar com `NEXT_PUBLIC_` nem expor ao client.

## Banco de dados (Supabase)

Migrations em `supabase/migrations/`. Para aplicar num projeto Supabase real:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

## Deploy (Render)

`render.yaml` já define o serviço (Blueprint). No dashboard do Render:

1. New + → Blueprint → conectar este repositório.
2. Preencher as 3 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) com os valores de `.env.local`.
3. Deploy — pushes subsequentes em `main` atualizam o site automaticamente.

Plano free "dorme" após ~15min sem acesso; o primeiro acesso seguinte demora ~30-50s pra acordar.

## Estrutura

```
src/
  app/                 # rotas (App Router)
  lib/supabase/        # clients Supabase (browser, server, admin)
  server/services/      # regra de negócio, desacoplada das rotas
  proxy.ts              # renovação de sessão (equivalente ao antigo middleware.ts)
supabase/
  migrations/            # schema versionado
docs/
  SPECIFICATION.md       # especificação técnica completa
```
