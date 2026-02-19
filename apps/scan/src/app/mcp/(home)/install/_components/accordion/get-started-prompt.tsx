'use client';

import { useState } from 'react';

import { Eye } from 'lucide-react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

import { clients, Clients } from '@/app/mcp/_lib/clients';

import type { Step } from './item';

interface Props {
  setName: (name: string) => void;
  setEmployer: (employer: string) => void;
}

const GetStartedPrompt: React.FC<Props> = ({ setName, setEmployer }) => {
  return (
    <div className="w-full rounded-lg p-4 bg-muted flex flex-col gap-4">
      <div>
        <div className="flex gap-2 items-center justify-between">
          <h1 className="font-semibold">Starter Prompt</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="size-fit md:size-fit p-1 text-muted-foreground hover:text-foreground"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Full Prompt</DialogTitle>
              </DialogHeader>
              <pre className="whitespace-pre-wrap text-sm font-sans p-4 bg-muted rounded-md">
                {prompt('<YOUR NAME>', '<YOUR COMPANY>')}
              </pre>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-xs font-normal text-muted-foreground">
          Learn how to get the most out of the MCP
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-2 items-center">
        <div className="flex-1 flex flex-col gap-1 w-full md:w-auto">
          <Label className="text-muted-foreground text-xs">Full Name</Label>
          <Input
            placeholder="John Doe"
            className="bg-card"
            onChange={e => setName(e.target.value)}
            autoComplete="name"
            name="name"
            id="name"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1 w-full md:w-auto">
          <Label className="text-muted-foreground text-xs">
            Where You Work
          </Label>
          <Input
            placeholder="Acme Inc."
            className="bg-card"
            onChange={e => setEmployer(e.target.value)}
            autoComplete="company"
            name="employer"
            id="employer"
          />
        </div>
      </div>
    </div>
  );
};

export const useGetStarted = (client: Clients): Step => {
  const [name, setName] = useState('');
  const [employer, setEmployer] = useState('');

  const clientName = clients[client].name;

  const { copyToClipboard } = useCopyToClipboard(() => {
    toast.success(
      <div>
        <h1 className="font-bold text-sm">
          Starter prompt copied to clipboard
        </h1>
        <p className="text-xs font-normal">
          Paste it into {clientName} to get started.
        </p>
      </div>
    );
  });

  return {
    title: `Get Started with the Tools`,
    content: <GetStartedPrompt setName={setName} setEmployer={setEmployer} />,
    continueText:
      client === Clients.Cursor ? 'Open in Cursor' : 'Copy Starter Prompt',
    onNext: async () => {
      if (client === Clients.Cursor) {
        window.open(generatePromptDeeplink(prompt(name, employer)), '_blank');
      } else {
        void copyToClipboard(prompt(name, employer));
      }
      return Promise.resolve();
    },
    nextDisabled: !name || !employer,
  };
};

const prompt = (name: string, employer: string) =>
  `My name is ${name} and I work at ${employer}.

Tell me how I can use the x402 MCP tools to help me with my work. Be as specific as possible.

You can research anything you need to know to help me. 

Come up with three options for how I can use the MCP to help me with my work and ask me which one I want to try first.`;

function generatePromptDeeplink(promptText: string): string {
  const url = new URL('cursor://anysphere.cursor-deeplink/prompt');
  url.searchParams.set('text', promptText);
  return url.toString();
}
