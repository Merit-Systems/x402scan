import { Bot, User } from 'lucide-react';

export const WalletStep = () => {
  return (
    <div className="p-2 border rounded-lg flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <User className="size-4" />
        <h2 className="text-sm ">Your Account</h2>
      </div>
      <div className="flex items-center gap-2 border rounded-lg p-2 border-primary/60 bg-primary/10 text-primary">
        <Bot className="size-5" />
        <p className="font-bold">Composer Wallet </p>
      </div>
    </div>
  );
};
