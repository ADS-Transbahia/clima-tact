"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "./actions";

export default function SignupPage() {
  const [result, formAction, pending] = useActionState(signupAction, null);

  if (result === "success") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
        <div className="max-w-sm rounded-md border border-green-200 bg-green-50 p-6">
          <h1 className="font-medium text-green-800">Solicitação enviada!</h1>
          <p className="mt-2 text-sm text-green-700">
            Seu cadastro está pendente de aprovação do RH/TI. Você será avisado quando
            seu acesso for liberado.
          </p>
        </div>
        <Link href="/login" className="text-sm text-neutral-500 underline">
          Voltar ao login
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-4 py-12">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-neutral-900">🧭 Criar acesso</h1>
        <p className="text-sm text-neutral-500">Transbahia · Plataforma do Colaborador</p>
      </div>

      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="fullName" className="text-sm font-medium text-neutral-700">
            Nome completo
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cpf" className="text-sm font-medium text-neutral-700">
            CPF
          </label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="department" className="text-sm font-medium text-neutral-700">
            Setor
          </label>
          <input
            id="department"
            name="department"
            type="text"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        {result && result !== "success" && (
          <p className="text-sm text-red-600">{result}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Solicitar acesso"}
        </button>

        <Link href="/login" className="text-center text-sm text-neutral-500 underline">
          Já tenho conta
        </Link>
      </form>
    </main>
  );
}
