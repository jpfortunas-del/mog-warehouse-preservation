export function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-modec-navy">{title}</h1>
        {badge}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
