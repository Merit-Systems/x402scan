import Image from 'next/image';

import { DynamicIcon } from 'lucide-react/dynamic';

import type { IconName } from 'lucide-react/dynamic';

interface Props {
  icon: string;
  className?: string;
}

export const Icon: React.FC<Props> = ({ icon, className }) => {
  if (icon.startsWith('/')) {
    return (
      <Image
        src={icon}
        alt={icon}
        width={20}
        height={20}
        className={className}
      />
    );
  }

  return <DynamicIcon name={icon as IconName} className={className} />;
};
