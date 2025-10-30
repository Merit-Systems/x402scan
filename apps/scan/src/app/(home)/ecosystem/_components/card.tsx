import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { EcosystemCategory, EcosystemItem } from '@/lib/ecosystem/schema';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Props {
  item: EcosystemItem;
  showBadge?: boolean;
}

export const EcosystemCard: React.FC<Props> = ({ item, showBadge }) => {
  return (
    <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer">
      <Card className="justify-between flex flex-col hover:border-primary transition-colors h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image
              src={item.logoUrl}
              alt={item.name}
              width={16}
              height={16}
              className="rounded-md"
            />
            <CardTitle>{item.name}</CardTitle>
          </div>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
        {showBadge && (
          <CardContent>
            <Badge category={item.category} />
          </CardContent>
        )}
      </Card>
    </a>
  );
};

const Badge = ({ category }: { category: EcosystemCategory }) => {
  const categoryClassName: Record<EcosystemCategory, string> = {
    'Client-Side Integrations': 'bg-blue-600/10 border-blue-600',
    'Services/Endpoints': 'bg-green-600/10 border-green-600',
    'Ecosystem Infrastructure & Tooling': 'bg-purple-600/10 border-purple-600',
    'Learning & Community Resources': 'bg-orange-600/10 border-orange-600',
  };

  return (
    <div
      className={cn(
        'text-xs font-semibold bg-muted rounded-md px-2 py-1 w-fit',
        categoryClassName[category]
      )}
    >
      {category}
    </div>
  );
};
