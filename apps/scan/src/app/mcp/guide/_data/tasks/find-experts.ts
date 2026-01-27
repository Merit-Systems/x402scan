import type { TaskData } from '../../_types';

export const findExperts: TaskData = {
  id: 'find-experts',
  name: 'Find Experts',
  description: 'Discover domain experts, thought leaders, and potential hires',
  color: 'text-orange-500',
  lessons: [
    {
      id: 'find-experts-domain',
      title: 'Find Domain Experts',
      description:
        'Discover experts in a specific field for interviews or consulting.',
      difficulty: 'beginner',
      estimatedCost: '~$0.04',
      tools: ['LinkedIn', 'Twitter'],
      expectedOutcome: 'A list of experts with backgrounds and contact info.',
      prompt: `Find experts in {{Field|machine learning infrastructure}} for potential interviews.

Look for:
- People with 10+ years of relevant experience
- Authors of influential papers or books
- Frequent conference speakers
- Active on social media with thoughtful content
- Mix of industry practitioners and academics

Include their background and best way to reach them.`,
    },
    {
      id: 'find-experts-startup-founders',
      title: 'Find Interesting Founders',
      description: 'Discover startup founders working on interesting problems.',
      difficulty: 'beginner',
      estimatedCost: '~$0.04',
      tools: ['Twitter', 'Web Search'],
      expectedOutcome:
        'A curated list of founders with their companies and backgrounds.',
      prompt: `Find interesting startup founders in the {{Space|developer tools}} space.

Look for:
- Founders who recently raised funding
- People building in {{Focus Area|AI-powered development}}
- Active on Twitter sharing their journey
- Previously worked at notable companies
- Building something unique or contrarian

For each, include: name, company, what they're building, background, and where to follow them.`,
    },
    {
      id: 'find-experts-open-source',
      title: 'Find Open Source Contributors',
      description:
        'Discover active contributors and maintainers in open source.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.05',
      tools: ['Web Search', 'Twitter'],
      expectedOutcome:
        'A list of contributors with profiles and ways to connect.',
      prompt: `Find active contributors to {{Project|the Rust ecosystem}}.

Look for:
- Top contributors to key repositories
- People who've authored popular libraries
- Active maintainers open to sponsorship or consulting
- Their current employment status
- Best way to reach them (Twitter, email, Discord)

Focus on people with {{Skill|systems programming}} expertise.`,
    },
    {
      id: 'find-experts-research-patterns',
      title: 'Research Best Practices',
      description: 'Learn how top companies solve specific problems.',
      difficulty: 'advanced',
      estimatedCost: '~$0.06',
      tools: ['Web Search', 'Firecrawl'],
      expectedOutcome:
        'A synthesis of patterns and practices with case studies.',
      prompt: `Research how top companies implement {{Pattern|real-time collaboration}}.

Find:
- Architecture blog posts from Figma, Notion, Google Docs
- Technical talks and conference presentations
- Open source implementations and examples
- Trade-offs and lessons learned
- Recommended libraries and tools

Synthesize into actionable recommendations with pros/cons.`,
    },
  ],
};
