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
    <div className="mb-8 flex items-end justify-between gap-3 md:mb-10 md:gap-6">
      <div>
        <h2 className="text-headline-md text-on-surface md:mb-2 md:text-headline-lg">
          {title}
        </h2>
        <p className="hidden md:block text-on-surface-variant">{text}</p>
      </div>

      <Button
        href={href}
        variant="link"
        className="h-auto shrink-0 px-0 py-0 text-sm font-bold shadow-none hover:gap-2 md:text-base"
      >
        {label}
        <ArrowRight size={18} />
      </Button>
    </div>
  );
}
