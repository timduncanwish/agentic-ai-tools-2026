# Project Architecture Reorganization

## 1. Why Reorganize

Current implementation works as an MVP, but the codebase is now carrying three different concerns in one place:

- API logic in `server.js`
- homepage and page behavior in `scripts/futurepedia-app.js`
- content storage mixed into `data/*.json`

That structure was acceptable for a tool-directory MVP. It becomes fragile once the product expands into:

- tabbed home feeds
- tools + courses + creators as separate content models
- category aggregation pages
- richer editorial homepage sections

## 2. Current State

### Current Backend Shape

- `server.js`
  monolithic Express app, route definitions, data access, validation, sorting, business logic
- `data/tools.json`
  only one primary catalog
- `data/app-state.json`
  favorites, newsletter leads, submissions

### Current Frontend Shape

- `dist/*.html`
  page shells
- `scripts/futurepedia-app.js`
  all client behavior in one file
- `styles/futurepedia-redesign.css`
  single large stylesheet for homepage and discovery pages

## 3. Target Architecture

The target is still lightweight and file-based, but with clear module boundaries.

```text
E:\agentic-ai-tools-2026\
  src\
    server\
      app.js
      config\
        paths.js
      routes\
        health.routes.js
        home.routes.js
        tools.routes.js
        courses.routes.js
        creators.routes.js
        categories.routes.js
        favorites.routes.js
        newsletter.routes.js
        submissions.routes.js
        admin.routes.js
      services\
        home.service.js
        tools.service.js
        courses.service.js
        creators.service.js
        categories.service.js
        favorites.service.js
        submissions.service.js
      repositories\
        json\
          tools.repository.js
          courses.repository.js
          creators.repository.js
          categories.repository.js
          state.repository.js
      domain\
        tool.model.js
        course.model.js
        creator.model.js
        category.model.js
      utils\
        slugify.js
        validate.js
        dates.js
    client\
      pages\
        home\
          home.html
          home.js
        tools\
          tools-directory.html
          tools-directory.js
        courses\
          courses.html
          courses.js
        creators\
          creators.html
          creators.js
        submit\
          submit-tool.html
          submit-tool.js
        admin\
          admin.html
          admin.js
      components\
        hero\
        feed-tabs\
        tool-card\
        course-card\
        creator-spotlight\
        category-chip-grid\
        newsletter\
        shortlist\
      services\
        api-client.js
      state\
        client-id.js
        favorites-store.js
      styles\
        tokens.css
        layout.css
        cards.css
        home.css
        directory.css
        admin.css
  content\
    tools\
      tools.json
    courses\
      courses.json
    creators\
      creators.json
    categories\
      categories.json
    home\
      home-config.json
  data\
    state\
      app-state.json
  dist\
  scripts\
```

## 4. Architectural Boundaries

### 4.1 Routes Layer

Responsibility:

- parse request
- validate required params
- call service
- return JSON / status code

Must not:

- embed sorting logic
- read JSON directly
- construct editorial homepage payload inline

### 4.2 Services Layer

Responsibility:

- business rules
- list composition
- feed tab assembly
- aggregation across tools, courses, creators, and categories

Examples:

- `home.service.js`
  builds hero, trust strip, feed tab content, category chips, creator spotlight
- `tools.service.js`
  filters and sorts tools
- `categories.service.js`
  resolves multi-content category landing pages

### 4.3 Repositories Layer

Responsibility:

- load and persist JSON files
- provide stable read/write functions

Why:

- today `server.js` knows every file path and write shape
- after reorg, only repositories should know storage details

### 4.4 Client Page Layer

Responsibility:

- page bootstrap only
- ask components/services to render

Current issue:

- `scripts/futurepedia-app.js` handles home, directory, submit, admin all together

Target:

- one entry file per page
- shared helpers in `client/services` and `client/state`

### 4.5 Component Layer

Responsibility:

- render one section or card type
- own its DOM wiring

Examples:

- `feed-tabs`
- `tool-card`
- `course-card`
- `creator-spotlight`

## 5. Data Model Split

### Move From

- `data/tools.json`
- `data/app-state.json`

### Move To

- `content/tools/tools.json`
- `content/courses/courses.json`
- `content/creators/creators.json`
- `content/categories/categories.json`
- `content/home/home-config.json`
- `data/state/app-state.json`

Reason:

- content catalog and user/app state should not live in the same conceptual layer

## 6. Frontend Reorganization

### Current Problem

- page logic is coupled
- new home modules will grow one JS file and one CSS file too quickly

### Target Split

`scripts/futurepedia-app.js` should be decomposed into:

- API client
- favorites state
- home bootstrap
- tools bootstrap
- submit bootstrap
- admin bootstrap
- reusable card renderers

`styles/futurepedia-redesign.css` should be decomposed into:

- design tokens
- shell/navigation
- card system
- feed tabs
- category modules
- creator spotlight section

## 7. Incremental Migration Plan

### Step 1: Extract Without Breaking Runtime

- keep `server.js` as entrypoint
- move helpers into `src/server/*`
- keep exports compatible

### Step 2: Split Client by Page

- keep current HTML files
- replace one monolithic JS file with page entry files

### Step 3: Introduce New Content Types

- add `courses.json`
- add `creators.json`
- add `categories.json`
- add `home-config.json`

### Step 4: Expand Home API

- build `GET /api/home` from config + services
- add `GET /api/courses`
- add `GET /api/creators`

### Step 5: Build New Pages

- `/courses.html`
- `/creators.html`
- category landing page support

## 8. Mapping From Current Files

### Backend

- `server.js`
  split into `src/server/app.js`, `routes/*`, `services/*`, `repositories/*`

### Frontend

- `scripts/futurepedia-app.js`
  split into `client/pages/*`, `client/components/*`, `client/services/api-client.js`

- `styles/futurepedia-redesign.css`
  split into `client/styles/*`

### Data

- `data/tools.json`
  becomes `content/tools/tools.json`

- `data/app-state.json`
  becomes `data/state/app-state.json`

## 9. API Surface After Reorganization

### Stable Existing Endpoints

- `/api/home`
- `/api/categories`
- `/api/tools`
- `/api/tools/:slug`
- `/api/favorites`
- `/api/favorites/toggle`
- `/api/newsletter`
- `/api/submissions`

### New Endpoints

- `/api/courses`
- `/api/courses/:slug`
- `/api/creators`
- `/api/creators/:slug`
- `/api/categories/:slug`
- `/api/home-feed`

## 10. Risks

- if tools, courses, and creators share one schema, homepage complexity will explode
- if `server.js` keeps owning all business logic, every new section will increase regression risk
- if home sections stay hardcoded in HTML, editorial updates will be slow

## 11. Recommended Next Implementation Order

1. Extract backend helpers from `server.js`.
2. Split `futurepedia-app.js` by page.
3. Add course and creator datasets.
4. Rebuild homepage sections around feed tabs and spotlight modules.
5. Add dedicated courses and creators pages.

## 12. Definition of Done

- backend no longer relies on one monolithic route file for all product logic
- homepage sections are driven by structured content and service composition
- tools, courses, creators, and categories have distinct repositories and models
- frontend page logic is split by page and shared components
- new homepage layout can be implemented without further expanding the current monolith
