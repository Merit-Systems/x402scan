import { ForbiddenCard, NotFoundCard } from './card';

import { cn } from '@/lib/utils';

import type { ErrorComponentProps } from './types';

type Props = {
  className?: string;
} & ErrorComponentProps;

export const NotFoundScreen: React.FC<Props> = ({ className, ...props }) => {
  return (
    <ErrorScreenContainer className={className}>
      <NotFoundCard {...props} />
    </ErrorScreenContainer>
  );
};

export const ForbiddenScreen: React.FC<Props> = ({ className, ...props }) => {
  return (
    <ErrorScreenContainer className={className}>
      <ForbiddenCard {...props} />
    </ErrorScreenContainer>
  );
};

const ErrorScreenContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center',
        className
      )}
    >
      {children}
    </div>
  );
};
