import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export function SectionHeader({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href: string;
  label: string;
}) {
  return (
    <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <h2 className="text-headline-lg mb-2">{title}</h2>
        <p className="text-on-surface-variant">{text}</p>
      </div>

      <Button href={href} variant="link" className="py-0">
        {label}
        <ArrowRight size={18} />
      </Button>
    </div>
  );
}
