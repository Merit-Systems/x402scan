import Image from "next/image";

import { useSignInWithOAuth } from "@coinbase/cdp-hooks";

import { Button } from "@/components/ui/button";

import { oauthProviders } from "./providers";

export const ConnectEmbeddedWalletOAuth = () => {
  const { signInWithOAuth } = useSignInWithOAuth();

  return (
    <div className="flex w-full flex-row gap-2">
      {oauthProviders.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          type="button"
          onClick={() => void signInWithOAuth(provider.id)}
          className="h-12 w-full md:h-12"
        >
          <Image
            src={provider.icon}
            alt={provider.name}
            width={16}
            height={16}
            className={provider.iconClassName}
          />
        </Button>
      ))}
    </div>
  );
};
