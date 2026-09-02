import Image from "next/image";

import { facilitatorIdMap } from "@/lib/facilitators";

import { cn } from "@/lib/utils";

interface Props {
  id: string;
  className?: string;
}

export const Facilitator: React.FC<Props> = ({ id, className }) => {
  const facilitator = facilitatorIdMap.get(id);

  if (!facilitator) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Image
        src={facilitator?.image}
        alt={facilitator?.name}
        width={16}
        height={16}
        className="rounded-md"
      />
    </div>
  );
};
