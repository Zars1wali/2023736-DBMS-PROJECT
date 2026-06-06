const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../src/utils/ApiError');

test('ApiError is an instance of Error', () => {
  const err = new ApiError(400, 'Bad Request');
  assert.ok(err instanceof Error);
  assert.ok(err instanceof ApiError);
});

test('ApiError stores statusCode', () => {
  const err = new ApiError(404, 'Not Found');
  assert.equal(err.statusCode, 404);
});

test('ApiError stores message', () => {
  const err = new ApiError(500, 'Internal Server Error');
  assert.equal(err.message, 'Internal Server Error');
});

test('ApiError works for 400 Bad Request', () => {
  const err = new ApiError(400, 'Missing required fields');
  assert.equal(err.statusCode, 400);
  assert.equal(err.message, 'Missing required fields');
});

test('ApiError works for 401 Unauthorized', () => {
  const err = new ApiError(401, 'Unauthorized');
  assert.equal(err.statusCode, 401);
});

test('ApiError works for 403 Forbidden', () => {
  const err = new ApiError(403, 'Insufficient permissions');
  assert.equal(err.statusCode, 403);
});
