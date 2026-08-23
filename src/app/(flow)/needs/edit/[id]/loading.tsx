import { NeedPublishingSkeleton } from "@/modules/need-publishing/client/need-publishing-skeleton";

export default function LoadingEditNeed() {
  return <NeedPublishingSkeleton stepCount={8} />;
}
