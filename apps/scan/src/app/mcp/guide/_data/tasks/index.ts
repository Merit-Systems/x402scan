import {
  GraduationCap,
  PenTool,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';

import { findLeads } from './find-leads';
import { createContent } from './create-content';
import { researchCompanies } from './research-companies';
import { analyzeMarkets } from './analyze-markets';
import { findExperts } from './find-experts';

import type { LucideIcon } from 'lucide-react';
import type { TaskKey } from '../../_types';

export const tasks = {
  'find-leads': findLeads,
  'create-content': createContent,
  'research-companies': researchCompanies,
  'analyze-markets': analyzeMarkets,
  'find-experts': findExperts,
} as const;

export const taskIcons: Record<TaskKey, LucideIcon> = {
  'find-leads': Users,
  'create-content': PenTool,
  'research-companies': Search,
  'analyze-markets': TrendingUp,
  'find-experts': GraduationCap,
};
