import { Separator } from "@/components/ui/separator";

interface Props {
  children: React.ReactNode;
}

export const ConnectInjectedWalletButtonsWrapper: React.FC<Props> = ({
  children,
}) => {
  return (
    <>
      {children}
      <div className="flex w-full items-center gap-2">
        <Separator className="flex-1" />
        <p className="type-caption text-muted-foreground">or</p>
        <Separator className="flex-1" />
      </div>
    </>
  );
};
