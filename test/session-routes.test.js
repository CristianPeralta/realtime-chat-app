const assert = require('node:assert');
const http = require('node:http');
const test = require('node:test');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

function request(method, path, cookie) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: cookie ? { Cookie: cookie } : {},
      timeout: 4000
    }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('anonymous mutating routes are rejected', async () => {
  const routes = [
    ['POST', '/message'],
    ['POST', '/upload'],
    ['GET', '/message/delete'],
    ['GET', '/room/delete']
  ];
  for (const [method, path] of routes) {
    const result = await request(method, path);
    assert.equal(result.status, 401, method + ' ' + path);
  }
});

test('a session is not rejected for lack of session', async () => {
  const routes = require('../routes/index');
  const layer = routes.stack.find((entry) => entry.route && entry.route.path === '/message' && entry.route.methods.post);
  assert.ok(layer, 'POST /message route missing');
  const guard = layer.route.stack[0].handle;
  let reached = false;
  const req = { session: { user: { _id: 'present' } } };
  const res = { sendStatus: () => { throw new Error('session request was rejected'); } };
  guard(req, res, () => {
    reached = true;
  });
  assert.equal(reached, true);
});
