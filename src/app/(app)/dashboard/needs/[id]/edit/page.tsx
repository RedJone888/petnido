import { redirect } from "next/navigation";

export default async function NeedEditPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/needs/edit/${encodeURIComponent(params.id)}`);
}
