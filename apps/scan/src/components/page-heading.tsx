interface PageHeadingProps {
  title: string;
  description: string;
}

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="type-page-title">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
