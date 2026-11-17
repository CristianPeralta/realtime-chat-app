const assert = require('node:assert');
const http = require('node:http');
const test = require('node:test');
const io = require('socket.io-client');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body == null ? null : JSON.stringify(body);
    const headers = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers,
      timeout: 4000
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        resolve({
          status: res.statusCode,
          raw,
          cookie: setCookie ? setCookie[0].split(';')[0] : ''
        });
      });
    });
    req.on('error', reject);
    req.end(payload);
  });
}

function connect(cookie) {
  return new Promise((resolve, reject) => {
    const socket = io(base, {
      transports: ['polling'],
      extraHeaders: cookie ? { Cookie: cookie } : {},
      reconnection: false,
      timeout: 4000
    });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('socket connect timed out'));
    }, 4000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      socket.close();
      reject(err instanceof Error ? err : new Error('socket connect failed'));
    });
  });
}

test('a private message reaches the recipient session even if the socket id is stale', async () => {
  const login = await request('POST', '/login', {
    email: 'testuser1@example.com',
    password: 'secret123'
  });
  assert.equal(login.status, 200);
  const me = JSON.parse(login.raw);
  const text = 'dm-live-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  const sender = await connect(login.cookie);
  const recipient = await connect(login.cookie);
  const outsider = await connect();
  const gotRecipient = [];
  const gotOutsider = [];
  recipient.on('addMessagePrivated', (payload) => {
    if (payload && payload.data && payload.data.text === text) {
      gotRecipient.push(payload);
    }
  });
  outsider.on('addMessagePrivated', (payload) => {
    if (payload && payload.data && payload.data.text === text) {
      gotOutsider.push(payload);
    }
  });
  outsider.emit('userConnected', {
    room: 'room-not-the-dm-' + Date.now(),
    user: { _id: 'outsider', friends: [] }
  });
  try {
    await new Promise((resolve) => setTimeout(resolve, 300));
    sender.emit('addMessagePrivated', {
      to: { id: 'stale-socket-id', user: { _id: me._id } },
      user: 'someone-else',
      text
    });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    assert.equal(gotRecipient.length, 1);
    assert.equal(gotOutsider.length, 0);
  } finally {
    sender.close();
    recipient.close();
    outsider.close();
  }
});
