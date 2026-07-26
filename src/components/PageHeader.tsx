export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-modec-navy">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
