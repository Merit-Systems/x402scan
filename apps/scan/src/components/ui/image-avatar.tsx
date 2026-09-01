import type { ComponentProps, ReactNode } from "react";
import { UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ImageAvatarProps = Omit<ComponentProps<typeof Avatar>, "children"> & {
  src?: string | null;
  fallback?: ReactNode;
};

function ImageAvatar({ src, fallback, ...props }: ImageAvatarProps) {
  return (
    <Avatar variant="tile" {...props}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback>{fallback ?? <UserIcon />}</AvatarFallback>
    </Avatar>
  );
}

export { ImageAvatar as Avatar };
