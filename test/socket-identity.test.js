const assert = require('node:assert');
const http = require('node:http');
const test = require('node:test');
const io = require('socket.io-client');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

function request(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const payload = body == null ? null : JSON.stringify(body);
    const url = new URL(path, base);
    const headers = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (cookie) {
      headers.Cookie = cookie;
    }
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
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
          cookie: cookiePair(setCookie) || cookie || ''
        });
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(method + ' ' + path + ' timed out'));
    });
    req.on('error', reject);
    if (payload) {
      req.end(payload);
    } else {
      req.end();
    }
  });
}

function cookiePair(setCookie) {
  if (!setCookie) {
    return '';
  }
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  return list.map((entry) => entry.split(';')[0]).join('; ');
}

function parseJson(raw, label) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(label + ' was not json');
  }
}

function idOf(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value._id || value);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
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

async function login() {
  const result = await request('POST', '/login', {
    email: 'testuser1@example.com',
    password: 'secret123'
  });
  assert.equal(result.status, 200);
  const body = parseJson(result.raw, 'login');
  assert.ok(body._id, 'login did not return an id');
  assert.ok(result.cookie.indexOf('testCookie=') === 0, 'login did not set testCookie');
  return { id: String(body._id), cookie: result.cookie };
}

async function otherUserId(selfId) {
  const result = await request('GET', '/messages');
  assert.equal(result.status, 200);
  const messages = parseJson(result.raw, 'messages');
  const found = messages.find((message) => idOf(message.user) && idOf(message.user) !== selfId);
  assert.ok(found, 'need another user id from public messages');
  return idOf(found.user);
}

async function messagesContaining(text) {
  const result = await request('GET', '/messages');
  assert.equal(result.status, 200);
  const messages = parseJson(result.raw, 'messages');
  return messages.filter((message) => message && message.text === text);
}

async function waitForMessage(text, ms) {
  const start = Date.now();
  let found = [];
  while (Date.now() - start < ms) {
    found = await messagesContaining(text);
    if (found.length > 0) {
      return found;
    }
    await delay(200);
  }
  return found;
}

async function profile(id) {
  const result = await request('GET', '/profile?id=' + encodeURIComponent(id));
  assert.equal(result.status, 200);
  return parseJson(result.raw, 'profile');
}

function sentBetween(user, fromId, toId) {
  return (user.solicitudes || []).filter((solicitude) => {
    return solicitude &&
      solicitude.status === 'Sent' &&
      idOf(solicitude.from) === fromId &&
      idOf(solicitude.to) === toId;
  });
}

async function createSolicitude(fromId, toId) {
  const result = await request('POST', '/solicitude', {
    user: { _id: fromId },
    friend: { _id: toId }
  });
  assert.equal(result.status, 200);
  const body = parseJson(result.raw, 'solicitude');
  const created = sentBetween(body, fromId, toId);
  assert.ok(created.length > 0, 'solicitude was not created');
  return String(created[created.length - 1]._id);
}

test('anonymous socket cannot create a message as someone else', async () => {
  const sessionUser = await login();
  const spoofed = await otherUserId(sessionUser.id);
  const text = 'anon-message-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  const privateText = 'anon-private-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  const socket = await connect();
  try {
    socket.emit('addMessage', {
      room: 'general',
      user: spoofed,
      text
    });
    socket.emit('addMessagePrivated', {
      to: { id: 'spoofed-socket', user: { _id: sessionUser.id } },
      user: spoofed,
      text: privateText
    });
    const created = await waitForMessage(text, 1500);
    const createdPrivate = await waitForMessage(privateText, 400);
    assert.equal(created.length, 0);
    assert.equal(createdPrivate.length, 0);
  } finally {
    socket.close();
  }
});

