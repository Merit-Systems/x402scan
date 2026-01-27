'use client';

import {
  Film,
  Globe,
  Linkedin,
  MessageSquare,
  Twitter,
  UserSearch,
  Users,
  Video,
} from 'lucide-react';

import { Body } from '@/app/_components/layout/page-utils';
import { Clients } from '@/app/mcp/_lib/clients';

import { ExamplePrompt } from './_components/example-prompt';

export default function GettingStartedPage() {
  return (
    <Body>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Getting Started</h1>
          <p className="text-muted-foreground/80 text-lg">
            Claude Code + x402scan MCP enables you to automate any knowledge
            work task. Here are some example prompts to help you get the most
            out of this combination.
          </p>
        </div>

        <section className="flex flex-col gap-8">
          <ExamplePrompt
            icon={UserSearch}
            title="Research an outbound sales lead and personalize your outreach"
            description="Get information for someone you're about to reach out to and personalize your outreach with a hook."
            tools={[
              { name: 'Twitter', icon: Twitter },
              { name: 'LinkedIn', icon: Linkedin },
            ]}
            recommendedClient={Clients.Claude}
            prompt={`Goal: Research an outbound sales lead and generate 5 personalized outreach messages based on information you find.

Get all the additional information you can about the key decision maker at {{Company Name|Merit Systems}}.

Use the tools in enrichx402 to get more information about them.
Look for their twitter handle and see what they like to tweet about.
Do web search to what is available on the open web about them.

Look for people they interact with on twitter and what they like to tweet about.

Generate a short bio about them.
Generate 5 personalized outreach messages based on their bio and information you find.`}
          />

          <ExamplePrompt
            icon={Users}
            title="Identify influencers in a niche developer community"
            description="Identify leaders in a developer community and find their most popular projects on GitHub and their top co-contributors."
            tools={[
              { name: 'Twitter', icon: Twitter },
              { name: 'LinkedIn', icon: Linkedin },
            ]}
            recommendedClient={Clients.ClaudeCode}
            prompt={`Goal: Identify 10 leaders in the {{Developer Niche|eg. embedded systems, frontend programming}} developer community and find their most popular projects on GitHub and their top co-contributors.

Use the enrichx402 twitter search to find 10 thought leaders in the space on X. More niche the better. 
For each person, create a subtask to research them individually.
Find out where they work and any public work they've done, focusing on GitHub.

Find the 3 most relevant GitHub projects for each.
In those projects, identify 2-3 other GitHub accounts they collaborate with often,
or note if they mostly work alone.

Final report:
- List the target individuals.
- For each, include:
  - A summary of their X activity and recent thoughts.
  - A report on their GitHub with a "real developer score".
  - The people they often work with on GitHub.`}
          />

          <ExamplePrompt
            icon={MessageSquare}
            title="Video Ad Generation"
            description="Generate a short form video ad for a product or service."
            tools={[
              { name: 'Web Search', icon: Globe },
              { name: 'Video Gen', icon: Video },
              { name: 'FFmpeg', icon: Film },
            ]}
            recommendedClient={Clients.ClaudeCode}
            prompt={`Goal: Generate a video ad for {{Product or Service|eg. a new AI tool}}.

Use the tools in enrichx402 to find information about the product or service.
Look for images and videos that are relevant to the product or service. Download them and save them to a folder.
Spend time building a library of assets that are relevant to the product or service.
Use the stablestudio tools to generate a video ad for the product or service. Use the images and videos from the folder as assets.
Use ffmpeg to make edits and combine the video parts into a final video.


Do research on this product/service. Create a style that is consistent with this product/service
Come up with a script for the video ad with 3 segments. The script should break down each shot 
and describe the action and the camera movement and the style of the shot. Retain consistency in the style of the shots across the segments.
Generate each segment using the stablestudio tools. Combine the segments into a final video using ffmpeg.
Utilize the video library as assets in the video ad.
`}
          />
        </section>
      </div>
    </Body>
  );
}
