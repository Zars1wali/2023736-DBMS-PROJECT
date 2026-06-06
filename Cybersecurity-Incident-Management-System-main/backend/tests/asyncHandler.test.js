const test = require('node:test');
const assert = require('node:assert/strict');

const asyncHandler = require('../src/utils/asyncHandler');

function mockNext() {
  const calls = [];
  const fn = (error) => calls.push(error);
  fn.calls = calls;
  return fn;
}

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

test('asyncHandler passes req, res, next to the handler', async () => {
  const req = {};
  const res = mockRes();
  const next = mockNext();

  const handler = asyncHandler(async (r, s, n) => {
    s.status(200).json({ ok: true });
    n(undefined);
  });

  await handler(req, res, next);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
});

test('asyncHandler calls next with error when the handler throws', async () => {
  const req = {};
  const res = mockRes();
  const next = mockNext();

  const handler = asyncHandler(async () => {
    throw new Error('Something broke');
  });

  await handler(req, res, next);
  assert.equal(next.calls.length, 1);
  assert.ok(next.calls[0] instanceof Error);
  assert.equal(next.calls[0].message, 'Something broke');
});

test('asyncHandler calls next with error for synchronous throws', async () => {
  const req = {};
  const res = mockRes();
  const next = mockNext();

  const handler = asyncHandler(() => {
    throw new Error('Sync error');
  });

  await handler(req, res, next);
  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0].message, 'Sync error');
});
