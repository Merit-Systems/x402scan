import { Check } from 'lucide-react';

import { Logo } from '@/components/logo';

import {
  Book,
  BookBinding,
  BookCover,
  BookContent,
} from '@/app/mcp/guide/_components/book';

import { Icon } from '../../icon';
import { cn } from '@/lib/utils';

interface Props {
  icon?: string;
  selected?: boolean;
}

export const SectionBook: React.FC<Props & { className?: string }> = ({
  icon,
  selected,
  className,
}) => {
  return (
    <Book className={cn('h-10 w-8 rounded-sm', className)}>
      <BookBinding className="w-1.25" />
      <BookCover className="flex flex-col justify-between">
        <BookContent>
          <div className="p-1 bg-black/50 rounded-full [box-shadow:0_0.5_rgba(255,255,255,0.15)]">
            {selected ? (
              <Check className="size-3 text-white" />
            ) : icon ? (
              <Icon icon={icon} className="size-3 text-white" />
            ) : (
              <Logo className="size-2.5 brightness-0 invert" />
            )}
          </div>
        </BookContent>
      </BookCover>
    </Book>
  );
};
