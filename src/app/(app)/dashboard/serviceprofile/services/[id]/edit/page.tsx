import { redirect } from "next/navigation";
export default function ServiceEditPage({
  params: _params,
}: {
  params: { id: string };
}) {
  redirect("/dashboard/serviceprofile");
}
