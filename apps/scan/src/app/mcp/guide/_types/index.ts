import type { tasks } from '../_data/tasks';

// Task key derived from data
export type TaskKey = keyof typeof tasks;

// Difficulty levels for lessons
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// Individual lesson within a task
export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedCost: string;
  tools: string[];
  expectedOutcome: string;
  prompt: string;
}

// Task with its lessons
export interface TaskData {
  id: TaskKey;
  name: string;
  description: string;
  color: string;
  lessons: Lesson[];
}
