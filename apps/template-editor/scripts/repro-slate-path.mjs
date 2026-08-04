/**
 * Feedback loop for: Unable to find the path for Slate node
 *
 * Red when switching between text commands throws Slate findPath, or when
 * the rich editor fails to sync content for the selected command.
 *
 * Usage: node apps/template-editor/scripts/repro-slate-path.mjs
 * Requires: template-editor dev server on http://localhost:43127
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 9231;
const APP = 'http://localhost:43127/';

const chrome = spawn('google-chrome-stable', [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/slate-repro-loop',
  '--window-size=1440,900',
  APP,
], { stdio: 'ignore' });

async function waitChrome() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) {
        return;
      }
    }
    catch {
      // retry until chrome is ready
    }
    await sleep(100);
  }
  throw new Error('chrome not up');
}

function createCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const errors = [];
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data);
    if (data.method === 'Runtime.exceptionThrown') {
      const d = data.params.exceptionDetails;
      errors.push(d.exception?.description || d.text || JSON.stringify(d));
      return;
    }
    if (data.id && pending.has(data.id)) {
      pending.get(data.id).resolve(data);
      pending.delete(data.id);
    }
  });
  async function send(method, params) {
    await ready;
    const msgId = ++id;
    const p = new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      setTimeout(() => {
        if (pending.has(msgId)) {
          pending.delete(msgId);
          reject(new Error(`timeout ${method}`));
        }
      }, 20000);
    });
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return p;
  }
  return { send, errors, close: () => ws.close() };
}

try {
  await waitChrome();
  await sleep(2500);
  const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  const page = targets.find(t => t.type === 'page');
  const cdp = createCdp(page.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await sleep(1000);

  const results = await cdp.send('Runtime.evaluate', {
    expression: `(async () => {
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      const textButtons = [...document.querySelectorAll('[aria-label="选择 text 命令"]')];
      const out = [];
      out.push(['textCount', textButtons.length]);
      for (let i = 0; i < Math.min(textButtons.length, 5); i++) {
        textButtons[i].click();
        await sleep(250);
        const rich = document.querySelector('[aria-label="富文本内容"]');
        out.push([
          'i' + i,
          !!rich,
          document.body.innerText.includes('Unable to find the path for Slate node'),
          (rich?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
        ]);
      }
      return out;
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });

  const value = results.result?.result?.value;
  const pathErrors = cdp.errors.filter(e => String(e).includes('Unable to find the path'));
  const overlayHit = Array.isArray(value) && value.some(row => row[0]?.startsWith?.('i') && row[2] === true);
  const missingEditor = Array.isArray(value) && value.some(row => row[0]?.startsWith?.('i') && row[1] !== true);
  const texts = Array.isArray(value) ? value.filter(row => row[0]?.startsWith?.('i')).map(row => row[3]) : [];
  const uniqueTexts = new Set(texts.filter(Boolean));
  const contentStuck = texts.length >= 2 && uniqueTexts.size < 2;
  const hit = pathErrors.length > 0 || overlayHit || missingEditor || contentStuck;

  console.log(JSON.stringify({ value, pathErrors: pathErrors.map(e => String(e).slice(0, 240)), uniqueTexts: [...uniqueTexts], hit }, null, 2));
  cdp.close();
  process.exit(hit ? 1 : 0);
}
catch (error) {
  console.error(error);
  process.exit(3);
}
finally {
  chrome.kill('SIGTERM');
}
