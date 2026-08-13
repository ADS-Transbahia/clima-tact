"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function PrioritySurveyBanner({
  surveyId,
  title,
}: {
  surveyId: string;
  title: string;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const key = `survey-dismissed-${surveyId}`;
    setDismissed(sessionStorage.getItem(key) === "1");
  }, [surveyId]);

  if (dismissed) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-900 bg-neutral-900 p-4 text-white">
      <p className="text-sm font-medium">📢 Temos uma pesquisa para você</p>
      <p className="text-sm">{title}</p>
      <div className="flex gap-4">
        <Link
          href={`/surveys/${surveyId}`}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900"
        >
          Responder agora
        </Link>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(`survey-dismissed-${surveyId}`, "1");
            setDismissed(true);
          }}
          className="text-sm text-neutral-300 underline"
        >
          Lembrar depois
        </button>
      </div>
    </div>
  );
}
