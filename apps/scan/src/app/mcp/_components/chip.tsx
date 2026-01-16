import { Logo } from '@/components/logo';
import { Card } from '@/components/ui/card';

export const Chip = () => {
  return (
    <div className="relative">
      <Card className="size-fit p-4">
        <Logo className="size-16" />
      </Card>
    </div>
  );
};
