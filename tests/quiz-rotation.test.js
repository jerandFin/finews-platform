const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { test } = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');

test('practice quiz refresh rotates distinct questions at each difficulty', { timeout: 10000 }, async t => {
    const listener = net.createServer();
    const port = await new Promise((resolve, reject) => {
        listener.once('error', reject);
        listener.listen(0, '127.0.0.1', () => resolve(listener.address().port));
    });
    await new Promise(resolve => listener.close(resolve));

    const app = spawn(process.execPath, ['server.js'], {
        env: { ...process.env, PORT: String(port), NEWS_API_KEY: '', GEMINI_API_KEY: '', OPENROUTER_API_KEY: '' },
        stdio: 'ignore'
    });
    t.after(() => { if (app.exitCode === null) app.kill(); });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 50 && !ready; attempt++) {
        assert.equal(app.exitCode, null, 'server exited before startup');
        const response = await fetch(base).catch(() => null);
        if (response?.ok) {
            ready = true;
            await response.body.cancel();
        } else {
            await delay(100);
        }
    }
    assert.ok(ready, 'server did not start');

    const allQuestions = new Set();
    for (const difficulty of ['easy', 'medium', 'hard']) {
        let recentQuestions = [];
        for (let round = 0; round < 4; round++) {
            const response = await fetch(`${base}/api/quiz?difficulty=${difficulty}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recentQuestions })
            });
            assert.equal(response.status, 200);
            assert.equal(response.headers.get('X-Quiz-Source'), 'practice');
            const items = await response.json();
            assert.equal(items.length, 3);
            const batch = items.map(item => item.question);
            assert.equal(new Set(batch).size, 3);
            for (const item of items) {
                assert.equal(new Set(item.options).size, 4);
                assert.ok(item.options.includes(item.correctAnswer));
                assert.ok(!recentQuestions.slice(-3).includes(item.question), 'repeated the previous round');
                if (round < 3) {
                    assert.ok(!allQuestions.has(item.question), 'repeated a question before using the full pool');
                    allQuestions.add(item.question);
                }
            }
            recentQuestions = [
                ...recentQuestions.filter(question => !batch.includes(question)),
                ...batch
            ].slice(-9);
        }
    }
    assert.equal(allQuestions.size, 27);
});
