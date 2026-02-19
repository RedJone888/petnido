export default function EmptyCard({
  title,
  desc,
  cta,
  icon,
}: {
  title: string;
  desc: string;
  cta: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-4">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-white/80 border border-border flex items-center justify-center">
        {icon ?? <PawPrint className="h-5 w-5" />}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <div>{cta}</div>
    </div>
  );
}
