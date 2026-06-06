const test = require('node:test');
const assert = require('node:assert/strict');

const { notFoundHandler, errorHandler } = require('../src/middleware/errorHandler');

function mockNext() {
  const calls = [];
  const fn = (error) => calls.push(error);
  fn.calls = calls;
  return fn;
}

function buildRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

// notFoundHandler
test('notFoundHandler calls next with a 404 error', () => {
  const next = mockNext();
  notFoundHandler({}, {}, next);
  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0].statusCode, 404);
  assert.ok(next.calls[0].message.toLowerCase().includes('not found'));
});

// errorHandler
test('errorHandler responds with the error statusCode and message', () => {
  const err = { statusCode: 422, message: 'Unprocessable Entity' };
  const res = buildRes();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.statusCode, 422);
  assert.equal(res.body.error, 'Unprocessable Entity');
});

test('errorHandler defaults to 500 when statusCode is not set', () => {
  const err = new Error('Something unexpected');
  const res = buildRes();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.statusCode, 500);
});

test('errorHandler uses default message when error message is absent', () => {
  const err = { statusCode: 503 };
  const res = buildRes();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.body.error, 'Internal server error');
});
