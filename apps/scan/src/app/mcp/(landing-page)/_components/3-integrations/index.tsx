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
      description="No connectors. No contracts. Just use."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-4 mt-2">
        <IntegrationCard
          icon={<Search className="size-10" />}
          title="EnrichX402"
          description="Deep research with Google Maps, Apollo, Grok (X/Twitter), Exa, Firecrawl, and Clado"
          cta={
            <a href="https://enrichx402.com" target="_blank">
              <Button className="w-fit" variant="outline">
                Learn More
              </Button>
            </a>
          }
        />
        <IntegrationCard
          icon={<ImageIcon className="size-10" />}
          title="StableStudio"
          description="Generate images and videos with Nano Banana, GPT image, Sora, Veo3, and Wan 2.5"
          cta={
            <a href="https://stablestudio.io" target="_blank">
              <Button className="w-fit" variant="outline">
                Learn More
              </Button>
            </a>
          }
        />
        <IntegrationCard
          icon={<Plus className="size-10" />}
          title="Every x402 Resource"
          description="Do you manage an API and want to attract more agentic commerce users? We can help you get started."
          cta={
            <a href="mailto:info@merit.systems" target="_blank">
              <Button className="w-fit">Work With Us</Button>
            </a>
          }
        />
      </div>
    </LandingPageSection>
  );
};
