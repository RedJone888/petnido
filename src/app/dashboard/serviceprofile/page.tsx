"use client";

import { PawPrint } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";
import { useServiceProfile } from "@/hooks/useServiceProfile";
import LoadingPage from "@/components/ui/LoadingPage";
import ServiceProfile from "./ServiceProfile";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random()
    .toString(16)
    .slice(2)}_${Date.now().toString(16)}`;
}

export default function ServiceProfilePage() {
  const { getServiceProfile, toggleSitter } = useServiceProfile();
  if (getServiceProfile.isLoading) {
    return <LoadingPage title="読み込み中..." />;
  }
  const userProfile = getServiceProfile.data;
  if (!userProfile)
    return (
      <div className="p-8 text-center text-red-500">
        some error happens ユーザプロフィールが見つかりません
      </div>
    );
  const { profile, serviceProfile } = userProfile;
  if (!serviceProfile) {
    return profile.isSitter ? (
      <div className="p-8 text-center text-red-500">
        サービスプロフィールが見つかりません
      </div>
    ) : (
      <EmptyState
        icon={<PawPrint className="w-10 h-10" />}
        title="シッターとして活動を始めませんか？"
        description="あなたの経験やペットへの思いをプロフィールにまとめて、飼い主さんの信頼を築きましょう。まずはシッター登録から始めてください。あなたの経験やケアの得意分野、対応できるペットを登録して、ペットシッターとしての第一歩を踏み出しましょう。"
        actionLabel="シッター登録を始める"
        onAction={() => toggleSitter.mutate({ active: true })}
      />
    );
  }
  return (
    <ServiceProfile
      key={serviceProfile.id}
      serviceProfile={serviceProfile}
      profile={profile}
    />
  );
}
