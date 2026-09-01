import { redirect } from "next/navigation";

export default function NeedNewPage() {
  redirect("/needs/create");
}
