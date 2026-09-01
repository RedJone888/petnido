import { redirect } from "next/navigation";

export default function NeedEditPage({ params }: { params: { id: string } }) {
  redirect(`/needs/edit/${encodeURIComponent(params.id)}`);
}
