import type { TaskData } from '../../_types';

export const researchCompanies: TaskData = {
  id: 'research-companies',
  name: 'Research Companies',
  description: 'Deep dive into organizations to understand how they operate',
  color: 'text-green-500',
  lessons: [
    {
      id: 'research-companies-deep-dive',
      title: 'Company Deep Dive',
      description: 'Get a comprehensive overview of any company.',
      difficulty: 'beginner',
      estimatedCost: '~$0.04',
      tools: ['Org Search', 'Firecrawl'],
      expectedOutcome:
        'A detailed company profile with key metrics and insights.',
      prompt: `Research {{Company|Stripe}} and give me a comprehensive overview.

Find:
- Company history and founding story
- Current leadership team and their backgrounds
- Products, services, and business model
- Recent funding, revenue estimates, headcount
- Key partnerships and major customers
- Recent news and strategic moves

Compile into an executive summary I can quickly reference.`,
    },
    {
      id: 'research-companies-tech-stack',
      title: 'Analyze Their Tech Stack',
      description: 'Discover what technologies a company uses.',
      difficulty: 'beginner',
      estimatedCost: '~$0.04',
      tools: ['Web Search', 'Firecrawl'],
      expectedOutcome: 'A breakdown of technologies used with sources.',
      prompt: `Analyze the tech stack used by {{Company|Linear}}.

Research:
- Frontend frameworks and libraries
- Backend languages and frameworks
- Database and storage solutions
- Infrastructure and deployment (cloud providers)
- Developer tools and practices

Cite sources (job postings, blog posts, open source repos, BuiltWith).`,
    },
    {
      id: 'research-companies-org-structure',
      title: 'Map Their Org Structure',
      description: 'Understand how a company is organized.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.05',
      tools: ['Org Search', 'LinkedIn'],
      expectedOutcome: 'An org chart with key people and their roles.',
      prompt: `Map the organizational structure at {{Company|Notion}}.

Find:
- C-suite and their backgrounds
- Department heads and team leads
- Reporting structure where visible
- Recent leadership changes or hires
- Team sizes by department if available

Present as an org chart with notes on each person's background.`,
    },
    {
      id: 'research-companies-competitive-position',
      title: 'Analyze Competitive Position',
      description: 'Understand how a company compares to competitors.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.06',
      tools: ['Web Search', 'Firecrawl'],
      expectedOutcome: 'A competitive analysis with strengths and weaknesses.',
      prompt: `Analyze {{Company|Figma}}'s competitive position in the {{Market|design tools}} market.

Research:
- Their main competitors and market share
- Key differentiators and unique strengths
- Weaknesses or areas where competitors win
- Pricing comparison
- Recent competitive moves

Summarize their competitive position and likely strategy.`,
    },
  ],
};
