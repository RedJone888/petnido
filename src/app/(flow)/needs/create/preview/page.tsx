import { Suspense } from "react";

import { RequestDetailPreview } from "@/modules/need-publishing/client";

export default function NeedPreviewDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fbfaf8]" />}>
      <RequestDetailPreview />
    </Suspense>
  );
}
