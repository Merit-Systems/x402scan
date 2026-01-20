import { Button } from '@/components/ui/button';

export const CursorInstall = () => {
  return (
    <a
      href={
        'cursor://anysphere.cursor-deeplink/mcp/install?name=x402&config=eyJjb21tYW5kIjoibnB4IC15IEB4NDAyc2Nhbi9tY3AifQ%3D%3D'
      }
    >
      <Button variant="outline" className="w-full" size="lg">
        One-Click Install
      </Button>
    </a>
  );
};
