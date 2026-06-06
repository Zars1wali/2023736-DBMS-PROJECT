const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransitionStatus } = require('../src/utils/incidentWorkflow');

test('incident status workflow allows only forward transitions', () => {
  assert.equal(canTransitionStatus('Open', 'In Progress'), true);
  assert.equal(canTransitionStatus('In Progress', 'Resolved'), true);
  assert.equal(canTransitionStatus('Resolved', 'Closed'), true);

  assert.equal(canTransitionStatus('Open', 'Closed'), false);
  assert.equal(canTransitionStatus('Resolved', 'Open'), false);
  assert.equal(canTransitionStatus('Closed', 'Open'), false);
});
