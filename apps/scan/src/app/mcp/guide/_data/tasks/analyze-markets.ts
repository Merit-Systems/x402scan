import type { TaskData } from '../../_types';

export const analyzeMarkets: TaskData = {
  id: 'analyze-markets',
  name: 'Analyze Markets',
  description: 'Understand market landscapes, trends, and opportunities',
  color: 'text-purple-500',
  lessons: [
    {
      id: 'analyze-markets-landscape',
      title: 'Map a Market Landscape',
      description: 'Get an overview of all the players in a market.',
      difficulty: 'beginner',
      estimatedCost: '~$0.05',
      tools: ['Web Search', 'Firecrawl'],
      expectedOutcome: 'A market map with categorized players and positioning.',
      prompt: `Map the competitive landscape for {{Market|API infrastructure}}.

Identify:
- Major established players
- Emerging startups and challengers
- How players are typically categorized
- Key differentiators between competitors
- Recent funding rounds in the space

Present as a market map with players grouped by category.`,
    },
    {
      id: 'analyze-markets-sizing',
      title: 'Size a Market',
      description: 'Estimate the total addressable market for an opportunity.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.06',
      tools: ['Web Search', 'Firecrawl'],
      expectedOutcome: 'TAM/SAM/SOM analysis with methodology and sources.',
      prompt: `Size the market for {{Product|AI-powered code review tools}}.

Research and estimate:
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)
- Market growth rate and projections
- Key assumptions driving the estimates

Show your methodology and cite sources.`,
    },
    {
      id: 'analyze-markets-trends',
      title: 'Identify Emerging Trends',
      description: 'Spot trends before they become mainstream.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.06',
      tools: ['Web Search', 'Twitter'],
      expectedOutcome: 'A trend report with evidence and implications.',
      prompt: `Identify emerging trends in {{Industry|enterprise AI adoption}}.

Research:
- Key trends and what's driving them
- Early adopters and case studies
- Barriers to mainstream adoption
- Expert opinions and predictions
- Timeline for when trends might go mainstream

Synthesize into a trend report with strategic implications.`,
    },
    {
      id: 'analyze-markets-user-feedback',
      title: 'Mine User Feedback',
      description: 'Extract insights from public user feedback and reviews.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.05',
      tools: ['Firecrawl', 'Twitter'],
      expectedOutcome: 'Categorized feedback themes with opportunities.',
      prompt: `Mine user feedback for {{Product|Notion}} to find opportunities.

Scrape and analyze:
- App store reviews (positive and negative)
- Twitter mentions and complaints
- Reddit discussions
- G2/Capterra reviews
- Feature requests on community forums

Categorize into themes and identify the biggest pain points and opportunities.`,
    },
  ],
};
