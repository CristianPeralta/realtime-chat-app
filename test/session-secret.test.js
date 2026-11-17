const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

function boot(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['app.js'], {
      cwd: path.join(__dirname, '..'),
      env: { PATH: process.env.PATH, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ code: null, stderr });
    }, 4000);
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ code, stderr });
    });
  });
}

test('refuses to boot when SESSION_SECRET is missing', async () => {
  const result = await boot({ SESSION_SECRET: '' });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /SESSION_SECRET is required/);
});

test('does not reject boot when SESSION_SECRET is set', async () => {
  const result = await boot({
    SESSION_SECRET: 'test-secret',
    MONGODB_CONNECTION_STRING: 'mongodb://127.0.0.1:1/none'
  });
  assert.doesNotMatch(result.stderr, /SESSION_SECRET is required/);
});
