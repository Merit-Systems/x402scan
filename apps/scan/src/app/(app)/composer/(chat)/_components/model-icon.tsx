import Image from "next/image";

import { cn } from "@/lib/utils";

interface Props {
  provider: string;
  className?: string;
}

export const ModelProviderIcon: React.FC<Props> = ({ provider, className }) => {
  return (
    <Image
      src={`/icons/${provider}.png`}
      alt={provider}
      width={16}
      height={16}
      className={cn("rounded-full", className ?? "")}
    />
  );
};
