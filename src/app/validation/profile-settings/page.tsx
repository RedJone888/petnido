import { notFound } from "next/navigation";

import SettingsPage from "@/app/(app)/dashboard/settings/page";
import { validationProfileEnabled } from "@/server/validation/profile-session";

export default function ValidationProfileSettingsPage() {
  if (!validationProfileEnabled()) notFound();
  return <SettingsPage />;
}
