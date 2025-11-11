import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const IntroductionStep = () => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* User Message */}
      <MockMessage isUser={true}>
        <MockMessageContent isUser={true}>
          I want to build an x402 server, where do I start?
        </MockMessageContent>
      </MockMessage>

      {/* Assistant Response with Tool Calls */}
      <MockMessage isUser={false}>
        <MockMessageContent>
          <div className="flex flex-col gap-2">
            <MockTool
              resource="Firecrawl Search"
              image="https://firecrawl.dev/favicon.ico"
              price={0.01}
            />
            <MockTool
              resource="Analyze GitHub"
              image="https://github.com/favicon.ico"
              price={0.01}
            />
            <MockResponse>
              You can set up your first x402 resource by...
            </MockResponse>
          </div>
        </MockMessageContent>
      </MockMessage>
    </div>
  );
};

// Mock components that mimic the ai-elements structure
const MockMessage = ({
  children,
  isUser,
}: {
  children: React.ReactNode;
  isUser: boolean;
}) => (
  <div
    className={cn(
      'group flex flex-col w-full items-end gap-2',
      '[&>div]:max-w-full md:[&>div]:max-w-[80%]',
      isUser ? 'is-user' : 'is-assistant items-start'
    )}
  >
    {children}
  </div>
);

const MockMessageContent = ({
  children,
  isUser,
}: {
  children: React.ReactNode;
  isUser?: boolean;
}) => (
  <div
    className={cn(
      'flex flex-col gap-2 rounded-md text-foreground text-xs',
      isUser && 'bg-primary text-primary-foreground px-2 py-2'
    )}
  >
    {children}
  </div>
);

const MockTool = ({
  resource,
  image,
  price,
}: {
  resource: string;
  image: string;
  price: number;
}) => (
  <div className="w-fit rounded-md border bg-muted/50 flex items-center gap-2 p-2 text-xs">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image} className="size-4 rounded-md" alt={resource} />
    <div className="flex items-center gap-2 w-full overflow-hidden">
      <span className="font-semibold font-mono text-left truncate">
        {resource}
      </span>
      <span className="font-semibold text-primary font-mono">${price}</span>
      <Check className="size-3 text-green-600" />
    </div>
  </div>
);

const MockResponse = ({ children }: { children: React.ReactNode }) => (
  <div className="size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-4">
    <p className="text-xs">{children}</p>
  </div>
);
