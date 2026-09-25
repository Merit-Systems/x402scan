import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface Props {
  className?: string;
  prefix?: string;
  icon?: string;
  name?: string;
  isPending?: boolean;
  onClick?: () => void;
}

export const ConnectInjectedWalletButton: React.FC<Props> = ({
  className,
  prefix = "Connect",
  icon,
  name,
  isPending,
  onClick,
}) => {
  return (
    <Button
      variant="outline"
      className={cn("w-full", className)}
      onClick={onClick}
      disabled={isPending}
    >
      {icon && !isPending && (
        <Image
          src={icon}
          alt={name ?? "Wallet"}
          width={16}
          height={16}
          unoptimized
          className="size-4"
        />
      )}
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {prefix ? `${prefix} ${String(name)}` : name}
    </Button>
  );
};
