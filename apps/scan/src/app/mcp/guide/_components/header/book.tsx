import Image from 'next/image';

import { Logo } from '@/components/logo';

import {
  Book,
  BookBinding,
  BookCover,
  BookContent,
} from '@/app/mcp/_components/guide/book';
import { Check } from 'lucide-react';

interface Props {
  icon?: string;
  selected?: boolean;
}

export const SectionBook: React.FC<Props> = ({ icon, selected }) => {
  return (
    <Book className="h-10 w-8 rounded-sm">
      <BookBinding className="w-1.25" />
      <BookCover className="flex flex-col justify-between">
        <BookContent>
          <div className="p-1 bg-black/50 rounded-full [box-shadow:0_0.5_rgba(255,255,255,0.15)]">
            {selected ? (
              <Check className="size-2.5 text-white" />
            ) : icon ? (
              <Image
                src={icon}
                alt={icon}
                width={50}
                height={50}
                className="invert size-2.5"
              />
            ) : (
              <Logo className="size-2.5" />
            )}
          </div>
        </BookContent>
      </BookCover>
    </Book>
  );
};
