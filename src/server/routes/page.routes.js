const express = require('express');
const path = require('path');
const { DIST_DIR } = require('../config/paths');

const router = express.Router();

router.get('/', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

router.get('/tools-directory.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'tools-directory.html'));
});

router.get('/category.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'category.html'));
});

router.get('/courses.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'courses.html'));
});

router.get('/creators.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'creators.html'));
});

router.get('/submit-tool.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'submit-tool.html'));
});

router.get('/admin.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'admin.html'));
});

module.exports = router;
