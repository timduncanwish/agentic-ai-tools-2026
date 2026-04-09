const express = require('express');
const operationsService = require('../services/operations.service');
const { requireAdminKey } = require('../middleware/admin-auth');

const router = express.Router();

router.use(requireAdminKey);

router.get('/api/admin/overview', (_req, res) => {
  res.json(operationsService.getAdminOverview());
});

router.post('/api/admin/submissions/:id/approve', (req, res) => {
  const result = operationsService.approveSubmission(req.params.id, req.body);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.json(result);
});

router.post('/api/admin/submissions/:id/reject', (req, res) => {
  const result = operationsService.rejectSubmission(req.params.id, req.body.reason);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.json(result);
});

router.post('/api/admin/tools', (req, res) => {
  const result = operationsService.createTool(req.body);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(result.status || 201).json(result);
});

router.patch('/api/admin/tools/:slug', (req, res) => {
  const result = operationsService.updateTool(req.params.slug, req.body);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.json(result);
});

module.exports = router;
