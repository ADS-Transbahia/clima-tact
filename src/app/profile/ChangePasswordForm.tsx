"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const [result, formAction, pending] = useActionState(changePasswordAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm font-medium text-neutral-700">
          Nova senha
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
          Confirmar nova senha
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

      {result && result !== "success" && <p className="text-sm text-red-600">{result}</p>}
      {result === "success" && (
        <p className="text-sm text-green-700">Senha atualizada com sucesso.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Trocar senha"}
      </button>
    </form>
  );
}
