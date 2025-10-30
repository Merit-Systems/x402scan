import Image from 'next/image';

import { facilitatorIdMap } from '@/lib/facilitators';

import { cn } from '@/lib/utils';

interface Props {
  id: string;
  className?: string;
}

export const Facilitator: React.FC<Props> = ({ id, className }) => {
  const facilitator = facilitatorIdMap.get(id);

  if (!facilitator) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Image
        src={facilitator?.image}
        alt={facilitator?.name}
        width={16}
        height={16}
        className="rounded-md"
      />
    </div>
  );
};

interface FacilitatorsProps {
  ids: string[];
  className?: string;
}

export const Facilitators: React.FC<FacilitatorsProps> = ({
  ids,
  className,
}) => {
  if (ids.length === 1) {
    return <Facilitator id={ids[0]} className={className} />;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {ids.map(id => {
          const facilitator = facilitatorIdMap.get(id);
          if (!facilitator) {
            return null;
          }
          return (
            <Image
              key={id}
              src={facilitator.image}
              alt={facilitator.name}
              width={16}
              height={16}
              className="rounded-md"
            />
          );
        })}
      </div>
    </div>
  );
};
