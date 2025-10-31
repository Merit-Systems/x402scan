import { BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  link: string;
}

export const HeaderButtons: React.FC<Props> = ({ link }) => {
  return (
    <ButtonsContainer>
      <a href={link} target="_blank">
        <Button variant="outline">
          <BookOpen className="size-4" />
          Learn More
        </Button>
      </a>
    </ButtonsContainer>
  );
};

export const LoadingHeaderButtons = () => {
  return (
    <ButtonsContainer>
      <Skeleton className="h-8 md:h-9 w-24" />
    </ButtonsContainer>
  );
};

const ButtonsContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-row gap-2">{children}</div>;
};
