import { Suspense } from "react";

import { RequestDetailPreview } from "./request-detail-preview";

export default function NeedPreviewDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fbfaf8]" />}>
      <RequestDetailPreview />
    </Suspense>
  );
}
