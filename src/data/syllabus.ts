export type DepthTier = 'Know' | 'Explain' | 'Architect';

export interface Module {
  id: string; // e.g., '1', '2'
  number: number;
  title: string;
  timeHours: string; // e.g. "18-24"
  depth: DepthTier;
  description: string;
}

export interface Part {
  id: string; // e.g., 'i', 'ii'
  numeral: string; // 'I', 'II'
  title: string;
  description: string;
  modules: Module[];
}

export const syllabus: Part[] = [
  {
    id: 'i',
    numeral: 'I',
    title: 'Language Foundations',
    description: 'Everything above is built on these two. The work here is to push your daily-use knowledge down to the level where you can explain the machine, not merely operate it.',
    modules: [
      { id: '1', number: 1, title: 'JavaScript Internals & Mastery', timeHours: '18-24', depth: 'Architect', description: 'The runtime behavior behind everything you build, and where senior candidates are most often exposed.' },
      { id: '2', number: 2, title: 'TypeScript Mastery', timeHours: '24-32', depth: 'Architect', description: 'At senior level, types are architecture. A well-typed API surface is a contract that turns misuse into a compile error.' },
    ]
  },
  {
    id: 'ii',
    numeral: 'II',
    title: 'Frontend Engineering',
    description: 'Your home turf, taken to architect depth: the rendering pipeline, React\'s internals, measurable performance, and the design of large front ends.',
    modules: [
      { id: '3', number: 3, title: 'Browser & Rendering Internals', timeHours: '12-16', depth: 'Explain', description: 'Understand the machine your UI runs on so performance work is causal rather than cargo-cult.' },
      { id: '4', number: 4, title: 'Performance & Core Web Vitals', timeHours: '14-18', depth: 'Architect', description: 'Performance is measurable and ownable; architects set budgets and defend them with numbers.' },
      { id: '5', number: 5, title: 'React Internals & Concurrent Rendering', timeHours: '16-22', depth: 'Architect', description: 'Move from using React to explaining it under load.' },
      { id: '6', number: 6, title: 'State Management & Data Fetching', timeHours: '10-14', depth: 'Architect', description: 'Choosing a state strategy is an architecture decision; be opinionated and able to justify it.' },
      { id: '7', number: 7, title: 'React 19, RSC & Server-Driven UI', timeHours: '12-16', depth: 'Architect', description: 'Be current; this is the highest-yield modern-React interview material.' },
      { id: '8', number: 8, title: 'CSS & Styling Architecture', timeHours: '8-12', depth: 'Explain', description: 'Architects own the styling strategy, not just the styles.' },
      { id: '9', number: 9, title: 'Frontend System Design', timeHours: '16-22', depth: 'Architect', description: 'The round most under-prepared seniors fail; it is a learnable, repeatable format.' },
    ]
  },
  {
    id: 'iii',
    numeral: 'III',
    title: 'Backend & Node.js',
    description: 'From writing endpoints to running services and designing systems: internals, the data layer, API contracts, and scale.',
    modules: [
      { id: '10', number: 10, title: 'Node.js Internals & Concurrency', timeHours: '16-22', depth: 'Architect', description: 'Deepen daily Node use into runtime internals and concurrency models.' },
      { id: '11', number: 11, title: 'Streams, Backpressure & Production Node', timeHours: '10-14', depth: 'Architect', description: 'The production concerns that separate "I built an API" from "I run services."' },
      { id: '12', number: 12, title: 'API Design', timeHours: '14-18', depth: 'Architect', description: 'Designing the contract is core architect work.' },
      { id: '13', number: 13, title: 'Databases & the Data Layer', timeHours: '18-24', depth: 'Architect', description: 'Data modeling and consistency decisions are where architecture lives or dies.' },
      { id: '14', number: 14, title: 'Caching & Distributed State (Redis)', timeHours: '8-12', depth: 'Explain', description: 'Caching is the highest-leverage performance tool and the easiest to get subtly wrong.' },
      { id: '15', number: 15, title: 'Backend & Fullstack System Design', timeHours: '22-28', depth: 'Architect', description: 'The big-picture round; bring a consistent framework and trade-off fluency.' },
    ]
  },
  {
    id: 'iv',
    numeral: 'IV',
    title: 'Desktop / Electron',
    description: 'Your differentiator. Few candidates can architect a secure, performant, distributable desktop app. Own this completely — it is the part of your profile that is genuinely rare.',
    modules: [
      { id: '16', number: 16, title: 'Process Model & IPC', timeHours: '10-14', depth: 'Architect', description: 'The desktop architecture most "frontend" candidates cannot speak to — your edge.' },
      { id: '17', number: 17, title: 'Security Hardening', timeHours: '10-14', depth: 'Architect', description: 'Electron ships a browser plus Node; one XSS can become full remote code execution if misconfigured.' },
      { id: '18', number: 18, title: 'Resource, Native & Multi-Window', timeHours: '10-14', depth: 'Explain', description: 'Keep a heavy runtime fast and integrated with the operating system.' },
      { id: '19', number: 19, title: 'Production, Distribution & Auto-Update', timeHours: '10-14', depth: 'Explain', description: 'Shipping a desktop app safely is its own discipline.' },
    ]
  },
  {
    id: 'v',
    numeral: 'V',
    title: 'Cross-Cutting Mastery',
    description: 'The disciplines that span every layer — and the human skills an architect is actually hired for. The last two run continuously, alongside everything else, rather than as a single block.',
    modules: [
      { id: '20', number: 20, title: 'Testing Strategy', timeHours: '14-18', depth: 'Architect', description: 'Architects define the testing strategy, not just write tests.' },
      { id: '21', number: 21, title: 'Build, CI/CD & DevOps', timeHours: '12-16', depth: 'Explain', description: 'Delivery is an architectural concern.' },
      { id: '22', number: 22, title: 'Security & Auth (Web / Node)', timeHours: '14-18', depth: 'Architect', description: 'A senior must speak security fluently across the whole stack.' },
      { id: '23', number: 23, title: 'Design Patterns & Architecture', timeHours: '16-22', depth: 'Architect', description: 'Trade-off literacy is the whole point of the title.' },
      { id: '24', number: 24, title: 'DSA & JS Utility Implementations', timeHours: '30-40', depth: 'Explain', description: 'You will still face coding rounds; the frontend/fullstack flavor is specific. Spread this across the whole journey — one rep a day.' },
      { id: '25', number: 25, title: 'Behavioral, Communication & Leadership', timeHours: '12-16', depth: 'Architect', description: 'Architect loops weigh this near half. Technical brilliance without it fails the loop.' },
    ]
  }
];
