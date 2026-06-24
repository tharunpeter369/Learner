import type { Problem } from '@/lib/problems';

// Top 10 interview problems for Module 8 (CSS & Styling Architecture).
// The grader runs without a DOM (no document/CSSOM), so these target the JS
// LOGIC behind CSS architecture — specificity math, class-name utilities,
// design tokens, the box model, shorthand expansion, responsive breakpoints,
// and a tailwind-merge-style conflict resolver. All runtime-gradable as pure
// string/logic problems.
// `tests` may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'compute-specificity',
    title: 'Compute selector specificity',
    difficulty: 'Medium',
    tags: ['css', 'specificity', 'parsing'],
    prompt:
      "Specificity is the (a, b, c) triple the cascade uses to rank selectors. Implement `specificity(selector)` returning `[a, b, c]` where: `a` = count of `#id`, `b` = count of `.class` + `[attr]` + `:pseudo-class`, `c` = count of `tag` (element) + `::pseudo-element`. Selectors are simple, space/combinator-separated. Ignore the universal `*` and all combinators (`>`, `+`, `~`, and whitespace). Assume single-colon `:x` is a pseudo-class (counts in b) and double-colon `::x` is a pseudo-element (counts in c).",
    examples: [
      { input: "specificity('#nav .list li')", output: '[1, 1, 1]' },
      { input: "specificity('a:hover::before')", output: '[0, 1, 2]' },
    ],
    hints: [
      'Tokenize on whitespace AND combinators, then drop empty tokens and any token that is just `*`.',
      'Within a compound token, scan for `#`, `.`, `[`, `::`, and `:` markers; order matters — check `::` before single `:`.',
      'A bare leading word (no marker) is an element/tag and counts toward c.',
    ],
    starterCode: `function specificity(selector) {
  // return [a, b, c]
}`,
    solution: `function specificity(selector) {
  let a = 0, b = 0, c = 0;
  // split on combinators and whitespace
  const tokens = selector.split(/[\\s>+~]+/).filter((t) => t && t !== '*');
  for (const token of tokens) {
    // walk the compound selector marker by marker
    let i = 0;
    // a leading bare element name (before any marker) counts as a tag
    const lead = token.match(/^[a-zA-Z][\\w-]*/);
    if (lead) { c++; i = lead[0].length; }
    while (i < token.length) {
      const ch = token[i];
      if (ch === '#') { a++; i++; while (i < token.length && /[\\w-]/.test(token[i])) i++; }
      else if (ch === '.') { b++; i++; while (i < token.length && /[\\w-]/.test(token[i])) i++; }
      else if (ch === '[') { b++; while (i < token.length && token[i] !== ']') i++; i++; }
      else if (ch === ':' && token[i + 1] === ':') { c++; i += 2; while (i < token.length && /[\\w-]/.test(token[i])) i++; }
      else if (ch === ':') { b++; i++; while (i < token.length && /[\\w-]/.test(token[i])) i++; }
      else i++;
    }
  }
  return [a, b, c];
}`,
    tests: `assertEqual(specificity('#nav .list li'), [1, 1, 1], 'id + class + tag');
assertEqual(specificity('a:hover::before'), [0, 1, 2], 'pseudo-class b, pseudo-element c');
assertEqual(specificity('*'), [0, 0, 0], 'universal is ignored');
assertEqual(specificity('div[data-x].box#main'), [1, 2, 1], 'attr + class in b, tag in c, id in a');`,
  },

  {
    id: 'compare-specificity',
    title: 'Compare two selectors',
    difficulty: 'Easy',
    tags: ['css', 'specificity', 'cascade'],
    prompt:
      "The cascade picks a winner by comparing specificity triples left-to-right. Implement `compareSpecificity(s1, s2)`: parse both selectors the same way as `specificity` (a = #id, b = .class/[attr]/:pseudo-class, c = tag/::pseudo-element), then compare `a` first, then `b`, then `c`. Return `1` if `s1` wins, `-1` if `s2` wins, and `0` if they tie.",
    examples: [
      { input: "compareSpecificity('#a', '.b .c .d')", output: '1' },
      { input: "compareSpecificity('ul li', 'p span')", output: '0' },
    ],
    hints: [
      'Reuse the same tokenizing/counting logic to build each triple.',
      'Walk the two triples index by index; the first differing slot decides the winner.',
      'If every slot is equal, return 0.',
    ],
    starterCode: `function compareSpecificity(s1, s2) {
  // return 1, -1, or 0
}`,
    solution: `function compareSpecificity(s1, s2) {
  function spec(selector) {
    let a = 0, b = 0, c = 0;
    const tokens = selector.split(/[\\s>+~]+/).filter((t) => t && t !== '*');
    for (const token of tokens) {
      let i = 0;
      const lead = token.match(/^[a-zA-Z][\\w-]*/);
      if (lead) { c++; i = lead[0].length; }
      while (i < token.length) {
        const ch = token[i];
        if (ch === '#') { a++; i++; while (i < token.length && /[\\w-]/.test(token[i])) i++; }
        else if (ch === '.') { b++; i++; while (i < token.length && /[\\w-]/.test(token[i])) i++; }
        else if (ch === '[') { b++; while (i < token.length && token[i] !== ']') i++; i++; }
        else if (ch === ':' && token[i + 1] === ':') { c++; i += 2; while (i < token.length && /[\\w-]/.test(token[i])) i++; }
        else if (ch === ':') { b++; i++; while (i < token.length && /[\\w-]/.test(token[i])) i++; }
        else i++;
      }
    }
    return [a, b, c];
  }
  const x = spec(s1), y = spec(s2);
  for (let i = 0; i < 3; i++) {
    if (x[i] > y[i]) return 1;
    if (x[i] < y[i]) return -1;
  }
  return 0;
}`,
    tests: `assertEqual(compareSpecificity('#a', '.b .c .d'), 1, 'one id beats three classes');
assertEqual(compareSpecificity('.b .c .d', '#a'), -1, 'three classes lose to one id');
assertEqual(compareSpecificity('ul li', 'p span'), 0, 'equal triples tie');
assertEqual(compareSpecificity('.btn:hover', '.btn'), 1, 'extra pseudo-class wins');`,
  },

  {
    id: 'classnames-cx',
    title: 'Build a classNames (cx) utility',
    difficulty: 'Medium',
    tags: ['css', 'utilities', 'classnames'],
    prompt:
      "Implement `cx(...args)`, a clsx/classNames-style helper. It accepts any mix of: strings (kept if truthy/non-empty), numbers (kept only if truthy — `0` and `NaN` are dropped, other numbers are stringified), arrays (recurse into them), and plain objects (include each key whose value is truthy). Falsy values (`null`, `undefined`, `false`, `''`, `0`) are skipped. Return a single space-joined string in encounter order. Do NOT dedupe — clsx keeps duplicates.",
    examples: [
      { input: "cx('a', null, ['b', { c: true, d: false }], 0, 5)", output: "'a b c 5'" },
      { input: "cx('x', 'x', { x: true })", output: "'x x x'" },
    ],
    hints: [
      'Build a flat array of class names, then join them with a single space at the end.',
      'For arrays, recurse with the same logic; for objects, push keys whose value is truthy.',
      'For numbers, push `String(n)` only when `n` is truthy (this drops 0 and NaN).',
    ],
    starterCode: `function cx(...args) {
  // return a space-joined class string
}`,
    solution: `function cx(...args) {
  const out = [];
  function add(arg) {
    if (!arg) return;
    if (typeof arg === 'string') { out.push(arg); return; }
    if (typeof arg === 'number') { out.push(String(arg)); return; }
    if (Array.isArray(arg)) { for (const item of arg) add(item); return; }
    if (typeof arg === 'object') {
      for (const key in arg) { if (arg[key]) out.push(key); }
    }
  }
  for (const arg of args) add(arg);
  return out.join(' ');
}`,
    tests: `assertEqual(cx('a', null, ['b', { c: true, d: false }], 0, 5), 'a b c 5', 'mixed args, falsy dropped');
assertEqual(cx('x', 'x', { x: true }), 'x x x', 'duplicates are kept');
assertEqual(cx(false, '', null, undefined), '', 'all falsy → empty string');
assertEqual(cx({ a: 1, b: 0, c: 'yes' }), 'a c', 'object keys filtered by truthiness');`,
  },

  {
    id: 'css-case-convert',
    title: 'Convert CSS property casing',
    difficulty: 'Easy',
    tags: ['css', 'cssom', 'strings'],
    prompt:
      "The CSSOM uses camelCase property names while CSS source uses kebab-case. Implement two functions: `kebabToCamel(prop)` turns `'font-size'` into `'fontSize'` (uppercase the letter after each hyphen, remove the hyphen), and `camelToKebab(prop)` turns `'fontSize'` into `'font-size'` (insert a hyphen before each uppercase letter and lowercase it). Keep it simple: assume no vendor prefixes and no leading hyphen.",
    examples: [
      { input: "kebabToCamel('background-color')", output: "'backgroundColor'" },
      { input: "camelToKebab('marginTop')", output: "'margin-top'" },
    ],
    hints: [
      'kebabToCamel: replace `-x` with the uppercase of `x` using a regex callback.',
      'camelToKebab: replace each uppercase letter with `-` + its lowercase form.',
      'A round-trip should be lossless for simple names: camelToKebab(kebabToCamel(x)) === x.',
    ],
    starterCode: `function kebabToCamel(prop) {
  // 'font-size' -> 'fontSize'
}

function camelToKebab(prop) {
  // 'fontSize' -> 'font-size'
}`,
    solution: `function kebabToCamel(prop) {
  return prop.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

function camelToKebab(prop) {
  return prop.replace(/[A-Z]/g, (ch) => '-' + ch.toLowerCase());
}`,
    tests: `assertEqual(kebabToCamel('font-size'), 'fontSize', 'kebab -> camel');
assertEqual(kebabToCamel('background-color'), 'backgroundColor', 'multi-word kebab -> camel');
assertEqual(camelToKebab('marginTop'), 'margin-top', 'camel -> kebab');
assertEqual(camelToKebab(kebabToCamel('border-bottom-width')), 'border-bottom-width', 'round-trip is lossless');`,
  },

  {
    id: 'resolve-token',
    title: 'Resolve a design token chain',
    difficulty: 'Medium',
    tags: ['css', 'design-tokens', 'variables'],
    prompt:
      "Design tokens often reference other tokens via `var(--x)`. Implement `resolveToken(tokens, name)` that follows the `var(--x)` chain from `name` until it reaches a concrete value (one that is not exactly a single `var(--y)` reference), and returns that value. If a referenced token is missing, or a reference cycle is detected, return `null`. A token value is a reference only if it matches the whole string `var(--something)`.",
    examples: [
      { input: "resolveToken({ '--a': 'var(--b)', '--b': '#111' }, '--a')", output: "'#111'" },
      { input: "resolveToken({ '--a': 'var(--b)', '--b': 'var(--a)' }, '--a')", output: 'null' },
    ],
    hints: [
      'Test a value for being a pure reference with a regex like `/^var\\\\(\\\\s*(--[\\\\w-]+)\\\\s*\\\\)$/`.',
      'Track visited token names in a Set; if you revisit one, you have a cycle → return null.',
      'If the current token name is not present in `tokens`, return null.',
    ],
    starterCode: `function resolveToken(tokens, name) {
  // follow the var(--x) chain to a concrete value, or null
}`,
    solution: `function resolveToken(tokens, name) {
  const seen = new Set();
  let current = name;
  while (true) {
    if (seen.has(current)) return null; // cycle
    seen.add(current);
    if (!(current in tokens)) return null; // missing
    const value = tokens[current];
    const ref = /^var\\(\\s*(--[\\w-]+)\\s*\\)$/.exec(value);
    if (!ref) return value; // concrete value
    current = ref[1];
  }
}`,
    tests: `assertEqual(resolveToken({ '--a': 'var(--b)', '--b': '#111' }, '--a'), '#111', 'follows one hop');
assertEqual(resolveToken({ '--a': 'var(--b)', '--b': 'var(--c)', '--c': 'red' }, '--a'), 'red', 'follows multiple hops');
assertEqual(resolveToken({ '--a': 'var(--missing)' }, '--a'), null, 'missing reference → null');
assertEqual(resolveToken({ '--a': 'var(--b)', '--b': 'var(--a)' }, '--a'), null, 'cycle → null');`,
  },

  {
    id: 'expand-margin-shorthand',
    title: 'Expand the margin shorthand',
    difficulty: 'Medium',
    tags: ['css', 'box-model', 'shorthand'],
    prompt:
      "CSS `margin` (and padding) uses a 1–4 value shorthand. Implement `expandMargin(value)` returning `{ top, right, bottom, left }` (values kept as strings) using these rules: 1 value → all four equal; 2 values → `top/bottom` = first, `right/left` = second; 3 values → top, right/left, bottom; 4 values → top, right, bottom, left (clockwise). Collapse multiple spaces. Always return keys in the order top, right, bottom, left.",
    examples: [
      { input: "expandMargin('10px')", output: "{ top: '10px', right: '10px', bottom: '10px', left: '10px' }" },
      { input: "expandMargin('10px 20px')", output: "{ top: '10px', right: '20px', bottom: '10px', left: '20px' }" },
    ],
    hints: [
      'Trim and split on `/\\\\s+/` to get the parts array.',
      'Map each part-count (1,2,3,4) to the right [top, right, bottom, left] arrangement.',
      'Build the result object with keys in the fixed order top, right, bottom, left.',
    ],
    starterCode: `function expandMargin(value) {
  // return { top, right, bottom, left }
}`,
    solution: `function expandMargin(value) {
  const parts = value.trim().split(/\\s+/);
  let top, right, bottom, left;
  if (parts.length === 1) {
    top = right = bottom = left = parts[0];
  } else if (parts.length === 2) {
    top = bottom = parts[0];
    right = left = parts[1];
  } else if (parts.length === 3) {
    top = parts[0];
    right = left = parts[1];
    bottom = parts[2];
  } else {
    top = parts[0];
    right = parts[1];
    bottom = parts[2];
    left = parts[3];
  }
  return { top, right, bottom, left };
}`,
    tests: `assertEqual(expandMargin('10px'), { top: '10px', right: '10px', bottom: '10px', left: '10px' }, '1 value → all');
assertEqual(expandMargin('10px 20px'), { top: '10px', right: '20px', bottom: '10px', left: '20px' }, '2 values');
assertEqual(expandMargin('1px 2px 3px'), { top: '1px', right: '2px', bottom: '3px', left: '2px' }, '3 values');
assertEqual(expandMargin('1px 2px 3px 4px'), { top: '1px', right: '2px', bottom: '3px', left: '4px' }, '4 values clockwise');`,
  },

  {
    id: 'match-breakpoint',
    title: 'Match a mobile-first breakpoint',
    difficulty: 'Medium',
    tags: ['css', 'responsive', 'breakpoints'],
    prompt:
      "Mobile-first responsive design applies the largest breakpoint whose `min` width fits. Implement `matchBreakpoint(width, breakpoints)` where `breakpoints` is an array of `{ name, min }` (not guaranteed sorted). Return the `name` of the breakpoint with the LARGEST `min` that is `<= width`. If no breakpoint qualifies (width is below every `min`), return `null`.",
    examples: [
      {
        input: "matchBreakpoint(800, [{ name: 'sm', min: 640 }, { name: 'lg', min: 1024 }, { name: 'md', min: 768 }])",
        output: "'md'",
      },
      { input: "matchBreakpoint(500, [{ name: 'sm', min: 640 }])", output: 'null' },
    ],
    hints: [
      'Filter to breakpoints whose `min <= width`.',
      'Among the survivors, pick the one with the maximum `min`.',
      'If nothing survives, return null.',
    ],
    starterCode: `function matchBreakpoint(width, breakpoints) {
  // return the name of the largest matching breakpoint, or null
}`,
    solution: `function matchBreakpoint(width, breakpoints) {
  let best = null;
  for (const bp of breakpoints) {
    if (bp.min <= width && (best === null || bp.min > best.min)) {
      best = bp;
    }
  }
  return best ? best.name : null;
}`,
    tests: `const bps = [{ name: 'sm', min: 640 }, { name: 'lg', min: 1024 }, { name: 'md', min: 768 }];
assertEqual(matchBreakpoint(800, bps), 'md', 'largest min <= width');
assertEqual(matchBreakpoint(1200, bps), 'lg', 'widest breakpoint');
assertEqual(matchBreakpoint(640, bps), 'sm', 'exact min matches (inclusive)');
assertEqual(matchBreakpoint(500, bps), null, 'below all breakpoints → null');`,
  },

  {
    id: 'box-model-width',
    title: 'Compute rendered box width',
    difficulty: 'Medium',
    tags: ['css', 'box-model', 'box-sizing'],
    prompt:
      "The `box-sizing` property changes what `width` measures. Implement `borderBoxWidth({ width, padding, border, boxSizing })` returning the rendered OUTER (border-box) width as a number. For `boxSizing: 'content-box'`, `width` is the content width, so outer = `width + 2*padding + 2*border`. For `boxSizing: 'border-box'`, `width` already IS the outer width, so outer = `width` (the content shrinks to absorb padding and border). Assume symmetric padding/border (applied on both sides).",
    examples: [
      { input: "borderBoxWidth({ width: 100, padding: 10, border: 5, boxSizing: 'content-box' })", output: '130' },
      { input: "borderBoxWidth({ width: 100, padding: 10, border: 5, boxSizing: 'border-box' })", output: '100' },
    ],
    hints: [
      'For content-box, add padding and border on both sides: 2*padding + 2*border.',
      'For border-box, the outer width is simply `width`.',
      'Return a plain number, not a string.',
    ],
    starterCode: `function borderBoxWidth({ width, padding, border, boxSizing }) {
  // return the outer rendered width as a number
}`,
    solution: `function borderBoxWidth({ width, padding, border, boxSizing }) {
  if (boxSizing === 'border-box') return width;
  return width + 2 * padding + 2 * border;
}`,
    tests: `assertEqual(borderBoxWidth({ width: 100, padding: 10, border: 5, boxSizing: 'content-box' }), 130, 'content-box adds padding + border');
assertEqual(borderBoxWidth({ width: 100, padding: 10, border: 5, boxSizing: 'border-box' }), 100, 'border-box width is the outer width');
assertEqual(borderBoxWidth({ width: 200, padding: 0, border: 0, boxSizing: 'content-box' }), 200, 'no padding/border → unchanged');
assertEqual(borderBoxWidth({ width: 50, padding: 25, border: 0, boxSizing: 'content-box' }), 100, 'padding only');`,
  },

  {
    id: 'merge-utilities',
    title: 'Resolve conflicting utility classes',
    difficulty: 'Hard',
    tags: ['css', 'tailwind', 'utilities'],
    prompt:
      "Build a tiny tailwind-merge. Implement `mergeUtilities(classString)` over space-separated utility classes. Two classes CONFLICT when they share the same GROUP, defined as the substring before the last `-` (e.g. `px-2` and `px-4` are group `px`; `text-sm` and `text-lg` are group `text`; `border-t-2` and `border-t-4` are group `border-t`). A class with NO `-` (e.g. `flex`, `block`) is its own group (the whole token). Within each group keep only the LAST occurrence; a later class removes any earlier class from its group. Return the surviving classes joined by single spaces, in the order of each survivor's FINAL position.",
    examples: [
      { input: "mergeUtilities('px-2 py-1 px-4')", output: "'py-1 px-4'" },
      { input: "mergeUtilities('flex text-sm text-lg block')", output: "'flex text-lg block'" },
    ],
    hints: [
      'Group key is the substring before the last hyphen via cls.lastIndexOf, or the whole class if there is no hyphen.',
      'Iterate left to right, remembering the latest index that claimed each group key.',
      'Build the result by keeping only the class at each group key final index, then sort survivors by their original index.',
    ],
    starterCode: `function mergeUtilities(classString) {
  // return the conflict-resolved class string (last wins per group)
}`,
    solution: `function mergeUtilities(classString) {
  const classes = classString.trim().split(/\\s+/).filter(Boolean);
  const groupKey = (cls) => {
    const idx = cls.lastIndexOf('-');
    return idx === -1 ? cls : cls.slice(0, idx);
  };
  const lastIndexForGroup = new Map();
  classes.forEach((cls, i) => {
    lastIndexForGroup.set(groupKey(cls), i);
  });
  const winners = new Set(lastIndexForGroup.values());
  return classes.filter((_, i) => winners.has(i)).join(' ');
}`,
    tests: `assertEqual(mergeUtilities('px-2 py-1 px-4'), 'py-1 px-4', 'last px wins, py kept');
assertEqual(mergeUtilities('text-sm text-lg'), 'text-lg', 'last in group wins');
assertEqual(mergeUtilities('flex text-sm text-lg block'), 'flex text-lg block', 'flex/block survive, last text wins');
assertEqual(mergeUtilities('border-t-2 border-t-4 border-b-2'), 'border-t-4 border-b-2', 'group is everything before last dash');`,
  },

  {
    id: 'clamp-value',
    title: 'Implement CSS clamp() semantics',
    difficulty: 'Easy',
    tags: ['css', 'math', 'functions'],
    prompt:
      "CSS `clamp(min, val, max)` bounds a preferred value between a minimum and a maximum. Its numeric semantics are `max(min, min(val, max))`. Implement `clampValue(min, val, max)` returning the bounded number: if `val` is below `min` return `min`, if above `max` return `max`, otherwise return `val`. Note the documented edge case: if `min > max`, the `min` wins (because `max(min, ...)` is applied last).",
    examples: [
      { input: 'clampValue(10, 5, 20)', output: '10' },
      { input: 'clampValue(10, 25, 20)', output: '20' },
    ],
    hints: [
      'Translate the spec literally: `Math.max(min, Math.min(val, max))`.',
      'Do not special-case in-range values; the formula already returns `val` when it is between min and max.',
      'For the `min > max` edge case, trust the formula — the outer `Math.max` makes min win.',
    ],
    starterCode: `function clampValue(min, val, max) {
  // return max(min, min(val, max))
}`,
    solution: `function clampValue(min, val, max) {
  return Math.max(min, Math.min(val, max));
}`,
    tests: `assertEqual(clampValue(10, 5, 20), 10, 'below min → min');
assertEqual(clampValue(10, 25, 20), 20, 'above max → max');
assertEqual(clampValue(10, 15, 20), 15, 'in range → val');
assertEqual(clampValue(30, 5, 20), 30, 'min > max edge case → min wins');`,
  },
];
