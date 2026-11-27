const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { gzipSync } = require('node:zlib');

let server;
let baseUrl;

async function availablePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port;
      socket.close(() => resolve(port));
    });
  });
}

before(async () => {
  const port = await availablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NEWS_API_KEY: '',
      GEMINI_API_KEY: '',
      OPENROUTER_API_KEY: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let lastError;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) throw new Error('FinNews server exited before becoming ready');
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) { lastError = err; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start: ${lastError?.message}`);
});

after(() => {
  if (server && server.exitCode === null) server.kill();
});

test('homepage is served', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /FinNews/);
});

test('news endpoint responds with structurally valid articles when no external key is configured', async () => {
  const response = await fetch(`${baseUrl}/api/news?category=business`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(Array.isArray(data.articles));
  for (const article of data.articles) {
    assert.equal(typeof article.title, 'string');
    assert.equal(typeof article.url, 'string');
  }
});

test('quiz fallback contains three usable questions', async () => {
  const response = await fetch(`${baseUrl}/api/quiz?difficulty=medium`, {method: 'POST'});
  assert.equal(response.status, 200);
  const questions = await response.json();
  assert.equal(questions.length, 3);
  for (const item of questions) {
    assert.ok(item.question);
    assert.equal(item.options.length, 4);
    assert.ok(item.options.includes(item.correctAnswer));
  }
});

test('quiz endpoint accepts a gzip-compressed JSON request', async () => {
  const response = await fetch(`${baseUrl}/api/quiz?difficulty=medium`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' },
    body: gzipSync('{}')
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).length, 3);
});

test('unknown API route returns 404', async () => {
  const response = await fetch(`${baseUrl}/api/unknown-path`);
  assert.equal(response.status, 404);
});
