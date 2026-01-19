import { Button } from '@/components/ui/button';
import { ImageIcon, Plus, Search } from 'lucide-react';
import { LandingPageSection } from '../lib/section';
import { IntegrationCard } from './card';

export const Integrations = () => {
  return (
    <LandingPageSection
      heading={
        <>
          One Click,{' '}
          <span className="text-primary">Unlimited Integrations</span>
        </>
      }
      description="Integrate x402 with your favorite tools and platforms."
    >
      <div className="grid grid-cols-3 gap-4">
        <IntegrationCard
          icon={<Search className="size-10" />}
          title="EnrichX402"
          description="Deep research with Google Maps, Apollo, Grok (X/Twitter), Exa, Firecrawl, and Clado"
          cta={
            <Button className="w-fit" variant="outline">
              Integrate
            </Button>
          }
        />
        <IntegrationCard
          icon={<ImageIcon className="size-10" />}
          title="StableStudio"
          description="Generate images and videos with Nano Banana, GPT image, Sora, Veo3, and Wan 2.5"
          cta={
            <Button className="w-fit" variant="outline">
              Integrate
            </Button>
          }
        />
        <IntegrationCard
          icon={<Plus className="size-10" />}
          title="Every x402 Resource"
          description="Do you manage an API and want to attract more agentic commerce users? We can help you get started."
          cta={<Button className="w-fit">Work With Us</Button>}
        />
      </div>
    </LandingPageSection>
  );
};
