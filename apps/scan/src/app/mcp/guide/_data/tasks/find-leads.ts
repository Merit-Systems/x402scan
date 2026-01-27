import type { TaskData } from '../../_types';

export const findLeads: TaskData = {
  id: 'find-leads',
  name: 'Find Sales Leads',
  description: 'Discover and qualify potential customers for outreach',
  color: 'text-blue-500',
  lessons: [
    {
      id: 'find-leads-research-prospect',
      title: 'Research a Prospect',
      description:
        'Gather comprehensive information about a potential customer before reaching out.',
      difficulty: 'beginner',
      estimatedCost: '~$0.02',
      tools: ['People Search', 'LinkedIn'],
      expectedOutcome:
        'A detailed profile with job history, recent activities, and talking points.',
      prompt: `Research {{Name|John Smith}} who works at {{Company|Acme Corp}}.

Find their:
- Current role and responsibilities
- Career history and background
- Recent LinkedIn activity or posts
- Potential pain points based on their role
- Mutual connections or shared interests

Compile this into a brief I can review before reaching out.`,
    },
    {
      id: 'find-leads-company-contacts',
      title: 'Find Key Contacts at a Company',
      description:
        'Identify decision makers and stakeholders at a target organization.',
      difficulty: 'beginner',
      estimatedCost: '~$0.04',
      tools: ['Org Search', 'LinkedIn'],
      expectedOutcome: 'A list of key contacts with their roles and influence.',
      prompt: `Find the key contacts at {{Company|Enterprise Corp}} for {{Product Area|developer tools}}.

Look for:
- Decision makers who would approve purchases
- Technical evaluators who would assess the product
- Champions who might advocate internally
- Their roles, backgrounds, and how to reach them

Organize by influence level and likelihood to engage.`,
    },
    {
      id: 'find-leads-similar-companies',
      title: 'Find Similar Companies',
      description: 'Discover companies that match your ideal customer profile.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.05',
      tools: ['Web Search', 'Firecrawl'],
      expectedOutcome:
        'A list of companies matching your criteria with key details.',
      prompt: `Find companies similar to {{Example Company|Stripe}} in the {{Industry|fintech}} space.

Look for companies that:
- Are at a similar stage ({{Stage|Series B+}})
- Have {{Employee Count|100-500}} employees
- Are based in {{Region|North America}}
- Work on similar problems

For each, provide: name, what they do, funding, headcount, and why they're a good fit.`,
    },
    {
      id: 'find-leads-personalized-outreach',
      title: 'Personalize Your Outreach',
      description:
        'Create a personalized message based on recent activity and interests.',
      difficulty: 'intermediate',
      estimatedCost: '~$0.03',
      tools: ['Twitter', 'Web Search'],
      expectedOutcome:
        'A personalized outreach template with specific talking points.',
      prompt: `Help me personalize outreach to {{Name|Sarah Chen}} at {{Company|TechStart Inc}}.

Search for:
- Their recent tweets or social media posts
- Any blog posts or articles they've written
- Recent company news or announcements
- Topics they seem passionate about

Then draft a personalized message that references something specific and relevant to them.`,
    },
  ],
};
