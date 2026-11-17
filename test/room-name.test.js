const assert = require('node:assert');
const test = require('node:test');
const { parseRoomName } = require('../lib/roomName');

test('symbols are rejected and do not become an empty slug', function () {
  const result = parseRoomName('!@#$%^&*');
  assert.equal(result.ok, false);
  assert.equal(result.slug, undefined);
});

test('accents are kept in the name and removed in the slug', function () {
  const result = parseRoomName('  qa-ñandú-acción  ');
  assert.equal(result.ok, false);
});

test('letters, numbers, and spaces are accepted', function () {
  const result = parseRoomName('  qa ñandú acción  ');
  assert.equal(result.ok, true);
  assert.equal(result.name, 'qa ñandú acción');
  assert.equal(result.slug, 'qa-nandu-accion');
});

test('names longer than 40 characters are rejected', function () {
  const result = parseRoomName('a'.repeat(41));
  assert.equal(result.ok, false);
});
