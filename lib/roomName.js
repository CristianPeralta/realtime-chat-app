function parseRoomName(input) {
  if (typeof input !== 'string') {
    return { ok: false, error: 'Room names can only use letters, numbers, and spaces' };
  }
  var name = input.trim();
  if (name.length < 1 || name.length > 40) {
    return { ok: false, error: 'Room names must be 1 to 40 characters' };
  }
  if (!/^[\p{L}\p{N} ]+$/u.test(name)) {
    return { ok: false, error: 'Room names can only use letters, numbers, and spaces' };
  }
  var slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) {
    return { ok: false, error: 'Room names can only use letters, numbers, and spaces' };
  }
  return { ok: true, name: name, slug: slug };
}

module.exports = { parseRoomName: parseRoomName };
