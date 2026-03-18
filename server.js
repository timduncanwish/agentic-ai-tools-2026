#!/usr/bin/env node

const { app, startServer } = require('./src/server/app');

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
