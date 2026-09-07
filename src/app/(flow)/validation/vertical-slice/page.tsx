import { notFound } from "next/navigation";

import { validationPrisma } from "@/validation/vertical-slice/client";
import { listPublicNeeds } from "@/validation/vertical-slice/service";

export const dynamic = "force-dynamic";

export default async function ValidationVerticalSlicePage(
  props: {
    searchParams: Promise<{ now?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  if (process.env.NODE_ENV === "production" || process.env.FEATURE_VERTICAL_SLICE !== "true") notFound();
  const now = searchParams.now ? new Date(searchParams.now) : new Date();
  const needs = await listPublicNeeds(validationPrisma, now);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Petnido vertical-slice validation</h1>
      <p data-testid="public-need-count" className="mt-4">
        Public needs: {needs.length}
      </p>
      <ul className="mt-6 space-y-3">
        {needs.map((need) => (
          <li key={need.id} data-testid={`validation-need-${need.id}`} className="rounded border p-4">
            {need.title} · {need.location.regionLabel}
          </li>
        ))}
      </ul>
    </main>
  );
}
