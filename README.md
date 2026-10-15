# Everstrat Docs

This repository contains the public documentation site for Everstrat.

The application lives at the root of [`everstrat-xyz/docs`](https://github.com/everstrat-xyz/docs).
It was extracted from `frontend-app/everstrat-docs` in
`Guide-DAO-Organization/hackerhouse` (private; repository access required)
with its Git history. The application and landing page now live in standalone
`everstrat-xyz/app` and `everstrat-xyz/website` repositories.

It is built with Fumadocs on top of Next.js App Router and is intended to document the real state of the project across protocol contracts, the web3 client, operational flows, and supporting architecture artifacts.

## What This App Does

The docs application is responsible for:

- serving the documentation site from the root route `/`
- rendering MDX content from `content/docs`
- exposing full-text search through `app/api/search/route.ts`
- generating `llms.txt` and `llms-full.txt`
- generating documentation-specific metadata, JSON-LD, OG/Twitter assets, sitemap, robots, and manifest data

## Tech Stack

- Next.js 16
- React 19
- Fumadocs Core
- Fumadocs UI
- Fumadocs MDX collections
- Tailwind CSS 4
- Biome
- TypeScript 7

## Project Structure

```text
docs/
├── app/
│   ├── (docs)/[[...slug]]/page.tsx   # Root-routed documentation pages
│   ├── (docs)/layout.tsx             # Docs layout and shared UI shell
│   ├── api/search/route.ts           # Search endpoint
│   ├── docs/[[...slug]]/page.tsx     # Legacy redirect from /docs/* to /*
│   ├── llms.txt/route.ts             # LLM-friendly text index
│   ├── llms-full.txt/route.ts        # Full LLM export
│   ├── layout.tsx                    # Root HTML shell and metadata
│   ├── global.css                    # Docs theme styling
│   ├── manifest.ts                   # App metadata manifest
│   ├── opengraph-image.tsx           # Default social preview image
│   ├── twitter-image.tsx             # Twitter/X social preview image
│   ├── robots.ts                     # Crawl directives
│   └── sitemap.ts                    # XML sitemap
├── components/
│   ├── markdown.tsx                  # MDX rendering helpers
│   └── ui/                           # Shared UI helpers
├── content/docs/                     # MDX source content
├── lib/
│   ├── config.ts                     # Typed site, route, repo, and SEO config
│   ├── layout.shared.tsx             # Shared layout options
│   ├── metadata.ts                   # Metadata and sitemap helpers
│   ├── structured-data.tsx           # JSON-LD helpers
│   ├── social-image.tsx              # Shared OG/Twitter image component
│   └── source.ts                     # Fumadocs content loader and page access helpers
├── public/                           # Favicons and app icons
├── source.config.ts                  # Fumadocs MDX collection config
├── package.json
└── README.md
```

## Routing Model

The docs site is root-routed.

- `/` renders the docs home page
- `/<slug>` renders additional docs pages
- `/docs/*` is kept only as a legacy redirect path

Introduction precedes Get Started in the shared desktop/mobile page tree. Product basics live
in Introduction, short first-use guides in Get Started, detailed app guidance in Using Everstrat,
and formulas and queue mechanics in How Everstrat Works. Developers contains Protocol, Contracts,
App, and Data subsections. Risk & Trust owns risks, governance permissions, and security coverage;
Operations owns deployment snapshots and recovery procedures. Contributor policies live in Contributing.

Consolidated product and contributor pages are removed from `content/docs`, not merely hidden
from navigation. `next.config.mjs` preserves their old page, `/docs/*`, Markdown export, and
social image URLs with permanent redirects. Link new content to the canonical destination.

This is intentional because the app is expected to run behind a dedicated docs subdomain.

## Content Model

Documentation content lives in `content/docs`.

The Fumadocs loader in `lib/source.ts` builds:

- page trees
- page metadata
- search source material
- LLM export material

When writing or restructuring docs, the `content/docs` tree is the primary source of truth.

`source.config.ts` enables the Fumadocs `lastModified` plugin, so page-level "last updated"
timestamps come from Git history instead of filesystem mtimes.

## Search API

### Full-text Search

`app/api/search/route.ts` creates a Fumadocs search endpoint from the current content source.

## Structured Data

The app emits JSON-LD for:

- `WebSite` and `Organization` at the app shell level
- `TechArticle` and `BreadcrumbList` for documentation pages

These are generated from shared helpers rather than hardcoded in individual pages.

## Metadata And Public URL

The app uses `NEXT_PUBLIC_SITE_URL` to compute absolute metadata URLs.
The sidebar links use the official website and application URLs by default. Override
`NEXT_PUBLIC_WEBSITE_URL` or `NEXT_PUBLIC_APP_URL` to point them at another environment.
Optional verification tags can be supplied with:

- `GOOGLE_SITE_VERIFICATION`
- `BING_SITE_VERIFICATION`
- `YANDEX_VERIFICATION`
- `YAHOO_SITE_VERIFICATION`

If you deploy on Vercel and want accurate Git-based last-modified timestamps during build, set:

- `VERCEL_DEEP_CLONE=true`

Recommended local and production setup:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, set it to the final docs domain:

```bash
NEXT_PUBLIC_SITE_URL=https://docs.example.com
```

## Local Development

### Prerequisites

- Bun 1.4.3 (see `.bun-version` and `packageManager`)
- Node.js 24 LTS (see `.node-version`)

### Install

Run all commands from this repository's root.

```bash
bun install --frozen-lockfile
```

### Run

```bash
bun run dev
```

If you changed `content/docs` structure or `source.config.ts` and need to refresh generated
Fumadocs source files manually:

```bash
bun run docs:gen
```

Default local URL:

- [http://localhost:3000](http://localhost:3000)

## Quality Checks

```bash
bun run docs:gen
bun run diagrams:gen
bun run test:docs
bun run test:content
bun run lint
bun run types:check
bun run build
bun run test:markdown
```

Notes:

- `bun run lint` checks Biome without modifying files
- `bun run lint:fix` applies safe Biome fixes
- `bun run check` combines lint and Next route/TypeScript checks
- `bun run docs:gen` refreshes generated Fumadocs source files under `.source`
- `bun run types:check` regenerates Next route types before running TypeScript
- `bun run test:markdown` requires a production build, starts a temporary local server, and checks
  Markdown suffix/Accept requests, legacy `/docs/*` paths, HTML responses, and discovery endpoints

## Writing Documentation

### Diagrams

Use `<DocsDiagram name="architecture" />` in MDX. The component is registered in
`components/mdx.tsx` and renders static, accessible SVG on the server. Diagram
definitions live in `lib/diagrams.ts`; the shared Everstrat light/dark skin lives
in `components/docs-diagram.css`. No diagram runtime or client bundle is required.

Available names: `architecture`, `mint`, `exit`, `queue`, `nav`, `strategies`, `data`.
Embed each diagram on one canonical page. Other pages should link directly to its
`#everstrat-{name}-diagram` anchor. Keep the surrounding prose complete so search
and Markdown/LLM exports remain useful without the figure.

| Diagram | Canonical page |
| --- | --- |
| `architecture` | `/how-everstrat-works/architecture` |
| `mint` | `/using-everstrat/depositing-and-minting` |
| `exit` | `/using-everstrat/exiting-and-redeeming` |
| `queue` | `/how-everstrat-works/redemption-queue` |
| `nav` | `/how-everstrat-works/eve-and-nav` |
| `strategies` | `/how-everstrat-works/strategies-and-yield` |
| `data` | `/developers/data/subgraph-and-data-access` |

`bun run diagrams:gen` regenerates the self-contained HTML previews in
`public/diagrams/` from the same definitions, renderer, and stylesheet. Run it after
editing a diagram; the production build also runs it automatically. The figure's
**Open** link opens its HTML preview. Previews follow the system color scheme and
use Inter with a system-font fallback. Do not edit generated HTML directly.

Diagrams use Diagram Design's minimal style and `fit` geometry, customized to the
application palette and Inter typography. The SVG keeps its readable width inside
a local keyboard-accessible horizontal scroller; print output scales to the page.

### Content

When documenting the project:

- prefer concrete, current behavior over aspirational descriptions
- keep terminology aligned with `everstrat-xyz/contracts`, `everstrat-xyz/app`, and the Mermaid architecture diagrams in the contracts repository's `mermaid/` directory
- update docs when protocol flows, permissions, deployment assumptions, or frontend behavior change
- document user-facing and operator-facing constraints, not just ideal happy paths

## Related Workspaces

This workspace should stay aligned with:

- [`everstrat-xyz/contracts`](https://github.com/everstrat-xyz/contracts): protocol code and Mermaid diagrams
- [`everstrat-xyz/app`](https://github.com/everstrat-xyz/app): application and subgraph
- [`everstrat-xyz/website`](https://github.com/everstrat-xyz/website): landing page
- [`everstrat-xyz/keepers`](https://github.com/everstrat-xyz/keepers): Mimic automation
- [`everstrat-xyz/governance`](https://github.com/everstrat-xyz/governance): proposals and execution records

In practice, if those workspaces change, docs often need changes too.

## Vercel Repository Connection

When reconnecting the existing documentation project:

- select `everstrat-xyz/docs` and production branch `main`
- leave Root Directory empty so Vercel builds from the repository root
- remove any project-level Ignored Build Step that still filters `frontend-app`
- keep the existing environment variables, domains, and integrations
- use Node.js 24 and the Next.js preset; `vercel.json` pins Bun 1.4.3 for frozen installs and Turbopack builds
- retain `NEXT_PUBLIC_SITE_URL` for the production documentation domain 
- set `VERCEL_DEEP_CLONE=true` if builds need complete Git history for last-modified timestamps

The repository migration does not change the Vercel project configuration.

Native Takumi OG rendering stays outside the Turbopack server bundle through
`serverExternalPackages` in `next.config.mjs`. MDX collection generation remains
in `postinstall` and `docs:gen`.
