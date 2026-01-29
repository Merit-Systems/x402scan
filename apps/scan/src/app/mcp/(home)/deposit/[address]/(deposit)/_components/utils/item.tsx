import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  label: string;
  description: string;
  Icon: React.FC<{ className: string }>;
  value?: string;
}

export const Item: React.FC<Props> = ({ label, description, Icon, value }) => {
  return (
    <ItemContainer>
      <InfoContainer>
        <Icon className="size-6 rounded" />
        <InfoContent>
          <span className="text-base font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground w-full whitespace-pre-wrap">
            {description}
          </span>
        </InfoContent>
      </InfoContainer>
      {value && (
        <span className="text-sm font-bold text-muted-foreground shrink-0">
          {value}
        </span>
      )}
    </ItemContainer>
  );
};

interface LoadingItemProps {
  hasValue?: boolean;
}

export const LoadingItem: React.FC<LoadingItemProps> = ({ hasValue }) => {
  return (
    <ItemContainer>
      <InfoContainer>
        <Skeleton className="size-6 rounded" />
        <InfoContent>
          <Skeleton className="w-24 h-4 my-1" />
          <Skeleton className="w-20 h-3 my-0.5" />
        </InfoContent>
      </InfoContainer>
      {hasValue && <Skeleton className="h-[14px] my-[3px] w-16" />}
    </ItemContainer>
  );
};

const ItemContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex justify-between items-center flex-1 gap-4 w-full">
      {children}
    </div>
  );
};

const InfoContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center gap-3 flex-1 overflow-hidden">
      {children}
    </div>
  );
};

const InfoContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col items-start text-left">{children}</div>;
};
