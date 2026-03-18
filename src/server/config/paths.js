const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const STYLES_DIR = path.join(ROOT_DIR, 'styles');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');
const DATA_DIR = path.join(ROOT_DIR, 'data');

module.exports = {
  ROOT_DIR,
  DIST_DIR,
  STYLES_DIR,
  SCRIPTS_DIR,
  DATA_DIR,
  TOOLS_FILE: path.join(DATA_DIR, 'tools.json'),
  COURSES_FILE: path.join(DATA_DIR, 'courses.json'),
  CREATORS_FILE: path.join(DATA_DIR, 'creators.json'),
  CATEGORIES_FILE: path.join(DATA_DIR, 'categories.json'),
  HOME_CONFIG_FILE: path.join(DATA_DIR, 'home-config.json'),
  STATE_FILE: path.join(DATA_DIR, 'app-state.json')
};
