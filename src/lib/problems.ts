import { problems as mernArchitect1 } from '@/content/mern-architect/1-problems';
import { problems as mernArchitect2 } from '@/content/mern-architect/2-problems';
import { problems as mernArchitect3 } from '@/content/mern-architect/3-problems';
import { problems as mernArchitect4 } from '@/content/mern-architect/4-problems';
import { problems as mernArchitect5 } from '@/content/mern-architect/5-problems';
import { problems as mernArchitect6 } from '@/content/mern-architect/6-problems';
import { problems as mernArchitect7 } from '@/content/mern-architect/7-problems';
import { problems as mernArchitect8 } from '@/content/mern-architect/8-problems';
import { problems as mernArchitect9 } from '@/content/mern-architect/9-problems';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  id: string; // stable slug — also the saved_code.problem_id
  title: string;
  difficulty: Difficulty;
  /** Editor + runner language. Defaults to 'javascript'. */
  language?: 'javascript' | 'typescript';
  tags: string[];
  /** Markdown-ish prose; inline `code` is rendered. */
  prompt: string;
  examples: ProblemExample[];
  hints: string[];
  starterCode: string;
  solution: string;
  /** Assertion statements run in the sandbox after the user's code (auto-grade). */
  tests: string;
}

const REGISTRY: Record<string, Problem[]> = {
  'mern-architect-1': mernArchitect1,
  'mern-architect-2': mernArchitect2,
  'mern-architect-3': mernArchitect3,
  'mern-architect-4': mernArchitect4,
  'mern-architect-5': mernArchitect5,
  'mern-architect-6': mernArchitect6,
  'mern-architect-7': mernArchitect7,
  'mern-architect-8': mernArchitect8,
  'mern-architect-9': mernArchitect9,
};

export function getProblems(pathId: string, moduleId: string): Problem[] | null {
  return REGISTRY[`${pathId}-${moduleId}`] ?? null;
}
