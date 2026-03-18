const express = require('express');
const discoveryService = require('../services/discovery.service');
const operationsService = require('../services/operations.service');

const router = express.Router();

router.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    date: new Date().toISOString()
  });
});

router.get('/api/home', (req, res) => {
  const clientId = discoveryService.normalizeClientId(req.query.clientId);
  res.json(discoveryService.getHomePayload(clientId));
});

router.get('/api/home-feed', (req, res) => {
  const tab = String(req.query.tab || 'popular-tools');
  res.json({
    tab,
    ...discoveryService.getHomeFeedItems(tab)
  });
});

router.get('/api/categories', (_req, res) => {
  res.json(discoveryService.getCategoryOptions());
});

router.get('/api/categories/:slug', (req, res) => {
  const category = discoveryService.getCategoryBySlug(req.params.slug);

  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  res.json(category);
});

router.get('/api/tools', (req, res) => {
  res.json(discoveryService.listTools(req.query));
});

router.get('/api/tools/:slug', (req, res) => {
  const tool = discoveryService.getToolBySlug(req.params.slug);

  if (!tool) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }

  res.json(tool);
});

router.get('/api/courses', (req, res) => {
  res.json(discoveryService.listCourses(req.query));
});

router.get('/api/courses/:slug', (req, res) => {
  const course = discoveryService.getCourseBySlug(req.params.slug);

  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }

  res.json(course);
});

router.get('/api/creators', (req, res) => {
  res.json(discoveryService.listCreators(req.query));
});

router.get('/api/creators/:slug', (req, res) => {
  const creator = discoveryService.getCreatorBySlug(req.params.slug);

  if (!creator) {
    res.status(404).json({ error: 'Creator not found' });
    return;
  }

  res.json(creator);
});

router.get('/api/favorites', (req, res) => {
  const payload = discoveryService.getFavorites(req.query.clientId);
  if (payload.error) {
    res.status(400).json({ error: payload.error });
    return;
  }

  res.json(payload);
});

router.post('/api/favorites/toggle', (req, res) => {
  const result = operationsService.toggleFavorite(req.body.clientId, req.body.slug);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.json(result);
});

router.post('/api/newsletter', (req, res) => {
  const result = operationsService.subscribeNewsletter(req.body);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.json(result);
});

router.post('/api/submissions', (req, res) => {
  const result = operationsService.createSubmission(req.body);
  if (result.error) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(result.status || 201).json(result);
});

module.exports = router;
