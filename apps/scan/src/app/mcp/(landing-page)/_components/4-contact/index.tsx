import { Button } from '@/components/ui/button';

export const Contact = () => {
  return (
    <div className="bg-muted px-16 py-8 items-center flex justify-between rounded-xl">
      <h1 className="text-2xl font-bold">Exploring Agentic Commerce?</h1>
      <div className="flex gap-2">
        <Button size="xl">Try the MCP</Button>
        <Button variant="outline" size="xl">
          Contact Us
        </Button>
      </div>
    </div>
  );
};
