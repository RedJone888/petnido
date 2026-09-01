"use client";

import { ClipboardList } from "lucide-react";

import EmptyState from "../../_components/EmptyState";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";

export function NeedsEmptyState() {
  const { t } = useLanguage();
  const copy = useNeedPublishingMessages().dashboardNeeds;
  return (
    <EmptyState
      icon={<ClipboardList className="h-10 w-10" />}
      title={copy.emptyTitle}
      description={copy.emptyDescription}
      href="/needs/create"
      btnLabel={copy.create}
    />
  );
}
