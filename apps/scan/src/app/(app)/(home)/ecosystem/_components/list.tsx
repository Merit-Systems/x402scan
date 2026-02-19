import type { EcosystemItem } from '@/lib/ecosystem/schema';
import { EcosystemCard } from './card';

interface Props {
  items: EcosystemItem[];
  showBadge?: boolean;
}

export const EcosystemList: React.FC<Props> = ({ items, showBadge }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <EcosystemCard
          key={`${item.name}-${index}`}
          item={item}
          showBadge={showBadge}
        />
      ))}
    </div>
  );
};
