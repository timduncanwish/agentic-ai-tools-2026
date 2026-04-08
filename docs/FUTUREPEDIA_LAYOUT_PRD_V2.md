# Futurepedia Layout PRD V2

## 1. Product Context

Current project capabilities are centered on:

- tool discovery
- editorial collections
- shortlist/save actions
- newsletter capture
- tool submission and local admin review

The five reference screens shift the homepage from a pure "directory-first" experience into a layered discovery product with:

- a strong hero and trust layer
- tabbed home feeds
- category-led exploration
- course discovery
- creator/channel spotlight modules

The user asked to reorganize the product architecture and PRD around that layout, while keeping the project's existing visual style rather than cloning Futurepedia's UI.

## 2. Product Goal

Build `Agentic AI Tools` into a multi-surface discovery platform where users can:

- discover AI tools, courses, and creator channels from one homepage
- switch between popular, newly added, and course-focused feeds
- explore by category without leaving the discovery loop
- move from broad discovery to detail, save, and revisit actions

## 3. Reference Screen Decomposition

### Screen 1: Hero

Signals:

- top navigation with multiple content surfaces
- large value proposition
- dual CTA
- trust logos / social proof

Implication for this project:

- homepage must open with a broad discovery promise, not a filter grid
- top nav must expose `Tools`, `Courses`, `Categories`, `Creators`, `Newsletter`
- hero needs primary CTA to directory and secondary CTA to courses

### Screen 2: Popular Tools Tab

Signals:

- left-side category rail
- center feed of tool cards
- ranking/engagement counts
- "popular" as a home feed mode

Implication:

- homepage needs a tabbed content feed
- tool cards need ranking metadata and lightweight engagement fields
- categories should be usable both as a rail and as chips

### Screen 3: Recently Added Tab

Signals:

- same card system, different sort mode
- freshness is a first-class browse pattern

Implication:

- data model needs `listedAt` and `updatedAt`
- API must support `popular`, `new`, and `featured` feed modes

### Screen 4: Popular Courses Tab

Signals:

- courses are a separate discovery object, not just a tag on tools
- course cards need title, summary, category tags, media thumbnail, CTA

Implication:

- add `courses` as a new core content type
- homepage feed tabs must support mixed content surfaces without changing shell layout

### Screen 5: Trending Categories + Creator/Channel Spotlight

Signals:

- category chips as editorial discovery shortcut
- creator/channel block with profile, metrics, and featured media

Implication:

- add `creator channels` as a new content type
- homepage needs an editorial spotlight section after the feed
- categories are not only taxonomy; they are also marketing entry points

## 4. Product Principles

- Keep the site's own brand language and styling tokens.
- Reuse one layout system across tools, courses, and creators.
- Make homepage discovery modular and feed-driven.
- Separate taxonomy data from editorial ranking data.
- Keep all home sections data-driven from APIs or local JSON.
- Do not collapse all objects into the tool schema.

## 5. Target User Groups

### Builder / Developer

- wants popular tools, newly launched tools, coding-related categories

### Operator / Marketer

- wants workflow, growth, automation, research, and course content

### Creator / Founder

- wants creators to follow, practical courses, media tools, and inspiration

## 6. North Star

Primary metric:

- weekly engaged discovery sessions

Supporting metrics:

- homepage tab click-through rate
- category entry click-through rate
- tool save rate
- course outbound CTR
- creator/channel outbound CTR
- newsletter signup conversion

## 7. Scope

### V1 In Scope

- redesigned homepage information architecture
- multi-tab home feed
- tools content type
- courses content type
- creators/channels content type
- trending category module
- current save/shortlist capability for tools
- newsletter capture
- submit-tool flow
- local admin support for tools first, with content model ready for courses/creators

### V1.1 In Scope

- dedicated courses landing page
- dedicated creators landing page
- category landing pages
- admin CRUD for courses and creators

### Out of Scope

- full user login system
- paid subscription flows
- comments/community
- creator verification workflow
- external scraping pipeline

## 8. New Information Architecture

### Global Navigation

- Home
- AI Tools
- AI Courses
- Categories
- Creators
- Newsletter
- Submit Tool

### Homepage Section Order

1. Hero
2. Trust / social proof strip
3. Tabbed discovery feed
4. Trending categories
5. Creator spotlight
6. Editorial collections
7. Shortlist / saved tools
8. Newsletter
9. Submission CTA

### Home Feed Tabs

- Popular Tools
- Recently Added
- Popular Courses

### Core Page Map

- `/`
  home with tabbed discovery
- `/tools-directory.html`
  searchable and filterable tools directory
