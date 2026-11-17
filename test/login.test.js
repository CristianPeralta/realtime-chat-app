const assert = require('node:assert');
const http = require('node:http');
const test = require('node:test');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

function postLogin(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL('/login', base);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 4000
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, raw });
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error('login request timed out'));
    });
    req.on('error', reject);
    req.end(payload);
  });
}

test('wrong password returns 401 and does not include password', async () => {
  const result = await postLogin({
    email: 'testuser1@example.com',
    password: 'not-the-password'
  });
  assert.equal(result.status, 401);
  assert.doesNotMatch(result.raw, /password/i);
});

test('unknown email returns 401', async () => {
  const result = await postLogin({
    email: 'nobody-issue4@example.com',
    password: 'secret123'
  });
  assert.equal(result.status, 401);
});

test('successful login JSON has no password field', async () => {
  const result = await postLogin({
    email: 'testuser1@example.com',
    password: 'secret123'
  });
  assert.equal(result.status, 200);
  const body = JSON.parse(result.raw);
  assert.equal(body.email, 'testuser1@example.com');
  assert.deepEqual(passwordPaths(body), []);
});

function passwordPaths(value, prefix, found) {
  found = found || [];
  prefix = prefix || '';
  if (Array.isArray(value)) {
    value.forEach((item, index) => passwordPaths(item, prefix + '[' + index + ']', found));
    return found;
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      const path = prefix ? prefix + '.' + key : key;
      if (key === 'password') {
        found.push(path);
      }
      passwordPaths(value[key], path, found);
    });
  }
  return found;
}
