const fs = require('fs');
const paths = require('../config/paths');
const { createSubmissionId, readJson, writeJson } = require('../utils/common');

function getState() {
  if (!fs.existsSync(paths.STATE_FILE)) {
    return {
      favoritesByClientId: {},
      newsletterLeads: [],
      submissions: []
    };
  }

  const state = readJson(paths.STATE_FILE);
  state.favoritesByClientId = state.favoritesByClientId || {};
  state.newsletterLeads = state.newsletterLeads || [];
  state.submissions = (state.submissions || []).map((submission) => ({
    id: submission.id || createSubmissionId(),
    status: submission.status || 'pending',
    createdAt: submission.createdAt || new Date().toISOString(),
    ...submission
  }));
  return state;
}

function saveState(state) {
  writeJson(paths.STATE_FILE, state);
}

module.exports = {
  getState,
  saveState
};