- `/courses.html`
  course listing page
- `/creators.html`
  creator/channel listing page
- `/category/:slug`
  category landing page
- `/tool/:slug` or existing article/review URL
  tool detail / review destination
- `/submit-tool.html`
  supply-side submission flow
- `/admin.html`
  local editorial admin

## 9. Domain Model

### Tool

Required fields:

- slug
- name
- category
- categoryLabel
- subcategory
- description
- editorialNote
- pricingModel
- pricingLabel
- rating
- trendingScore
- listedAt
- updatedAt
- verified
- featured
- sponsored
- saveCount
- voteCount
- tags
- useCases
- websiteUrl
- reviewUrl
- logoUrl

### Course

Required fields:

- slug
- title
- provider
- instructor
- summary
- category
- tags
- level
- thumbnailUrl
- previewUrl
- landingUrl
- popularityScore
- listedAt
- updatedAt
- featured

### Creator Channel

Required fields:

- slug
- name
- roleLabel
- bio
- categoryFocus
- avatarUrl
- channelUrl
- platform
- subscriberCount
- monthlyViews
- courseCount
- featuredVideos
- featured

### Category

Required fields:

- slug
- label
- shortDescription
- heroCopy
- icon
- ranking
- relatedToolSlugs
- relatedCourseSlugs
- relatedCreatorSlugs

## 10. Functional Requirements

### 10.1 Homepage

- hero must support primary and secondary CTA
- trust strip must support configurable logos or proof stats
- tab switch must update feed content without full page reload
- popular tools tab shows ranked tool cards
- recently added tab sorts by `listedAt`
- popular courses tab shows course cards
- trending categories block shows editorial category chips
- creator spotlight block shows one featured creator plus related media cards
- shortlist block reuses existing saved-tools logic

### 10.2 Tools Discovery

- keep current filter/search/sort behavior
- add support for ranking fields used by homepage cards
- expose `listedAt` for new arrivals feed

### 10.3 Courses Discovery

- course cards must support thumbnail, summary, tags, CTA
- home tab uses top `popularityScore`
- dedicated courses page is paginated or grouped by category

### 10.4 Creators Discovery

- creator spotlight shows profile, metrics, CTA, featured media
- dedicated creators page shows creator cards and filters by category focus

### 10.5 Categories

- categories must drive both taxonomy and editorial navigation
- category landing pages should be able to aggregate tools, courses, and creators

### 10.6 Admin

- V1 admin continues to manage tools
- architecture must allow adding courses and creators CRUD next

## 11. API Requirements

### Existing APIs to Keep

- `GET /api/health`
- `GET /api/home`
- `GET /api/categories`
- `GET /api/tools`
- `GET /api/tools/:slug`
- `GET /api/favorites`
- `POST /api/favorites/toggle`
- `POST /api/newsletter`
- `POST /api/submissions`

### New APIs Needed

- `GET /api/home-feed?tab=popular-tools|recent-tools|popular-courses`
- `GET /api/courses`
- `GET /api/courses/:slug`
- `GET /api/creators`
- `GET /api/creators/:slug`
- `GET /api/categories/:slug`
- `GET /api/home/spotlights`

### `GET /api/home` Target Payload

Should return:

- hero content
- trust strip items
- feed tab summary
- trending categories
- creator spotlight
- editorial collections
- saved tools summary

## 12. Content Strategy

- Tools remain the core monetizable discovery object.
- Courses increase session depth and repeat visits.
- Creators add personality, trust, and community adjacency.
- Categories become reusable landing surfaces for SEO and navigation.

## 13. Monetization Alignment

- sponsored tool slots in popular feed
- sponsored category modules
- affiliate CTAs on tool detail/review pages
- course referral links
- newsletter sponsorship later

## 14. Non-Functional Requirements

- keep current lightweight stack and simple local run flow
- preserve mobile usability
- support data-driven home sections without hardcoding lists in HTML
- allow gradual migration from current files without full rewrite

## 15. Delivery Plan

### Phase 1

- rewrite IA
- expand data model
- split homepage into modular sections
- introduce courses and creators JSON datasets

### Phase 2

- add dedicated pages for courses and creators
- add category landing pages
- extend admin

### Phase 3

- richer analytics
- sponsored placements
- user accounts if needed

## 16. Acceptance Criteria

- homepage clearly reflects the five-reference layout logic while using the project's own style
- the app supports three top-level discovery surfaces: tools, courses, creators
- categories can aggregate multiple content types
- current tool directory flow remains usable
- architecture supports adding new content objects without further monolith growth in `server.js`
