const allowedTransitions = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed'],
  Closed: []
};

function canTransitionStatus(from, to) {
  return Boolean(allowedTransitions[from]?.includes(to));
}

module.exports = {
  allowedTransitions,
  canTransitionStatus
};
