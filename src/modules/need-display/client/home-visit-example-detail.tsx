"use client";

import type { Lang } from "@/domain/lang/types";
import { homeVisitExampleData } from "@/modules/need-display/examples/home-visit-example-data";
import { PublicNeedDetail } from "./public-need-detail";

const backLabel: Record<Lang, string> = {
  en: "Back to the home-visit guide",
  zh: "返回上门照护指南",
  ja: "訪問ケアガイドに戻る",
};

export function HomeVisitExampleDetail({ language }: { language?: Lang }) {
  return (
    <PublicNeedDetail
      publicId="v2:home-visit-guide-example"
      initialLanguage={language}
      staticDataByLanguage={homeVisitExampleData}
      readOnly
      backLink={{
        href: `${language ? `/${language}` : ""}/care-types/home-visits`,
        label: backLabel,
      }}
    />
  );
}
