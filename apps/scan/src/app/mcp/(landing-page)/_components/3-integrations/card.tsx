import { Card } from '@/components/ui/card';

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: React.ReactNode;
}

export const IntegrationCard: React.FC<Props> = ({
  icon,
  title,
  description,
  cta,
}) => {
  return (
    <Card className="flex flex-col gap-2 justify-between p-6 relative rounded-lg">
      <div className="flex flex-col gap-4">
        <div className="absolute top-0 -translate-y-[calc(100%)] -translate-x-1 -z-1 bg-card h-8 w-16 border border-b-0 rounded-t-lg" />
        <div className="absolute top-0 translate-y-[-50%] -z-1 translate-x-2">
          {icon}
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <h2 className="text-lg font-semibold font-mono">{title}</h2>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
        </div>
      </div>
      {cta}
    </Card>
  );
};
