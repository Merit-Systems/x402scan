import { Skeleton } from '@/components/ui/skeleton';
import { Address } from '@/components/ui/address';

interface Props {
  address: string;
}

export const HeaderButtons: React.FC<Props> = ({ address }) => {
  return (
    <ButtonsContainer>
      <Address address={address} className="border-none p-0 text-sm" />
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
