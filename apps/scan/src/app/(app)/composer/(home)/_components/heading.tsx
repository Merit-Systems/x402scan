import Link from "next/link";

import { Bot, Edit } from "lucide-react";

import { Heading } from "@/app/(app)/_components/layout/page-utils";
import { Button } from "@/components/ui/button";

export const ComposerHomeHeading = () => {
  return (
    <Heading
      title="Composer"
      description="A playground for building agents that use x402 resources"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/composer/agents/new">
            <Button variant="default" size="lg">
              <Bot className="size-4" />
              New Agent
            </Button>
          </Link>
          <Link href="/composer/chat">
            <Button variant="outline" size="lg">
              <Edit className="size-4" />
              New Chat
            </Button>
          </Link>
        </div>
      }
      className="flex-col items-start md:flex-col md:items-start"
    />
  );
};
