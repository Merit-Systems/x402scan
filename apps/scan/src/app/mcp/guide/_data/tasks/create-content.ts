import type { TaskData } from '../../_types';

export const createContent: TaskData = {
  id: 'create-content',
  name: 'Create Content',
  description: 'Generate ideas and create compelling content for your audience',
  color: 'text-pink-500',
  lessons: [
    {
      id: 'create-content-trending-topics',
      title: 'Find Trending Topics',
      description:
        'Discover what topics are gaining traction in your target market.',
      difficulty: 'beginner',
      estimatedCost: '~$0.02',
      tools: ['Twitter', 'Web Search'],
      expectedOutcome: 'A list of trending topics with content opportunities.',
      prompt: `Find trending topics in {{Industry|fintech}} that I could create content about.

Look for:
- Hashtags and keywords gaining momentum
- Conversations getting high engagement
- Pain points people are discussing
- Questions being asked frequently
- Content gaps I could fill

Summarize into 5-10 actionable content ideas with suggested angles.`,
    },
    {
      id: 'create-content-find-influencers',
      title: 'Find Relevant Influencers',
      description:
        'Discover key voices in your industry for inspiration or partnerships.',
      difficulty: 'beginner',
      estimatedCost: '~$0.03',
      tools: ['Twitter', 'People Search'],
      expectedOutcome:
        'A list of influencers with engagement metrics and content themes.',
      prompt: `Find the top voices in the {{Industry|AI/ML}} space who talk about {{Topic|developer tools}}.

Look for:
- Twitter accounts with high engagement (not just followers)
- Their typical content themes and style
- Posting frequency and best-performing content
- Whether they engage with their audience
- How to potentially reach or collaborate with them

Rank by relevance and engagement, not just follower count.`,
    },
    {
      id: 'create-content-competitor-content',
      title: 'Analyze Competitor Content',
      description: 'See what content is working for your competitors.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.04',
      tools: ['Firecrawl', 'Web Search'],
      expectedOutcome:
        'An analysis of competitor content strategy with opportunities.',
      prompt: `Analyze the content strategy of {{Competitor|HubSpot}}.

Research:
- What topics they cover on their blog
- Their most shared or linked content
- Content formats they use (guides, tools, videos)
- Keywords they seem to target
- Gaps in their content I could fill

Provide recommendations for content I could create that would compete.`,
    },
    {
      id: 'create-content-generate-video',
      title: 'Generate a Video Ad',
      description: 'Create a short video ad using AI generation.',
      difficulty: 'advanced',
      estimatedCost: '~$0.50',
      tools: ['StableStudio', 'Web Search'],
      expectedOutcome: 'A short promotional video for social media.',
      prompt: `Create a short video ad for {{Product|our new feature launch}}.

First research:
- Successful video ad styles in {{Industry|SaaS}}
- Trending visual aesthetics

Then generate:
- A 5-10 second video clip showcasing the product
- Professional, modern aesthetic
- Suitable for LinkedIn and Twitter

Include the video file and suggestions for captions.`,
    },
  ],
};
