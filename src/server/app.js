const express = require('express');
const { DIST_DIR, SCRIPTS_DIR, STYLES_DIR } = require('./config/paths');
const { getDb, migrateFromJson } = require('./services/db.service');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');
const pageRoutes = require('./routes/page.routes');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/styles', express.static(STYLES_DIR));
app.use('/scripts', express.static(SCRIPTS_DIR));
app.use(express.static(DIST_DIR));

app.use(publicRoutes);
app.use(adminRoutes);
app.use(pageRoutes);

function startServer(port = PORT) {
  // Initialize database and migrate JSON data
  getDb();
  const migration = migrateFromJson();
  if (!migration.skipped) {
    console.log(`Database migrated: ${migration.toolsMigrated} tools, ${migration.categoriesMigrated} categories, ${migration.coursesMigrated} courses, ${migration.creatorsMigrated} creators`);
  }

  return app.listen(port, () => {
    console.log(`Agentic AI Tools server running at http://localhost:${port}`);
  });
}

module.exports = {
  app,
  startServer
};
