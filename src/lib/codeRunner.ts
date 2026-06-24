// Runs user JS/TS in a sandboxed Web Worker (no DOM access), streaming
// console output back to the caller. Async output (setTimeout / Promises) is
// captured until the program goes idle; infinite loops are killed by a hard cap.

const WORKER_SRC = `
function format(a){
  if (a === undefined) return 'undefined';
  if (a === null) return 'null';
  var t = typeof a;
  if (t === 'string') return a;
  if (t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol') return String(a);
  if (t === 'function') return a.toString();
  if (a instanceof Error) return a.stack || (a.name + ': ' + a.message);
  try {
    var seen = new WeakSet();
    return JSON.stringify(a, function(k, v){
      if (typeof v === 'bigint') return String(v) + 'n';
      if (typeof v === 'function') return '[Function' + (v.name ? ': ' + v.name : '') + ']';
      if (v && typeof v === 'object') { if (seen.has(v)) return '[Circular]'; seen.add(v); }
      return v;
    }, 2);
  } catch (e) { return String(a); }
}
function emit(level, args){
  try { self.postMessage({ type:'log', level:level, text: Array.prototype.map.call(args, format).join(' ') }); } catch(e){}
}
['log','info','debug','warn','error'].forEach(function(lvl){
  console[lvl] = function(){ emit(lvl === 'log' ? 'log' : lvl, arguments); };
});
self.addEventListener('unhandledrejection', function(ev){
  emit('error', ['Uncaught (in promise) ' + format(ev.reason)]);
});
self.onerror = function(msg){ emit('error', [String(msg)]); return true; };
self.onmessage = function(e){
  try { (0, eval)(e.data.code); }
  catch (err) { emit('error', [ (err && err.stack) ? err.stack : String(err) ]); }
  self.postMessage({ type:'sync-done' });
};
`;

export type RunLevel = 'log' | 'info' | 'debug' | 'warn' | 'error';

export interface RunHandlers {
  code: string;
  language: string;
  onOutput: (text: string, level: RunLevel) => void;
  onDone: (info?: { timedOut?: boolean }) => void;
  onError?: (message: string) => void;
}

const IDLE_MS = 700; // finish this long after the last output (lets async settle)
const HARD_CAP_MS = 5000; // kill runaway / infinite loops

export function runCodeInBrowser({ code, language, onOutput, onDone, onError }: RunHandlers): {
  cancel: () => void;
} {
  let finished = false;
  let worker: Worker | null = null;
  let url: string | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let hardTimer: ReturnType<typeof setTimeout> | null = null;
  let syncDone = false;

  const finish = (info?: { timedOut?: boolean }) => {
    if (finished) return;
    finished = true;
    if (idleTimer) clearTimeout(idleTimer);
    if (hardTimer) clearTimeout(hardTimer);
    if (worker) worker.terminate();
    if (url) URL.revokeObjectURL(url);
    onDone(info);
  };

  const bumpIdle = () => {
    if (!syncDone) return;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => finish(), IDLE_MS);
  };

  (async () => {
    let js = code;
    const lang = (language || '').toLowerCase();
    if (lang === 'typescript' || lang === 'ts') {
      try {
        const ts = await import('typescript');
        js = ts.transpile(code, { target: ts.ScriptTarget.ES2020 });
      } catch (err) {
        onError?.('TypeScript transpile failed:\n' + String(err));
        finish();
        return;
      }
    }
    if (finished) return;

    try {
      const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
      url = URL.createObjectURL(blob);
      worker = new Worker(url);
    } catch (err) {
      onError?.('Failed to start the sandbox: ' + String(err));
      finish();
      return;
    }

    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data as { type: string; level?: RunLevel; text?: string };
      if (msg.type === 'log') {
        onOutput(msg.text ?? '', msg.level ?? 'log');
        bumpIdle();
      } else if (msg.type === 'sync-done') {
        syncDone = true;
        bumpIdle();
      }
    };
    worker.onerror = (ev) => {
      onError?.(ev.message || 'Sandbox error');
      finish();
    };

    hardTimer = setTimeout(() => finish({ timedOut: true }), HARD_CAP_MS);
    worker.postMessage({ code: js });
  })();

  return { cancel: () => finish() };
}
