const test = require('node:test');
const assert = require('node:assert/strict');

const { requireFields, validateEnum } = require('../src/middleware/validate');
const ApiError = require('../src/utils/ApiError');

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error));
  });
}

// requireFields()
test('requireFields passes when all required fields are present', async () => {
  const middleware = requireFields(['title', 'severity']);
  const req = { body: { title: 'Test', severity: 'High' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error, undefined);
});

test('requireFields fails when a field is missing from body', async () => {
  const middleware = requireFields(['title', 'severity']);
  const req = { body: { title: 'Test' } };
  const error = await runMiddleware(middleware, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 400);
  assert.ok(error.message.includes('severity'));
});

test('requireFields fails when field value is null', async () => {
  const middleware = requireFields(['title']);
  const req = { body: { title: null } };
  const error = await runMiddleware(middleware, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 400);
});

test('requireFields fails when body is empty', async () => {
  const middleware = requireFields(['title', 'type']);
  const req = { body: {} };
  const error = await runMiddleware(middleware, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 400);
  assert.ok(error.message.includes('title'));
  assert.ok(error.message.includes('type'));
});

test('requireFields accepts falsy but defined values like 0 and empty string', async () => {
  const middleware = requireFields(['count']);
  const req = { body: { count: 0 } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error, undefined);
});

// validateEnum()
test('validateEnum passes when field value is in allowed list', async () => {
  const middleware = validateEnum('severity', ['Low', 'Medium', 'High', 'Critical']);
  const req = { body: { severity: 'High' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error, undefined);
});

test('validateEnum passes when field is absent (optional validation)', async () => {
  const middleware = validateEnum('severity', ['Low', 'Medium', 'High', 'Critical']);
  const req = { body: {} };
  const error = await runMiddleware(middleware, req);
  assert.equal(error, undefined);
});

test('validateEnum fails when field value is not in allowed list', async () => {
  const middleware = validateEnum('severity', ['Low', 'Medium', 'High', 'Critical']);
  const req = { body: { severity: 'SuperCritical' } };
  const error = await runMiddleware(middleware, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 400);
  assert.ok(error.message.includes('severity'));
});

test('validateEnum fails for case-mismatched values', async () => {
  const middleware = validateEnum('status', ['Open', 'Closed']);
  const req = { body: { status: 'open' } };
  const error = await runMiddleware(middleware, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 400);
});
