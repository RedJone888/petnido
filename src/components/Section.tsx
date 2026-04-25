export default function Section({
  title,
  right,
  children,
  className = "",
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {right}
      </div>
      <div
        className={`rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-4 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
