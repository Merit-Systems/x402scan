import { Bot, User } from 'lucide-react';

export const WalletStep = () => {
  return (
    <div className="p-3 border rounded-lg flex flex-col gap-3 bg-muted">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="size-4" />
          <h2 className="text-sm ">Your Account</h2>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Owned by your wallet
        </p>
      </div>
      <div className="flex items-center justify-between border rounded-lg p-3 border-primary/60 bg-primary/10 text-primary">
        <div className="flex items-center gap-2">
          <Bot className="size-5" />
          <p className="font-bold text-sm">Composer Wallet </p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Owned by your account
        </p>
      </div>
    </div>
  );
};
