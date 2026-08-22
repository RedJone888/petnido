import { redirect } from "next/navigation";

export default function LegacyMessagesPage({
  searchParams,
}: {
  searchParams: { conversation?: string };
}) {
  const conversation = searchParams.conversation;
  redirect(
    conversation
      ? `/dashboard/notifications?view=conversations&conversation=${encodeURIComponent(conversation)}`
      : "/dashboard/notifications?view=conversations",
  );
}
