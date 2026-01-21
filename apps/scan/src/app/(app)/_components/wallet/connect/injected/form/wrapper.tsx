import { Separator } from '@/components/ui/separator';

interface Props {
  children: React.ReactNode;
}

export const ConnectInjectedWalletButtonsWrapper: React.FC<Props> = ({
  children,
}) => {
  return (
    <>
      {children}
      <div className="flex items-center gap-2 w-full">
        <Separator className="flex-1" />
        <p className="text-muted-foreground text-xs">or</p>
        <Separator className="flex-1" />
      </div>
    </>
  );
};
