import { syllabus as mernArchitectSyllabus } from './mern-architect';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}

export const paths: LearningPath[] = [
  {
    id: 'mern-architect',
    title: 'MERN Architect Path',
    description: 'A Senior Frontend · Fullstack · Desktop Mastery Syllabus. Move from senior engineer to architect.',
    comingSoon: false,
  },
  {
    id: 'python-senior',
    title: 'Python Backend Senior',
    description: 'Master async Python, Django internals, FastAPI performance, and advanced distributed systems.',
    comingSoon: true,
  },
  {
    id: 'flutter-mastery',
    title: 'Flutter Mastery',
    description: 'Deep dive into the Flutter engine, custom render objects, and cross-platform architecture.',
    comingSoon: true,
  },
  {
    id: 'go-systems',
    title: 'Go Systems Engineering',
    description: 'Concurrency, memory management, and building high-throughput network services in Go.',
    comingSoon: true,
  }
];

export function getSyllabus(pathId: string) {
  if (pathId === 'mern-architect') return mernArchitectSyllabus;
  return null;
}
