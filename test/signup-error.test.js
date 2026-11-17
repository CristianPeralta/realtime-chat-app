const assert = require('node:assert');
const test = require('node:test');
const { signupFailure } = require('../lib/signupError');

test('a duplicate username or email is a 409, not a 503', function () {
  const result = signupFailure({ code: 11000 });
  assert.equal(result.status, 409);
  assert.match(result.body.error, /already registered/);
});

test('any other signup failure stays a 503', function () {
  assert.equal(signupFailure(new Error('db down')).status, 503);
});