test('anonymous socket cannot accept a friend request', async () => {
  const sessionUser = await login();
  const spoofed = await otherUserId(sessionUser.id);
  const solicitudeId = await createSolicitude(spoofed, sessionUser.id);
  const socket = await connect();
  try {
    socket.emit('acceptSolicitude', {
      id: solicitudeId,
      user: { _id: sessionUser.id },
      to: { _id: sessionUser.id }
    });
    await delay(1500);
  } finally {
    socket.close();
  }
  const after = await profile(sessionUser.id);
  const solicitude = (after.solicitudes || []).find((item) => String(item._id) === solicitudeId);
  assert.ok(solicitude, 'solicitude missing after anonymous accept');
  assert.equal(solicitude.status, 'Sent');
});

test('anonymous socket cannot send a friend request as someone else', async () => {
  const sessionUser = await login();
  const spoofed = await otherUserId(sessionUser.id);
  const before = await profile(spoofed);
  const beforeIds = (before.solicitudes || []).map((item) => String(item._id));
  const socket = await connect();
  try {
    socket.emit('addSolicitude', {
      user: { _id: spoofed },
      friend: { id: 'anon-target', user: { _id: sessionUser.id } }
    });
    await delay(1500);
  } finally {
    socket.close();
  }
  const after = await profile(spoofed);
  const afterIds = (after.solicitudes || []).map((item) => String(item._id));
  assert.deepEqual(afterIds, beforeIds);
});

test('logged-in socket sends a friend request as the session user, not the payload user', async () => {
  const sessionUser = await login();
  const spoofed = await otherUserId(sessionUser.id);
  const before = await profile(sessionUser.id);
  const beforeIds = (before.solicitudes || []).map((item) => String(item._id));
  const socket = await connect(sessionUser.cookie);
  try {
    socket.emit('addSolicitude', {
      user: { _id: spoofed },
      friend: { id: 'session-target', user: { _id: spoofed } }
    });
    await delay(1500);
  } finally {
    socket.close();
  }
  const after = await profile(sessionUser.id);
  const created = (after.solicitudes || []).filter((item) => beforeIds.indexOf(String(item._id)) === -1);
  assert.equal(created.length, 1);
  assert.equal(idOf(created[0].from), sessionUser.id);
  assert.equal(idOf(created[0].to), spoofed);
});

test('logged-in socket sends as the session user, not the payload user', async () => {
  const sessionUser = await login();
  const spoofed = await otherUserId(sessionUser.id);
  const text = 'session-message-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  const socket = await connect(sessionUser.cookie);
  try {
    socket.emit('addMessage', {
      room: 'general',
      user: spoofed,
      text
    });
    const created = await waitForMessage(text, 2000);
    assert.equal(created.length, 1);
    assert.equal(idOf(created[0].user), sessionUser.id);
  } finally {
    socket.close();
  }
});

test('logged-in socket sends a private message as the session user', async () => {
  const sessionUser = await login();
  const spoofed = await otherUserId(sessionUser.id);
  const text = 'session-private-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  const socket = await connect(sessionUser.cookie);
  try {
    socket.emit('addMessagePrivated', {
      to: { id: socket.id, user: { _id: spoofed } },
      user: spoofed,
      text
    });
    const created = await waitForMessage(text, 2000);
    assert.equal(created.length, 1);
    assert.equal(idOf(created[0].user), sessionUser.id);
    assert.equal(created[0].type, 'private');
  } finally {
    socket.close();
  }
});

test('logged-in recipient can still accept a friend request', async () => {
  const sessionUser = await login();
  const other = await otherUserId(sessionUser.id);
  const solicitudeId = await createSolicitude(other, sessionUser.id);
  const socket = await connect(sessionUser.cookie);
  try {
    socket.emit('acceptSolicitude', { id: solicitudeId });
    await delay(1500);
  } finally {
    socket.close();
  }
  const after = await profile(sessionUser.id);
  const solicitude = (after.solicitudes || []).find((item) => String(item._id) === solicitudeId);
  assert.ok(solicitude, 'solicitude missing after session accept');
  assert.equal(solicitude.status, 'Accept');
});
