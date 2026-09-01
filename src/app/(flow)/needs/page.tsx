import { createServerCaller } from "@/server/trpc/server-caller";

import { NeedMarketplace } from "./_components/need-marketplace";

export default async function NeedsMarketplacePage() {
  const trpc = await createServerCaller();
  const initialData = await trpc.marketplaceNeed.list({ filter: {}, limit: 20 }).catch(() => null);
  return <NeedMarketplace initialData={initialData} />;
}
