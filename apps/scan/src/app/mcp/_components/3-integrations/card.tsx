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
    <Card className="flex flex-col gap-2 justify-between p-6">
      <div className="flex flex-col gap-4">
        {icon}

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold font-mono">{title}</h2>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
        </div>
      </div>
      {cta}
    </Card>
  );
};
