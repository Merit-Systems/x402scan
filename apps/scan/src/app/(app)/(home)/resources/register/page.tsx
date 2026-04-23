'use client';

import { useState } from 'react';
import { FileJson, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RegisterResourceForm } from './_components/form';
import { OpenApiRegisterForm } from './_components/openapi-form';
import { cn } from '@/lib/utils';

type TabMode = 'url' | 'openapi';

export default function RegisterResourcePage() {
  const [activeTab, setActiveTab] = useState<TabMode>('url');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Add your Server
        </h1>
        <p className="text-muted-foreground mt-2">
          Register your x402-compatible server to make your resources
          discoverable on x402scan.
        </p>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1.5',
            activeTab === 'url' && 'bg-muted'
          )}
          onClick={() => setActiveTab('url')}
        >
          <Globe className="size-4" />
          URL / Discovery
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1.5',
            activeTab === 'openapi' && 'bg-muted'
          )}
          onClick={() => setActiveTab('openapi')}
        >
          <FileJson className="size-4" />
          OpenAPI Spec
        </Button>
      </div>

      <div>
        {activeTab === 'url' ? (
          <RegisterResourceForm />
        ) : (
          <OpenApiRegisterForm />
        )}
      </div>
    </div>
  );
}
