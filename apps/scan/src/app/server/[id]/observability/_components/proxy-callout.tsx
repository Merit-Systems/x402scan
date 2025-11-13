import { Activity } from 'lucide-react';

export const ProxyCallout = () => {
  return (
    <div className="border border-primary bg-primary/5 p-4 rounded-md flex items-center gap-4">
      <Activity className="size-8 text-primary shrink-0" />
      <div className="flex flex-col">
        <h2 className="font-mono text-base md:text-lg font-bold text-primary">
          Observability Data
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          This data is collected for all requests going through{' '}
          <i>proxy.x402scan.com</i>
        </p>
      </div>
    </div>
  );
};
